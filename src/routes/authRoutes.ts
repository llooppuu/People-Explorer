import { Router } from "express";
import * as authController from "../controllers/authController";
import { asyncHandler } from "../middleware/errorHandler";

export const authRoutes = Router();

authRoutes.post("/register", asyncHandler(authController.register));
authRoutes.post("/login", asyncHandler(authController.login));
