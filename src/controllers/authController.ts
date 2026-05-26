import { Request, Response } from "express";
import * as authService from "../services/authService";
import { authSchema } from "../validators/authSchemas";

export async function register(req: Request, res: Response) {
  const input = authSchema.parse(req.body);
  const user = await authService.register(input);
  res.status(201).json(user);
}

export async function login(req: Request, res: Response) {
  const input = authSchema.parse(req.body);
  const result = await authService.login(input);
  res.json(result);
}
