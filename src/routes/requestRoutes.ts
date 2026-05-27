import { Router } from "express";
import * as requestController from "../controllers/requestController";
import { authMiddleware } from "../middleware/authMiddleware";
import { asyncHandler } from "../middleware/errorHandler";
import { requireRole } from "../middleware/requireRole";

export const requestRoutes = Router();

requestRoutes.post("/", authMiddleware, asyncHandler(requestController.createRequest));
requestRoutes.get("/", authMiddleware, requireRole("ADMIN"), asyncHandler(requestController.getRequests));
requestRoutes.put("/:id", authMiddleware, requireRole("ADMIN"), asyncHandler(requestController.updateRequest));
