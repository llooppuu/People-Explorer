import { z } from "zod";

export const personQuerySchema = z.object({
  role: z.string().optional(),
  category: z.string().optional(),
  tag: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

export type PersonQueryInput = z.infer<typeof personQuerySchema>;
