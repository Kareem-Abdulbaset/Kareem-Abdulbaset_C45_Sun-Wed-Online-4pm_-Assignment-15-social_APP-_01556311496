import { Router } from "express";
import {
  createComment,
  getComment,
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

const router = Router();

router.post("/post/:postId", asyncHandler(authentication), asyncHandler(createComment));
router.get("/post/:postId", asyncHandler(authentication), asyncHandler(getPostComments));
router.get("/:id", asyncHandler(authentication), asyncHandler(getComment));
router.patch("/:id", asyncHandler(authentication), asyncHandler(updateComment));
router.delete("/:id", asyncHandler(authentication), asyncHandler(softDeleteComment));
router.patch("/:id/restore", asyncHandler(authentication), asyncHandler(restoreComment));
router.delete("/:id/hard", asyncHandler(authentication), asyncHandler(hardDeleteComment));
router.put("/:id/reactions", asyncHandler(authentication), asyncHandler(setCommentReaction));
router.delete("/:id/reactions", asyncHandler(authentication), asyncHandler(removeCommentReaction));

export default router;
