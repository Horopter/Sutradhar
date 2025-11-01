import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { env } from '../env';
import { log } from '../log';
import { WebhookEvent, WebhookEventSchema } from './schemas';
import { Convex } from '../convexClient';

export type WebhookEventHandler = (event: WebhookEvent) => Promise<void> | void;

let eventHandler: WebhookEventHandler = async (event) => {
  log.info('AgentMail webhook event', {
    event: event.event,
    threadId: event.threadId,
    messageId: event.messageId,
    text: event.text,
  });

  // Persist to Convex
  const sessionId = event.threadId || "email-session";
  try {
    await Convex.messages.append({
      sessionId,
      from: "human",
      text: event.text || "(no text)",
      sourceRefs: [{ 
        type: "email", 
        id: event.messageId, 
        title: event.subject,
        url: event.messageId 
      }],
      latencyMs: 0
    });
  } catch (e) {
    log.warn('Convex append failed (ok in early mocks):', (e as Error).message);
  }
};

export function onAgentMailEvent(handler: WebhookEventHandler): void {
  eventHandler = handler;
}

function verifySignature(rawBody: Buffer, signature: string): boolean {
  if (!env.AGENTMAIL_WEBHOOK_SECRET) {
    return true; // Skip verification if no secret is set
  }

  const hmac = crypto.createHmac('sha256', env.AGENTMAIL_WEBHOOK_SECRET);
  hmac.update(rawBody);
  const computedSignature = hmac.digest('hex');
  
  // Compare signatures in constant time (both are hex strings)
  // Handle signature format: could be "sha256=..." or just hex
  const receivedSignature = signature.replace(/^sha256=/, '');
  
  if (receivedSignature.length !== computedSignature.length) {
    return false;
  }
  
  return crypto.timingSafeEqual(
    Buffer.from(receivedSignature, 'hex'),
    Buffer.from(computedSignature, 'hex')
  );
}

export const webhookRouter = Router();

webhookRouter.post('/webhooks/agentmail', async (req: Request, res: Response) => {
  try {
    const rawBody = req.body as Buffer;
    
    if (!Buffer.isBuffer(rawBody)) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Raw body is required for webhook verification' 
      });
    }

    // Verify signature if secret is configured
    const signatureHeader = req.headers['x-agentmail-signature'] as string;
    if (env.AGENTMAIL_WEBHOOK_SECRET) {
      if (!signatureHeader) {
        return res.status(401).json({ 
          ok: false, 
          error: 'Missing x-agentmail-signature header' 
        });
      }

      if (!verifySignature(rawBody, signatureHeader)) {
        log.warn('Webhook signature verification failed', {
          received: signatureHeader.substring(0, 8) + '...',
        });
        return res.status(401).json({ 
          ok: false, 
          error: 'Invalid signature' 
        });
      }
    }

    // Parse JSON payload
    let parsedBody: unknown;
    try {
      parsedBody = JSON.parse(rawBody.toString('utf-8'));
    } catch (error) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Invalid JSON payload' 
      });
    }

    // Validate with Zod schema
    const validationResult = WebhookEventSchema.safeParse(parsedBody);
    if (!validationResult.success) {
      log.warn('Invalid webhook payload', { errors: validationResult.error.errors });
      return res.status(400).json({ 
        ok: false, 
        error: 'Invalid webhook payload',
        details: validationResult.error.errors,
      });
    }

    const event = validationResult.data;

    // Call the event handler
    try {
      await eventHandler(event);
    } catch (handlerError) {
      log.error('Error in webhook event handler', handlerError);
      // Continue anyway - we've received the webhook
    }

    res.json({ ok: true });
  } catch (error) {
    log.error('Unexpected error processing webhook', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Internal server error' 
    });
  }
});

