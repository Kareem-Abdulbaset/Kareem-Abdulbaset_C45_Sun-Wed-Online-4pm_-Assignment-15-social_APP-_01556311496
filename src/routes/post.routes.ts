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
import { validateParams } from "../common/pipes/validation.pipe";
import { validateBodyWithZod } from "../common/pipes/zod-validation.pipe";
import { IdParamDto, UserIdParamDto } from "../dtos/params.dto";
import { createPostDtoSchema, updatePostDtoSchema } from "../dtos/post.dto";

const router = Router();

router.get("/feed", asyncHandler(authentication), asyncHandler(getNewsFeed));
router.get("/profile/:userId", asyncHandler(authentication), validateParams(UserIdParamDto), asyncHandler(getProfilePosts));
router.post("/", asyncHandler(authentication), validateBodyWithZod(createPostDtoSchema), asyncHandler(createPost));
router.get("/", asyncHandler(authentication), asyncHandler(getAllPosts));
router.get("/:id", asyncHandler(authentication), validateParams(IdParamDto), asyncHandler(getPost));
router.patch("/:id", asyncHandler(authentication), validateParams(IdParamDto), validateBodyWithZod(updatePostDtoSchema), asyncHandler(updatePost));
router.delete("/:id", asyncHandler(authentication), validateParams(IdParamDto), asyncHandler(softDeletePost));
router.patch("/:id/restore", asyncHandler(authentication), validateParams(IdParamDto), asyncHandler(restorePost));
router.delete("/:id/hard", asyncHandler(authentication), validateParams(IdParamDto), asyncHandler(hardDeletePost));
router.put("/:id/reactions", asyncHandler(authentication), validateParams(IdParamDto), asyncHandler(setPostReaction));
router.delete("/:id/reactions", asyncHandler(authentication), validateParams(IdParamDto), asyncHandler(removePostReaction));
router.put("/:id/likes", asyncHandler(authentication), validateParams(IdParamDto), asyncHandler(setPostReaction));
router.delete("/:id/likes", asyncHandler(authentication), validateParams(IdParamDto), asyncHandler(removePostReaction));

export default router;
