import { Injectable } from "@nestjs/common";
import bcrypt from "bcryptjs";
import { OAuth2Client, type TokenPayload } from "google-auth-library";
import { User } from "../../models/user.model";
import { AppError } from "../../utils/AppError";
import { generateCode } from "../../utils/code";
import { createNumericOtp, signOtpValue, verifyOtpValue } from "../../utils/otp";
import { env } from "../../config/env";
import { RedisService } from "../../common/services/redis.service";
import { EmailService } from "../../common/services/email.service";
import { TokenService } from "../../common/services/token.service";

const googleClient = new OAuth2Client();
const RESET_PASSWORD_SCOPE = "reset-password";

type ResetPasswordChallenge = {
  issuedAt: number;
  signature: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly redisService: RedisService,
    private readonly emailService: EmailService,
    private readonly tokenService: TokenService
  ) {}

  private cleanEmail(email: string) {
    return email.toLowerCase().trim();
  }

  private async hashPassword(password: string) {
    return bcrypt.hash(password, env.bcryptSalt);
  }

  private async sendCode(email: string, key: string, subject: string) {
    const code = generateCode();
    await this.redisService.saveCode(key, code);
    await this.emailService.sendEmail(email, subject, `<h2>Your code is ${code}</h2>`);
  }

  private buildResetPasswordKey(email: string) {
    return `reset:${email}`;
  }

  private readResetChallenge(value: string | null) {
    if (!value) {
      return null;
    }

    try {
      const parsed = JSON.parse(value) as Partial<ResetPasswordChallenge>;

      if (typeof parsed.issuedAt !== "number" || typeof parsed.signature !== "string") {
        return { legacyCode: value };
      }

      return {
        issuedAt: parsed.issuedAt,
        signature: parsed.signature
      };
    } catch {
      return { legacyCode: value };
    }
  }

  private resolveResetOtp(body: any) {
    if (typeof body?.otp === "string" && body.otp.trim()) {
      return body.otp.trim();
    }

    if (typeof body?.code === "string" && body.code.trim()) {
      return body.code.trim();
    }

    return "";
  }

  private async sendResetPasswordOtp(email: string) {
    const otp = createNumericOtp();
    const challenge: ResetPasswordChallenge = {
      issuedAt: Date.now(),
      signature: signOtpValue(RESET_PASSWORD_SCOPE, email, otp)
    };
    const ttlMinutes = Math.max(1, Math.ceil(env.resetCodeSeconds / 60));

    await this.redisService.saveCode(
      this.buildResetPasswordKey(email),
      JSON.stringify(challenge),
      env.resetCodeSeconds
    );

    await this.emailService.sendEmail(
      email,
      "Reset password",
      [
        "<h2>Password reset request</h2>",
        "<p>Use the following verification code to continue:</p>",
        `<h1>${otp}</h1>`,
        `<p>This code expires in ${ttlMinutes} minute${ttlMinutes === 1 ? "" : "s"}.</p>`
      ].join("")
    );
  }

  private getGoogleDisplayName(payload: TokenPayload) {
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
  }

  private getGoogleTokenFromBody(body: any) {
    if (typeof body?.idToken === "string" && body.idToken.trim()) {
      return body.idToken.trim();
    }

    if (typeof body?.credential === "string" && body.credential.trim()) {
      return body.credential.trim();
    }

    return "";
  }

  private async findOrCreateGoogleUser(payload: TokenPayload) {
    if (!payload.sub) {
      throw new AppError("Google account id is missing", 400);
    }

    if (!payload.email || !payload.email_verified) {
      throw new AppError("Google email is not verified", 400);
    }

    const email = this.cleanEmail(payload.email);
    let user = await User.findOne({ googleId: payload.sub, deletedAt: null });

    if (!user) {
      user = await User.findOne({ email, deletedAt: null });
    }

    if (!user) {
      user = await User.create({
        name: this.getGoogleDisplayName(payload),
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
  }

  async signup(body: { name: string; email: string; password: string }) {
    const { name, email, password } = body;

    if (!name || !email || !password) {
      throw new AppError("Name, email and password are required", 400);
    }

    if (password.length < 6) {
      throw new AppError("Password must be at least 6 characters", 400);
    }

    const userEmail = this.cleanEmail(email);
    const exists = await User.findOne({ email: userEmail });

    if (exists) {
      throw new AppError("Email already exists", 409);
    }

    const hashedPassword = await this.hashPassword(password);

    await User.create({
      name,
      email: userEmail,
      password: hashedPassword,
      provider: "local",
      isConfirmed: false
    });

    await this.sendCode(userEmail, `confirm:${userEmail}`, "Confirm email");

    return {
      success: true,
      message: "Signup done, check your email"
    };
  }

  async confirmEmail(body: { email: string; code: string }) {
    const { email, code } = body;

    if (!email || !code) {
      throw new AppError("Email and code are required", 400);
    }

    const userEmail = this.cleanEmail(email);
    const user = await User.findOne({ email: userEmail, deletedAt: null });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (user.isConfirmed) {
      return {
        success: true,
        message: "Email already confirmed"
      };
    }

    const savedCode = await this.redisService.getCode(`confirm:${userEmail}`);

    if (!savedCode || savedCode !== code) {
      throw new AppError("Invalid code", 400);
    }

    user.isConfirmed = true;
    await user.save();
    await this.redisService.deleteKey(`confirm:${userEmail}`);

    return {
      success: true,
      message: "Email confirmed"
    };
  }

  async login(body: { email: string; password: string }) {
    const { email, password } = body;

    if (!email || !password) {
      throw new AppError("Email and password are required", 400);
    }

    const user = await User.findOne({ email: this.cleanEmail(email), deletedAt: null }).select("+password");

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

    const token = this.tokenService.createToken(user._id.toString());

    return {
      success: true,
      token
    };
  }

  async googleLogin(body: any) {
    const idToken = this.getGoogleTokenFromBody(body);

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

    const user = await this.findOrCreateGoogleUser(payload);
    const token = this.tokenService.createToken(user._id.toString());

    return {
      success: true,
      token
    };
  }

  async forgotPassword(body: { email: string }) {
    const { email } = body;

    if (!email) {
      throw new AppError("Email is required", 400);
    }

    const userEmail = this.cleanEmail(email);
    const user = await User.findOne({ email: userEmail, deletedAt: null });

    if (user) {
      await this.sendResetPasswordOtp(userEmail);
    }

    return {
      success: true,
      message: "If email exists, reset code will be sent"
    };
  }

  async resetPassword(body: any) {
    const { email, password } = body;
    const otp = this.resolveResetOtp(body);

    if (!email || !otp || !password) {
      throw new AppError("Email, otp and password are required", 400);
    }

    if (password.length < 6) {
      throw new AppError("Password must be at least 6 characters", 400);
    }

    const userEmail = this.cleanEmail(email);
    const resetKey = this.buildResetPasswordKey(userEmail);
    const challenge = this.readResetChallenge(await this.redisService.getCode(resetKey));

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

    user.password = await this.hashPassword(password);
    user.provider = "local";
    user.isConfirmed = true;
    user.passwordChangedAt = new Date(Date.now() - 1000);
    await user.save();
    await this.redisService.deleteKey(resetKey);

    return {
      success: true,
      message: "Password changed"
    };
  }

  async updatePassword(userId: string, body: { oldPassword: string; newPassword: string }) {
    const { oldPassword, newPassword } = body;

    if (!oldPassword || !newPassword) {
      throw new AppError("Old password and new password are required", 400);
    }

    if (newPassword.length < 6) {
      throw new AppError("Password must be at least 6 characters", 400);
    }

    const user = await User.findOne({ _id: userId, deletedAt: null }).select("+password");

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

    user.password = await this.hashPassword(newPassword);
    user.passwordChangedAt = new Date(Date.now() - 1000);
    await user.save();

    const token = this.tokenService.createToken(user._id.toString());

    return {
      success: true,
      token,
      message: "Password updated"
    };
  }

  async logout(token: string) {
    if (!token) {
      throw new AppError("Token is required", 401);
    }

    const seconds = this.tokenService.getTokenExpirySeconds(token);

    await this.redisService.addTokenToBlacklist(token, seconds);

    return {
      success: true,
      message: "Logged out"
    };
  }
}
