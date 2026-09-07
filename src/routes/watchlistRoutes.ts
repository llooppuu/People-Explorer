import { Router } from "express";
import * as watchlistController from "../controllers/watchlistController";
import { authMiddleware } from "../middleware/authMiddleware";
import { asyncHandler } from "../middleware/errorHandler";

export const watchlistRoutes = Router();

watchlistRoutes.get("/", authMiddleware, asyncHandler(watchlistController.getWatchlist));
watchlistRoutes.post("/", authMiddleware, asyncHandler(watchlistController.addToWatchlist));
watchlistRoutes.delete("/:id", authMiddleware, asyncHandler(watchlistController.removeFromWatchlist));
