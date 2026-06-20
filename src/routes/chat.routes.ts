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
import { validateBody, validateParams } from "../common/pipes/validation.pipe";
import {
  CreateGroupChatDto,
  CreatePrivateChatDto,
  SendChatMessageDto,
  SendPrivateMessageDto
} from "../dtos/chat.dto";
import { IdParamDto } from "../dtos/params.dto";

const router = Router();

router.use(asyncHandler(authentication));

router.get("/me", asyncHandler(getChatUserData));
router.get("/", asyncHandler(getMyChats));
router.post("/private", validateBody(CreatePrivateChatDto), asyncHandler(createPrivateChat));
router.post("/message", validateBody(SendPrivateMessageDto), asyncHandler(sendMessage));
router.post("/group", validateBody(CreateGroupChatDto), asyncHandler(createGroupChat));
router.get("/group/:id", validateParams(IdParamDto), asyncHandler(getGroupChat));
router.post("/group/:id/messages", validateParams(IdParamDto), validateBody(SendChatMessageDto), asyncHandler(sendGroupMessage));
router.patch("/:id/join", validateParams(IdParamDto), asyncHandler(joinRoom));
router.get("/:id", validateParams(IdParamDto), asyncHandler(getChat));
router.post("/:id/messages", validateParams(IdParamDto), validateBody(SendChatMessageDto), asyncHandler(sendChatMessage));

export default router;
