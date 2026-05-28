import { z } from "zod";

export const euipoSettingsSchema = z.object({
  clientId: z.string().trim().min(1),
  clientSecret: z.string().trim().min(1)
});

export type EuipoSettingsInput = z.infer<typeof euipoSettingsSchema>;

const optionalTrimmed = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .nullable()
  .optional();

export const aiSettingsSchema = z.object({
  provider: z.enum(["OLLAMA", "OPENAI"]),
  ollamaUrl: optionalTrimmed,
  ollamaModel: optionalTrimmed,
  openaiApiKey: optionalTrimmed,
  openaiModel: optionalTrimmed,
  openaiBaseUrl: optionalTrimmed
});

export type AiSettingsInput = z.infer<typeof aiSettingsSchema>;
