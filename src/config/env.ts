import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT) || 3000,
  mongoUrl: process.env.MONGO_URL || "mongodb://127.0.0.1:27017/social_media_app",
  redisUrl: process.env.REDIS_URL || "redis://127.0.0.1:6379",
  jwtSecret: process.env.JWT_SECRET || "secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  jwtBlacklistSeconds: Number(process.env.JWT_BLACKLIST_SECONDS) || 604800,
  otpSecret: process.env.OTP_SECRET || process.env.JWT_SECRET || "secret",
  resetCodeSeconds: Number(process.env.RESET_CODE_SECONDS) || 3600,
  bcryptSalt: Number(process.env.BCRYPT_SALT) || 8,
  clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
  email: {
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === "true",
    user: process.env.EMAIL_USER || "",
    pass: process.env.EMAIL_PASS || "",
    from: process.env.EMAIL_FROM || "Social App <no-reply@socialapp.com>"
  },
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || "",
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "",
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n") || ""
  }
};
