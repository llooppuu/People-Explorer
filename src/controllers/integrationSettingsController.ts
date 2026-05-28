import { Request, Response } from "express";
import * as integrationSettingsService from "../services/integrationSettingsService";
import { euipoSettingsSchema } from "../validators/integrationSettingsSchemas";

export async function getEuipoSettings(_req: Request, res: Response) {
  res.json(await integrationSettingsService.getEuipoSettingsStatus());
}

export async function updateEuipoSettings(req: Request, res: Response) {
  const input = euipoSettingsSchema.parse(req.body);
  await integrationSettingsService.saveEuipoSettings(input);
  res.json(await integrationSettingsService.getEuipoSettingsStatus());
}
