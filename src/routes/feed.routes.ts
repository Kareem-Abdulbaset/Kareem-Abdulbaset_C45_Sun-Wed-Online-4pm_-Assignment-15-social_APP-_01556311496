import { Router } from "express";
import { getNewsFeed } from "../controllers/post.controller";
import { asyncHandler } from "../middlewares/asyncHandler";
import { authentication } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", asyncHandler(authentication), asyncHandler(getNewsFeed));

export default router;
