import { Router } from "express";
import * as personController from "../controllers/personController";
import * as tagController from "../controllers/tagController";
import { authMiddleware } from "../middleware/authMiddleware";
import { asyncHandler } from "../middleware/errorHandler";
import { requireRole } from "../middleware/requireRole";

export const personRoutes = Router();

personRoutes.get("/", asyncHandler(personController.getPersons));
personRoutes.get("/:id", asyncHandler(personController.getPerson));
personRoutes.post("/:id/tags", authMiddleware, asyncHandler(tagController.addTagToPerson));
personRoutes.post("/:id/ai-overview", authMiddleware, requireRole("ADMIN"), asyncHandler(personController.generateAiOverview));
personRoutes.post("/:id/web-search", authMiddleware, requireRole("ADMIN"), asyncHandler(personController.previewWebSearch));
personRoutes.post("/:id/web-search/accept", authMiddleware, requireRole("ADMIN"), asyncHandler(personController.acceptWebSearch));
