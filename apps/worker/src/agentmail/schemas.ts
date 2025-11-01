import { z } from 'zod';

export const SendEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  text: z.string().min(1),
  cc: z.array(z.string().email()).optional(),
  bcc: z.array(z.string().email()).optional(),
  headers: z.record(z.string(), z.string()).optional(),
});

export type SendEmail = z.infer<typeof SendEmailSchema>;

export const WebhookEventSchema = z.object({
  event: z.string().min(1),
  threadId: z.string().min(1),
  messageId: z.string().min(1),
  subject: z.string().optional(),
  from: z.object({
    email: z.string().email(),
    name: z.string().optional(),
  }),
  text: z.string().optional(),
  timestamp: z.number().optional(),
  signature: z.string().optional(),
});

export type WebhookEvent = z.infer<typeof WebhookEventSchema>;

