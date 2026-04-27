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

const router = Router();

router.post("/signup", asyncHandler(signup));
router.post("/confirm-email", asyncHandler(confirmEmail));
router.post("/login", asyncHandler(login));
router.post("/google", asyncHandler(googleLogin));
router.post("/gmail-login", asyncHandler(googleLogin));
router.post("/forgot-password", asyncHandler(forgotPassword));
router.post("/reset-password", asyncHandler(resetPassword));
router.patch("/update-password", asyncHandler(authentication), asyncHandler(updatePassword));
router.post("/logout", asyncHandler(authentication), asyncHandler(logout));
router.get("/me", asyncHandler(authentication), asyncHandler(getProfile));

export default router;
