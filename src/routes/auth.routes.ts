import { Router } from "express";
import {
  confirmEmail,
  forgotPassword,
  getProfile,
  googleLogin,
  login,
  logout,
  resetPassword,
  signup,
  updatePassword
} from "../controllers/auth.controller";
import { asyncHandler } from "../middlewares/asyncHandler";
import { authentication } from "../middlewares/auth.middleware";
import { validateBody } from "../common/pipes/validation.pipe";
import {
  ConfirmEmailDto,
  ForgotPasswordDto,
  GoogleLoginDto,
  LoginDto,
  ResetPasswordDto,
  SignupDto,
  UpdatePasswordDto
} from "../dtos/auth.dto";

const router = Router();

router.post("/signup", validateBody(SignupDto), asyncHandler(signup));
router.post("/confirm-email", validateBody(ConfirmEmailDto), asyncHandler(confirmEmail));
router.post("/login", validateBody(LoginDto), asyncHandler(login));
router.post("/google", validateBody(GoogleLoginDto), asyncHandler(googleLogin));
router.post("/gmail-login", validateBody(GoogleLoginDto), asyncHandler(googleLogin));
router.post("/forgot-password", validateBody(ForgotPasswordDto), asyncHandler(forgotPassword));
router.post("/reset-password", validateBody(ResetPasswordDto), asyncHandler(resetPassword));
router.patch("/update-password", asyncHandler(authentication), validateBody(UpdatePasswordDto), asyncHandler(updatePassword));
router.post("/logout", asyncHandler(authentication), asyncHandler(logout));
router.get("/me", asyncHandler(authentication), asyncHandler(getProfile));

export default router;
