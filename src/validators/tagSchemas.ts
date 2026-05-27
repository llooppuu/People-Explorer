import { z } from "zod";

export const addTagSchema = z.object({
  name: z.string().min(1),
  color: z.string().optional()
});

export type AddTagInput = z.infer<typeof addTagSchema>;
