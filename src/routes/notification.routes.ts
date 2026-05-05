import { Router } from "express";
import {
  removeFcmToken,
  sendNotificationToMe,
  sendNotificationToUser,
  storeFcmToken
} from "../controllers/notification.controller";
import { asyncHandler } from "../middlewares/asyncHandler";
import { authentication, authorization } from "../middlewares/auth.middleware";

const router = Router();

router.post("/fcm-token", asyncHandler(authentication), asyncHandler(storeFcmToken));
router.delete("/fcm-token", asyncHandler(authentication), asyncHandler(removeFcmToken));
router.post("/test", asyncHandler(authentication), asyncHandler(sendNotificationToMe));
router.post(
  "/send",
  asyncHandler(authentication),
  authorization("admin"),
  asyncHandler(sendNotificationToUser)
);

export default router;
