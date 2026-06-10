import { Router } from "express";
import {
  createGroupChat,
  createPrivateChat,
  getChat,
  getChatUserData,
  getGroupChat,
  getMyChats,
  joinRoom,
  sendChatMessage,
  sendGroupMessage,
  sendMessage
} from "../controllers/chat.controller";
import { asyncHandler } from "../middlewares/asyncHandler";
import { authentication } from "../middlewares/auth.middleware";

const router = Router();

router.use(asyncHandler(authentication));

router.get("/me", asyncHandler(getChatUserData));
router.get("/", asyncHandler(getMyChats));
router.post("/private", asyncHandler(createPrivateChat));
router.post("/message", asyncHandler(sendMessage));
router.post("/group", asyncHandler(createGroupChat));
router.get("/group/:id", asyncHandler(getGroupChat));
router.post("/group/:id/messages", asyncHandler(sendGroupMessage));
router.patch("/:id/join", asyncHandler(joinRoom));
router.get("/:id", asyncHandler(getChat));
router.post("/:id/messages", asyncHandler(sendChatMessage));

export default router;
