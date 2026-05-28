import { z } from "zod";

export const euipoSettingsSchema = z.object({
  clientId: z.string().trim().min(1),
  clientSecret: z.string().trim().min(1)
});

export type EuipoSettingsInput = z.infer<typeof euipoSettingsSchema>;
