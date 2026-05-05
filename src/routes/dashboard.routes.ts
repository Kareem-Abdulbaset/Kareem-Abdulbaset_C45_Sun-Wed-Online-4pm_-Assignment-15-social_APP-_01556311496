import { Router } from "express";
import { getDashboard } from "../controllers/user.controller";
import { asyncHandler } from "../middlewares/asyncHandler";
import { authentication, authorization } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", asyncHandler(authentication), authorization("admin"), asyncHandler(getDashboard));

export default router;
