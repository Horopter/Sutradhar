/**
 * Slack Webhook Handler
 * Receives Slack events and responds using LLM
 */

import { Request, Response } from 'express';
import { slackPostMessage, getSlackChannel } from '../actions/slack';
import { llmService } from '../../core/services/llm-service';
import { logger } from '../../core/logging/logger';
import { answerService } from '../../core/services/answer-service';

export interface SlackEvent {
  type: string;
  event?: {
    type: string;
    channel?: string;
    user?: string;
    text?: string;
    ts?: string;
    thread_ts?: string;
  };
  challenge?: string; // For URL verification
}

/**
 * Handle Slack Events API webhook
 * Responds to messages by consulting LLM and posting replies
 */
export async function handleSlackWebhook(req: Request, res: Response): Promise<void> {
  const log = logger.child({ service: 'slack-webhook' });
  
  try {
    const event: SlackEvent = req.body;
    
    // URL verification challenge
    if (event.type === 'url_verification' && event.challenge) {
      log.verbose('Slack URL verification challenge');
      res.status(200).json({ challenge: event.challenge });
      return;
    }
    
    // Handle event callback
    if (event.type === 'event_callback' && event.event) {
      const slackEvent = event.event;
      
      // Only handle message events (not bot messages)
      if (slackEvent.type === 'message' && slackEvent.text && !slackEvent.text.includes('bot_id')) {
        log.info('Received Slack message', {
          channel: slackEvent.channel,
          user: slackEvent.user,
          text: slackEvent.text?.substring(0, 100),
          isThread: !!slackEvent.thread_ts,
        });
        
        // Process the message (synchronously for tests, async for production)
        if (process.env.NODE_ENV === 'test') {
          // In tests, process synchronously so assertions work
          await processSlackMessage(slackEvent);
          res.status(200).send('OK');
        } else {
          // In production, respond immediately and process async
          res.status(200).send('OK');
          processSlackMessage(slackEvent).catch((error: any) => {
            log.error('Failed to process Slack message', { error: error.message });
          });
        }
        return;
      }
    }
    
    // Acknowledge other events
    res.status(200).send('OK');
  } catch (error: any) {
    log.error('Slack webhook error', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Process a Slack message and generate a response
 */
async function processSlackMessage(event: {
  channel?: string;
  user?: string;
  text?: string;
  ts?: string;
  thread_ts?: string;
}): Promise<void> {
  const log = logger.child({ service: 'slack-processor' });
  
  if (!event.channel || !event.text || !event.user) {
    log.warn('Missing required fields in Slack message', { event });
    return;
  }
  
  try {
    // Get channel info for context
    const channel = await getSlackChannel(event.channel);
    
    // Generate response using answer service (RAG + LLM)
    const sessionId = `slack-${event.channel}-${event.user}`;
    const result = await answerService.answerQuestion(
      sessionId,
      event.text,
      'Greeter' // Default persona for Slack
    );
    
    if (result.blocked) {
      log.warn('Slack message blocked by guardrails', { reason: result.blockReason });
      return;
    }
    
    // Determine if this should be a thread reply
    const threadTs = event.thread_ts || event.ts;
    
    // Post reply
    const responseText = result.finalText || 'I received your message.';
    
    // If it was a thread, reply in thread
    const replyThreadTs = event.thread_ts || (threadTs && threadTs !== event.ts ? threadTs : undefined);
    await slackPostMessage(responseText, event.channel, replyThreadTs);
    
    log.info('Successfully responded to Slack message', {
      channel: event.channel,
      responseLength: responseText.length,
      sessionId,
    });
  } catch (error: any) {
    log.error('Failed to process Slack message', { 
      error: error.message,
      channel: event.channel,
    });
  }
}

