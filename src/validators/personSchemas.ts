import { z } from "zod";

export const personQuerySchema = z.object({
  role: z.string().optional(),
  category: z.string().optional(),
  tag: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

export type PersonQueryInput = z.infer<typeof personQuerySchema>;

export const acceptWebSearchSchema = z.object({
  results: z
    .array(
      z.object({
        title: z.string().min(1),
        url: z.string().url(),
        snippet: z.string().default("")
      })
    )
    .min(1),
  summary: z.string().optional()
});

export type AcceptWebSearchInput = z.infer<typeof acceptWebSearchSchema>;

export const previewWebSearchSchema = z.object({
  query: z.string().trim().min(1).max(200).optional(),
  sites: z.array(z.string().trim().min(1).max(120)).max(20).optional()
});

export type PreviewWebSearchInput = z.infer<typeof previewWebSearchSchema>;
