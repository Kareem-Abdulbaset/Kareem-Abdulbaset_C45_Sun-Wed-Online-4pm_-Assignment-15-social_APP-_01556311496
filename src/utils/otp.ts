import { createHash, randomInt, timingSafeEqual } from "crypto";
import { env } from "../config/env";

export const createNumericOtp = (length = 6) => {
  const upperBound = 10 ** length;
  return randomInt(0, upperBound).toString().padStart(length, "0");
};

export const signOtpValue = (scope: string, identifier: string, otp: string) => {
  return createHash("sha256")
    .update(`${env.otpSecret}:${scope}:${identifier}:${otp}`)
    .digest("hex");
};

export const verifyOtpValue = (
  expectedSignature: string,
  scope: string,
  identifier: string,
  otp: string
) => {
  const providedSignature = signOtpValue(scope, identifier, otp);
  const expectedBuffer = Buffer.from(expectedSignature, "hex");
  const providedBuffer = Buffer.from(providedSignature, "hex");

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, providedBuffer);
};
