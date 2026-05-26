import { z } from "zod";

export const createRequestSchema = z.object({
  targetPersonName: z.string().min(1)
});

export const requestQuerySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).default("PENDING")
});

export const updateRequestSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"])
});

export type CreateRequestInput = z.infer<typeof createRequestSchema>;
export type RequestQueryInput = z.infer<typeof requestQuerySchema>;
export type UpdateRequestInput = z.infer<typeof updateRequestSchema>;
