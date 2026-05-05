import { Router } from "express";
import {
  createPost,
  deletePost,
  getAllPosts,
  getPost,
  updatePost
} from "../controllers/post.controller";
import { asyncHandler } from "../middlewares/asyncHandler";
import { authentication } from "../middlewares/auth.middleware";

const router = Router();

router.post("/", asyncHandler(authentication), asyncHandler(createPost));
router.get("/", asyncHandler(authentication), asyncHandler(getAllPosts));
router.get("/:id", asyncHandler(authentication), asyncHandler(getPost));
router.patch("/:id", asyncHandler(authentication), asyncHandler(updatePost));
router.delete("/:id", asyncHandler(authentication), asyncHandler(deletePost));

export default router;
