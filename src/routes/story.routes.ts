import { Router } from "express";
import {
  createStory,
  getActiveStories,
  getMyStories,
  getStory,
  hardDeleteStory,
  removeStoryReaction,
  restoreStory,
  setStoryReaction,
  softDeleteStory,
  updateStory
} from "../controllers/story.controller";
import { asyncHandler } from "../middlewares/asyncHandler";
import { authentication } from "../middlewares/auth.middleware";

const router = Router();

router.post("/", asyncHandler(authentication), asyncHandler(createStory));
router.get("/", asyncHandler(authentication), asyncHandler(getActiveStories));
router.get("/me", asyncHandler(authentication), asyncHandler(getMyStories));
router.get("/:id", asyncHandler(authentication), asyncHandler(getStory));
router.patch("/:id", asyncHandler(authentication), asyncHandler(updateStory));
router.delete("/:id", asyncHandler(authentication), asyncHandler(softDeleteStory));
router.patch("/:id/restore", asyncHandler(authentication), asyncHandler(restoreStory));
router.delete("/:id/hard", asyncHandler(authentication), asyncHandler(hardDeleteStory));
router.put("/:id/reactions", asyncHandler(authentication), asyncHandler(setStoryReaction));
router.delete("/:id/reactions", asyncHandler(authentication), asyncHandler(removeStoryReaction));

export default router;
