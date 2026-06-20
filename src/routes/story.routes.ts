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
import { validateBody, validateParams } from "../common/pipes/validation.pipe";
import { IdParamDto } from "../dtos/params.dto";
import { StoryDto, StoryReactionDto } from "../dtos/story.dto";

const router = Router();

router.post("/", asyncHandler(authentication), validateBody(StoryDto), asyncHandler(createStory));
router.get("/", asyncHandler(authentication), asyncHandler(getActiveStories));
router.get("/me", asyncHandler(authentication), asyncHandler(getMyStories));
router.get("/:id", asyncHandler(authentication), validateParams(IdParamDto), asyncHandler(getStory));
router.patch("/:id", asyncHandler(authentication), validateParams(IdParamDto), validateBody(StoryDto), asyncHandler(updateStory));
router.delete("/:id", asyncHandler(authentication), validateParams(IdParamDto), asyncHandler(softDeleteStory));
router.patch("/:id/restore", asyncHandler(authentication), validateParams(IdParamDto), asyncHandler(restoreStory));
router.delete("/:id/hard", asyncHandler(authentication), validateParams(IdParamDto), asyncHandler(hardDeleteStory));
router.put("/:id/reactions", asyncHandler(authentication), validateParams(IdParamDto), validateBody(StoryReactionDto), asyncHandler(setStoryReaction));
router.delete("/:id/reactions", asyncHandler(authentication), validateParams(IdParamDto), asyncHandler(removeStoryReaction));

export default router;
