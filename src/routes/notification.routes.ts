import { Router } from "express";
import {
  createNotification,
  getAllNotifications,
  getMyNotifications,
  getNotification,
  hardDeleteNotification,
  markNotificationAsRead,
  removeFcmToken,
  restoreNotification,
  sendNotification,
  sendNotificationToMe,
  softDeleteNotification,
  storeFcmToken,
  updateNotification
} from "../controllers/notification.controller";
import { asyncHandler } from "../middlewares/asyncHandler";
import { authentication, authorization } from "../middlewares/auth.middleware";

const router = Router();

router.post("/fcm-token", asyncHandler(authentication), asyncHandler(storeFcmToken));
router.delete("/fcm-token", asyncHandler(authentication), asyncHandler(removeFcmToken));
router.post("/test", asyncHandler(authentication), asyncHandler(sendNotificationToMe));
router.get("/me", asyncHandler(authentication), asyncHandler(getMyNotifications));
router.post("/", asyncHandler(authentication), authorization("admin"), asyncHandler(createNotification));
router.get("/", asyncHandler(authentication), authorization("admin"), asyncHandler(getAllNotifications));
router.get("/:id", asyncHandler(authentication), asyncHandler(getNotification));
router.patch("/:id/read", asyncHandler(authentication), asyncHandler(markNotificationAsRead));
router.patch("/:id", asyncHandler(authentication), authorization("admin"), asyncHandler(updateNotification));
router.delete("/:id", asyncHandler(authentication), authorization("admin"), asyncHandler(softDeleteNotification));
router.patch("/:id/restore", asyncHandler(authentication), authorization("admin"), asyncHandler(restoreNotification));
router.delete("/:id/hard", asyncHandler(authentication), authorization("admin"), asyncHandler(hardDeleteNotification));
router.post("/:id/send", asyncHandler(authentication), authorization("admin"), asyncHandler(sendNotification));

export default router;
