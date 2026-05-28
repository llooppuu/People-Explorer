import { Router } from "express";
import * as integrationSettingsController from "../controllers/integrationSettingsController";
import { authMiddleware } from "../middleware/authMiddleware";
import { asyncHandler } from "../middleware/errorHandler";
import { requireRole } from "../middleware/requireRole";

export const integrationSettingsRoutes = Router();

integrationSettingsRoutes.use(authMiddleware, requireRole("ADMIN"));
integrationSettingsRoutes.get("/euipo", asyncHandler(integrationSettingsController.getEuipoSettings));
integrationSettingsRoutes.put("/euipo", asyncHandler(integrationSettingsController.updateEuipoSettings));
