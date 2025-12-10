import { z } from 'zod';
import { insertTicketSchema, tickets } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  tickets: {
    list: {
      method: 'GET' as const,
      path: '/api/tickets' as const,
      responses: {
        200: z.array(z.custom<typeof tickets.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/tickets/:id' as const,
      responses: {
        200: z.custom<typeof tickets.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/tickets' as const,
      input: insertTicketSchema,
      responses: {
        201: z.custom<typeof tickets.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/tickets/:id' as const,
      input: insertTicketSchema.partial().extend({
        category: z.string().optional(),
        priority: z.string().optional(),
        status: z.string().optional(),
        nextSteps: z.string().optional(),
        draftResponse: z.string().optional(),
      }),
      responses: {
        200: z.custom<typeof tickets.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/tickets/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    analyze: {
      method: 'POST' as const,
      path: '/api/tickets/:id/analyze' as const,
      responses: {
        200: z.custom<typeof tickets.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
