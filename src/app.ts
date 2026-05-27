import cors from "cors";
import express from "express";
import { errorHandler } from "./middleware/errorHandler";
import { routes } from "./routes";

export const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", routes);
app.use(errorHandler);
