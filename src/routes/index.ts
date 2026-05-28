import { Router } from "express";
import { openApiDocument, renderSwaggerHtml } from "../docs/openapi";
import { authRoutes } from "./authRoutes";
import { integrationSettingsRoutes } from "./integrationSettingsRoutes";
import { personRoutes } from "./personRoutes";
import { requestRoutes } from "./requestRoutes";
import { tagRoutes } from "./tagRoutes";
import { watchlistRoutes } from "./watchlistRoutes";

export const routes = Router();

routes.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

routes.get("/docs.json", (_req, res) => {
  res.json(openApiDocument);
});

routes.get("/docs", (_req, res) => {
  res.type("html").send(renderSwaggerHtml());
});

routes.use("/auth", authRoutes);
routes.use("/persons", personRoutes);
routes.use("/requests", requestRoutes);
routes.use("/integrations", integrationSettingsRoutes);
routes.use("/watchlist", watchlistRoutes);
routes.use("/tags", tagRoutes);
