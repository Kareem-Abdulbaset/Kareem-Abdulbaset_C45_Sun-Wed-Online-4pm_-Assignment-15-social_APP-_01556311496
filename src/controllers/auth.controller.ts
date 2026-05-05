import bcrypt from "bcryptjs";
import { OAuth2Client, type TokenPayload } from "google-auth-library";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response } from "express";
import { User } from "../models/user.model";
import { AppError } from "../utils/AppError";
import { generateCode } from "../utils/code";
import { createNumericOtp, signOtpValue, verifyOtpValue } from "../utils/otp";
import { createToken } from "../utils/token";
import { env } from "../config/env";
import { addTokenToBlacklist, deleteKey, getCode, saveCode } from "../services/redis.service";
import { sendEmail } from "../services/email.service";

const googleClient = new OAuth2Client();
const RESET_PASSWORD_SCOPE = "reset-password";

type ResetPasswordChallenge = {
  issuedAt: number;
  signature: string;
};

type LegacyResetPasswordChallenge = {
  legacyCode: string;
};

const cleanEmail = (email: string) => {
  return email.toLowerCase().trim();
};

const hashPassword = async (password: string) => {
  return bcrypt.hash(password, env.bcryptSalt);
};

const sendCode = async (email: string, key: string, subject: string) => {
  const code = generateCode();
  await saveCode(key, code);
  await sendEmail(email, subject, `<h2>Your code is ${code}</h2>`);
};

const buildResetPasswordKey = (email: string) => {
  return `reset:${email}`;
};

const readResetChallenge = (value: string | null) => {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<ResetPasswordChallenge>;

    if (typeof parsed.issuedAt !== "number" || typeof parsed.signature !== "string") {
      return {
        legacyCode: value
      };
    }

    return {
      issuedAt: parsed.issuedAt,
      signature: parsed.signature
    };
  } catch {
    return {
      legacyCode: value
    };
  }
};

const resolveResetOtp = (body: Request["body"]) => {
  if (typeof body?.otp === "string" && body.otp.trim()) {
    return body.otp.trim();
  }

  if (typeof body?.code === "string" && body.code.trim()) {
    return body.code.trim();
  }

  return "";
};

const sendResetPasswordOtp = async (email: string) => {
  const otp = createNumericOtp();
  const challenge: ResetPasswordChallenge = {issuedAt: Date.now(),
    signature: signOtpValue(RESET_PASSWORD_SCOPE, email, otp)
  };
  const ttlMinutes = Math.max(1, Math.ceil(env.resetCodeSeconds / 60));

  await saveCode(
    buildResetPasswordKey(email),
    JSON.stringify(challenge),
    env.resetCodeSeconds
  );

  await sendEmail(email,"Reset password",
    [
      "<h2>Password reset request</h2>",
      "<p>Use the following verification code to continue:</p>",
      `<h1>${otp}</h1>`,
      `<p>This code expires in ${ttlMinutes} minute${ttlMinutes === 1 ? "" : "s"}.</p>`
    ].join("")
  );
};

const getGoogleDisplayName = (payload: TokenPayload) => {
  const parts = [payload.given_name, payload.family_name].filter(
    (value): value is string => Boolean(value && value.trim())
  );

  if (parts.length) {
    return parts.join(" ");
  }

  if (payload.name?.trim()) {
    return payload.name.trim();
  }

  return payload.email?.split("@")[0] || "User";
};

const getGoogleTokenFromBody = (body: Request["body"]) => {
  if (typeof body?.idToken === "string" && body.idToken.trim()) {
    return body.idToken.trim();
  }

  if (typeof body?.credential === "string" && body.credential.trim()) {
    return body.credential.trim();
  }

  return "";
};

const findOrCreateGoogleUser = async (payload: TokenPayload) => {
  if (!payload.sub) {
    throw new AppError("Google account id is missing", 400);
  }

  if (!payload.email || !payload.email_verified) {
    throw new AppError("Google email is not verified", 400);
  }

  const email = cleanEmail(payload.email);
  let user = await User.findOne({ googleId: payload.sub, deletedAt: null });

  if (!user) {
    user = await User.findOne({ email, deletedAt: null });
  }

  if (!user) {
    user = await User.create({
      name: getGoogleDisplayName(payload),
      email,
      googleId: payload.sub,
      provider: "google",
      isConfirmed: true
    });

    return user;
  }

  if (user.googleId && user.googleId !== payload.sub) {
    throw new AppError("This email is already linked to another Google account", 409);
  }

  let shouldSave = false;

  if (!user.googleId) {
    user.googleId = payload.sub;
    shouldSave = true;
  }

  if (!user.isConfirmed) {
    user.isConfirmed = true;
    shouldSave = true;
  }

  if (shouldSave) {
    await user.save();
  }

  return user;
};

export const signup = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new AppError("Name, email and password are required", 400);
  }

  if (password.length < 6) {
    throw new AppError("Password must be at least 6 characters", 400);
  }

  const userEmail = cleanEmail(email);
  const exists = await User.findOne({ email: userEmail });

  if (exists) {
    throw new AppError("Email already exists", 409);
  }

  const hashedPassword = await hashPassword(password);

  await User.create({
    name,
    email: userEmail,
    password: hashedPassword,
    provider: "local",
    isConfirmed: false
  });

  await sendCode(userEmail, `confirm:${userEmail}`, "Confirm email");

  res.status(201).json({
    success: true,
    message: "Signup done, check your email"
  });
};



export const confirmEmail = async (req: Request, res: Response) => {
  const { email, code } = req.body;

  if (!email || !code) {
    throw new AppError("Email and code are required", 400);
  }

  const userEmail = cleanEmail(email);
  const user = await User.findOne({ email: userEmail, deletedAt: null });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.isConfirmed) {
    return res.json({
      success: true,
      message: "Email already confirmed"
    });
  }

  const savedCode = await getCode(`confirm:${userEmail}`);

  if (!savedCode || savedCode !== code) {
    throw new AppError("Invalid code", 400);
  }

  user.isConfirmed = true;
  await user.save();
  await deleteKey(`confirm:${userEmail}`);

  res.json({
    success: true,
    message: "Email confirmed"
  });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError("Email and password are required", 400);
  }

  const user = await User.findOne({ email: cleanEmail(email), deletedAt: null }).select("+password");

  if (!user || !user.password) {
    throw new AppError("Invalid email or password", 401);
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new AppError("Invalid email or password", 401);
  }

  if (!user.isConfirmed) {
    throw new AppError("Please confirm your email", 403);
  }

  const token = createToken(user._id.toString());

  res.json({
    success: true,
    token
  });
};

export const googleLogin = async (req: Request, res: Response) => {
  const idToken = getGoogleTokenFromBody(req.body);

  if (!env.googleClientId) {
    throw new AppError("Google client id is missing", 500);
  }

  if (!idToken) {
    throw new AppError("Google token is required", 400);
  }

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: env.googleClientId
  });

  const payload = ticket.getPayload();

  if (!payload) {
    throw new AppError("Unable to verify Google account", 400);
  }

  const user = await findOrCreateGoogleUser(payload);

  const token = createToken(user._id.toString());

  res.json({
    success: true,
    token
  });
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    throw new AppError("Email is required", 400);
  }

  const userEmail = cleanEmail(email);
  const user = await User.findOne({ email: userEmail, deletedAt: null });

  if (user) {
    await sendResetPasswordOtp(userEmail);
  }

  res.json({
    success: true,
    message: "If email exists, reset code will be sent"
  });
};

export const resetPassword = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const otp = resolveResetOtp(req.body);

  if (!email || !otp || !password) {
    throw new AppError("Email, otp and password are required", 400);
  }

  if (password.length < 6) {
    throw new AppError("Password must be at least 6 characters", 400);
  }

  const userEmail = cleanEmail(email);
  const resetKey = buildResetPasswordKey(userEmail);
  const challenge = readResetChallenge(await getCode(resetKey));

  if (!challenge) {
    throw new AppError("Reset code is invalid or expired", 400);
  }

  const isOtpValid = "legacyCode" in challenge
    ? challenge.legacyCode === otp
    : verifyOtpValue(challenge.signature, RESET_PASSWORD_SCOPE, userEmail, otp);

  if (!isOtpValid) {
    throw new AppError("Reset code is invalid or expired", 400);
  }

  const user = await User.findOne({ email: userEmail, deletedAt: null });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  user.password = await hashPassword(password);
  user.provider = "local";
  user.isConfirmed = true;
  user.passwordChangedAt = new Date(Date.now() - 1000);
  await user.save();
  await deleteKey(resetKey);

  res.json({
    success: true,
    message: "Password changed"
  });
};

export const updatePassword = async (req: Request, res: Response) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new AppError("Old password and new password are required", 400);
  }

  if (newPassword.length < 6) {
    throw new AppError("Password must be at least 6 characters", 400);
  }

  const user = await User.findOne({ _id: req.user?._id, deletedAt: null }).select("+password");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (!user.password) {
    throw new AppError("This account has no password", 400);
  }

  const isMatch = await bcrypt.compare(oldPassword, user.password);

  if (!isMatch) {
    throw new AppError("Old password is wrong", 400);
  }

  user.password = await hashPassword(newPassword);
  user.passwordChangedAt = new Date(Date.now() - 1000);
  await user.save();

  const token = createToken(user._id.toString());

  res.json({
    success: true,
    token,
    message: "Password updated"
  });
};

export const logout = async (req: Request, res: Response) => {
  const token = req.token;

  if (!token) {
    throw new AppError("Token is required", 401);
  }

  const decoded = jwt.decode(token) as JwtPayload | null;
  let seconds = env.jwtBlacklistSeconds;

  if (decoded?.exp) {
    seconds = Math.max(decoded.exp - Math.floor(Date.now() / 1000), 1);
  }

  await addTokenToBlacklist(token, seconds);

  res.json({
    success: true,
    message: "Logged out"
  });
};

export const getProfile = async (req: Request, res: Response) => {
  res.json({
    success: true,
    user: req.user
  });
};
