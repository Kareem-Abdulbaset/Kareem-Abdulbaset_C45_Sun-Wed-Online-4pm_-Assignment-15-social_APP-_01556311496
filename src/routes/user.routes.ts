import { Router } from "express";
import {
  createUser,
  getAllUsers,
  getDashboard,
  getUser,
  hardDeleteUser,
  restoreUser,
  softDeleteMe,
  softDeleteUser,
  updateMe,
  updateUser
} from "../controllers/user.controller";
import { getProfilePosts } from "../controllers/post.controller";
import { asyncHandler } from "../middlewares/asyncHandler";
import { authentication, authorization } from "../middlewares/auth.middleware";
import { validateBody, validateParams } from "../common/pipes/validation.pipe";
import { IdParamDto, UserIdParamDto } from "../dtos/params.dto";
import { CreateUserDto, UpdateMeDto, UpdateUserDto } from "../dtos/user.dto";

const router = Router();

router.get("/dashboard", asyncHandler(authentication), authorization("admin"), asyncHandler(getDashboard));
router.patch("/me", asyncHandler(authentication), validateBody(UpdateMeDto, { requireAtLeastOne: true }), asyncHandler(updateMe));
router.delete("/me", asyncHandler(authentication), asyncHandler(softDeleteMe));
router.post("/", asyncHandler(authentication), authorization("admin"), validateBody(CreateUserDto), asyncHandler(createUser));
router.get("/", asyncHandler(authentication), authorization("admin"), asyncHandler(getAllUsers));
router.get("/:userId/posts", asyncHandler(authentication), validateParams(UserIdParamDto), asyncHandler(getProfilePosts));
router.get("/:id", asyncHandler(authentication), validateParams(IdParamDto), asyncHandler(getUser));
router.patch("/:id", asyncHandler(authentication), authorization("admin"), validateParams(IdParamDto), validateBody(UpdateUserDto, { requireAtLeastOne: true }), asyncHandler(updateUser));
router.delete("/:id", asyncHandler(authentication), authorization("admin"), validateParams(IdParamDto), asyncHandler(softDeleteUser));
router.patch("/:id/restore", asyncHandler(authentication), authorization("admin"), validateParams(IdParamDto), asyncHandler(restoreUser));
router.delete("/:id/hard", asyncHandler(authentication), authorization("admin"), validateParams(IdParamDto), asyncHandler(hardDeleteUser));

export default router;
