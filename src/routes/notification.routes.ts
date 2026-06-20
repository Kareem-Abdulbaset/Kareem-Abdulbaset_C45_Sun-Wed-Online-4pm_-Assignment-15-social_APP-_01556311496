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
import { validateBody, validateParams } from "../common/pipes/validation.pipe";
import { CreateNotificationDto, FcmTokenDto, UpdateNotificationDto } from "../dtos/notification.dto";
import { IdParamDto } from "../dtos/params.dto";

const router = Router();

router.post("/fcm-token", asyncHandler(authentication), validateBody(FcmTokenDto), asyncHandler(storeFcmToken));
router.delete("/fcm-token", asyncHandler(authentication), validateBody(FcmTokenDto), asyncHandler(removeFcmToken));
router.post("/test", asyncHandler(authentication), validateBody(CreateNotificationDto), asyncHandler(sendNotificationToMe));
router.get("/me", asyncHandler(authentication), asyncHandler(getMyNotifications));
router.post("/", asyncHandler(authentication), authorization("admin"), validateBody(CreateNotificationDto), asyncHandler(createNotification));
router.get("/", asyncHandler(authentication), authorization("admin"), asyncHandler(getAllNotifications));
router.get("/:id", asyncHandler(authentication), validateParams(IdParamDto), asyncHandler(getNotification));
router.patch("/:id/read", asyncHandler(authentication), validateParams(IdParamDto), asyncHandler(markNotificationAsRead));
router.patch("/:id", asyncHandler(authentication), authorization("admin"), validateParams(IdParamDto), validateBody(UpdateNotificationDto, { requireAtLeastOne: true }), asyncHandler(updateNotification));
router.delete("/:id", asyncHandler(authentication), authorization("admin"), validateParams(IdParamDto), asyncHandler(softDeleteNotification));
router.patch("/:id/restore", asyncHandler(authentication), authorization("admin"), validateParams(IdParamDto), asyncHandler(restoreNotification));
router.delete("/:id/hard", asyncHandler(authentication), authorization("admin"), validateParams(IdParamDto), asyncHandler(hardDeleteNotification));
router.post("/:id/send", asyncHandler(authentication), authorization("admin"), validateParams(IdParamDto), asyncHandler(sendNotification));

export default router;
