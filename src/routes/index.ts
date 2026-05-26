import { Router } from "express";
import { authRoutes } from "./authRoutes";
import { personRoutes } from "./personRoutes";
import { requestRoutes } from "./requestRoutes";
import { tagRoutes } from "./tagRoutes";
import { watchlistRoutes } from "./watchlistRoutes";

export const routes = Router();

routes.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

routes.use("/auth", authRoutes);
routes.use("/persons", personRoutes);
routes.use("/requests", requestRoutes);
routes.use("/watchlist", watchlistRoutes);
routes.use("/tags", tagRoutes);
