import { Router } from "express";
import {
  createPost,
  getAllPosts,
  getNewsFeed,
  getPost,
  getProfilePosts,
  hardDeletePost,
  removePostReaction,
  restorePost,
  setPostReaction,
  softDeletePost,
  updatePost
} from "../controllers/post.controller";
import { asyncHandler } from "../middlewares/asyncHandler";
import { authentication } from "../middlewares/auth.middleware";

const router = Router();

router.get("/feed", asyncHandler(authentication), asyncHandler(getNewsFeed));
router.get("/profile/:userId", asyncHandler(authentication), asyncHandler(getProfilePosts));
router.post("/", asyncHandler(authentication), asyncHandler(createPost));
router.get("/", asyncHandler(authentication), asyncHandler(getAllPosts));
router.get("/:id", asyncHandler(authentication), asyncHandler(getPost));
router.patch("/:id", asyncHandler(authentication), asyncHandler(updatePost));
router.delete("/:id", asyncHandler(authentication), asyncHandler(softDeletePost));
router.patch("/:id/restore", asyncHandler(authentication), asyncHandler(restorePost));
router.delete("/:id/hard", asyncHandler(authentication), asyncHandler(hardDeletePost));
router.put("/:id/reactions", asyncHandler(authentication), asyncHandler(setPostReaction));
router.delete("/:id/reactions", asyncHandler(authentication), asyncHandler(removePostReaction));

export default router;
