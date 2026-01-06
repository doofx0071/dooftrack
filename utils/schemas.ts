import { z } from 'zod';

export const MangaDexResponseSchema = z.object({
  data: z.array(z.object({
    id: z.string(),
    type: z.string(),
    attributes: z.object({
      title: z.record(z.string(), z.string()).optional(),
      description: z.record(z.string(), z.string()).optional(),
      status: z.string().optional(),
      year: z.number().nullable().optional(),
      tags: z.array(z.object({
        id: z.string(),
        attributes: z.object({
          name: z.record(z.string(), z.string())
        })
      })).optional()
    })
  })),
  limit: z.number().optional(),
  offset: z.number().optional(),
  total: z.number().optional()
});

export const MyAnimeListResponseSchema = z.object({
    data: z.array(z.object({
        node: z.object({
            id: z.number(),
            title: z.string(),
            main_picture: z.object({
                medium: z.string().optional(),
                large: z.string().optional()
            }).optional()
        })
    }))
});

// Common types derived from schemas
export type MangaDexResponse = z.infer<typeof MangaDexResponseSchema>;
export type MyAnimeListResponse = z.infer<typeof MyAnimeListResponseSchema>;
