import { Request, Response } from "express";
import * as integrationSettingsService from "../services/integrationSettingsService";
import * as aiSettingsService from "../services/aiSettingsService";
import { aiSettingsSchema, euipoSettingsSchema } from "../validators/integrationSettingsSchemas";

export async function getEuipoSettings(_req: Request, res: Response) {
  res.json(await integrationSettingsService.getEuipoSettingsStatus());
}

export async function updateEuipoSettings(req: Request, res: Response) {
  const input = euipoSettingsSchema.parse(req.body);
  await integrationSettingsService.saveEuipoSettings(input);
  res.json(await integrationSettingsService.getEuipoSettingsStatus());
}

export async function getAiSettings(_req: Request, res: Response) {
  res.json(await aiSettingsService.getAiSettingsStatus());
}

export async function updateAiSettings(req: Request, res: Response) {
  const input = aiSettingsSchema.parse(req.body);
  const status = await aiSettingsService.saveAiSettings({
    provider: input.provider,
    ollamaUrl: input.ollamaUrl,
    ollamaModel: input.ollamaModel,
    openaiApiKey: input.openaiApiKey,
    openaiModel: input.openaiModel,
    openaiBaseUrl: input.openaiBaseUrl
  });
  res.json(status);
}
