import { Router } from "express";
import { getAllUsers } from "../controllers/user.controller";
import { asyncHandler } from "../middlewares/asyncHandler";
import { authentication, authorization } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", asyncHandler(authentication), authorization("admin"), asyncHandler(getAllUsers));

export default router;
