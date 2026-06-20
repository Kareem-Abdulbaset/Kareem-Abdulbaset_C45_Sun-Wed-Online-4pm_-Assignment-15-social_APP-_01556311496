import { Router } from "express";
import {
  createComment,
  createReply,
  getComment,
  getCommentReplies,
  getPostComments,
  hardDeleteComment,
  removeCommentReaction,
  restoreComment,
  setCommentReaction,
  softDeleteComment,
  updateComment
} from "../controllers/comment.controller";
import { asyncHandler } from "../middlewares/asyncHandler";
import { authentication } from "../middlewares/auth.middleware";
import { validateBody, validateParams } from "../common/pipes/validation.pipe";
import { CreateCommentDto, UpdateCommentDto } from "../dtos/comment.dto";
import { IdParamDto, PostIdParamDto } from "../dtos/params.dto";

const router = Router();

router.post("/post/:postId", asyncHandler(authentication), validateParams(PostIdParamDto), validateBody(CreateCommentDto), asyncHandler(createComment));
router.get("/post/:postId", asyncHandler(authentication), validateParams(PostIdParamDto), asyncHandler(getPostComments));
router.post("/:id/replies", asyncHandler(authentication), validateParams(IdParamDto), validateBody(CreateCommentDto), asyncHandler(createReply));
router.get("/:id/replies", asyncHandler(authentication), validateParams(IdParamDto), asyncHandler(getCommentReplies));
router.get("/:id", asyncHandler(authentication), validateParams(IdParamDto), asyncHandler(getComment));
router.patch("/:id", asyncHandler(authentication), validateParams(IdParamDto), validateBody(UpdateCommentDto, { requireAtLeastOne: true }), asyncHandler(updateComment));
router.delete("/:id", asyncHandler(authentication), validateParams(IdParamDto), asyncHandler(softDeleteComment));
router.patch("/:id/restore", asyncHandler(authentication), validateParams(IdParamDto), asyncHandler(restoreComment));
router.delete("/:id/hard", asyncHandler(authentication), validateParams(IdParamDto), asyncHandler(hardDeleteComment));
router.put("/:id/reactions", asyncHandler(authentication), validateParams(IdParamDto), asyncHandler(setCommentReaction));
router.delete("/:id/reactions", asyncHandler(authentication), validateParams(IdParamDto), asyncHandler(removeCommentReaction));
router.put("/:id/likes", asyncHandler(authentication), validateParams(IdParamDto), asyncHandler(setCommentReaction));
router.delete("/:id/likes", asyncHandler(authentication), validateParams(IdParamDto), asyncHandler(removeCommentReaction));

export default router;
