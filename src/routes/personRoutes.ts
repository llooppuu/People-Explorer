import { Router } from "express";
import * as personController from "../controllers/personController";
import * as tagController from "../controllers/tagController";
import { authMiddleware } from "../middleware/authMiddleware";
import { asyncHandler } from "../middleware/errorHandler";

export const personRoutes = Router();

personRoutes.get("/", asyncHandler(personController.getPersons));
personRoutes.get("/:id", asyncHandler(personController.getPerson));
personRoutes.post("/:id/tags", authMiddleware, asyncHandler(tagController.addTagToPerson));
