import fetch from 'node-fetch';
import { nanoid } from 'nanoid';
import { env } from '../env';
import { log } from '../log';
import { SendEmail } from './schemas';

/**
 * Send error notification email when AgentMail API fails after retries
 */
async function sendErrorNotification(
  inboxId: string,
  errorDetails: {
    error: string;
    draftId: string;
    totalElapsedMs: number;
    attempts: number;
    timestamp: string;
    payload: { to: string; subject: string };
  }
): Promise<void> {
  try {
    // Create a draft for the error notification
    const createDraftUrl = `${env.AGENTMAIL_BASE_URL}/${env.AGENTMAIL_API_VERSION}/inboxes/${inboxId}/drafts`;
    
    const errorSubject = `[AgentMail API Failure] Draft send failed after ${errorDetails.totalElapsedMs}ms`;
    const errorText = `
AgentMail API failed to send draft after ${errorDetails.attempts} attempts.

Error Details:
- Error: ${errorDetails.error}
- Draft ID: ${errorDetails.draftId}
- Inbox ID: ${inboxId}
- Total elapsed time: ${errorDetails.totalElapsedMs}ms
- Attempts: ${errorDetails.attempts}
- Timestamp: ${errorDetails.timestamp}

Original Payload:
- To: ${errorDetails.payload.to}
- Subject: ${errorDetails.payload.subject}

This is an automated error notification from the Sutradhar AgentMail service.
    `.trim();

    const draftPayload = {
      to: ['adi@agentmail.cc'],
      subject: errorSubject,
      text: errorText,
      headers: {
        'Reply-To': env.AGENTMAIL_FROM_ADDRESS 
          ? `${env.AGENTMAIL_FROM_NAME || 'Sutradhar Support'} <${env.AGENTMAIL_FROM_ADDRESS}>`
          : 'Sutradhar Support',
      },
    };

    const createResponse = await fetch(createDraftUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.AGENTMAIL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(draftPayload),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Failed to create error notification draft: ${createResponse.status} ${errorText}`);
    }

    const draftResult = await createResponse.json() as { draft_id: string };
    
    // Wait a bit before sending
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Send the error notification
    const sendDraftUrl = `${env.AGENTMAIL_BASE_URL}/${env.AGENTMAIL_API_VERSION}/inboxes/${inboxId}/drafts/${draftResult.draft_id}/send`;
    const sendResponse = await fetch(sendDraftUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.AGENTMAIL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!sendResponse.ok) {
      const errorText = await sendResponse.text();
      throw new Error(`Failed to send error notification: ${sendResponse.status} ${errorText}`);
    }

    log.info('Error notification sent to adi@agentmail.cc', { draftId: draftResult.draft_id });
  } catch (error) {
    // Don't throw - we don't want error notification failures to mask the original error
    log.error('Error sending notification email', error);
  }
}

export interface SendEmailResult {
  ok: boolean;
  mocked?: boolean;
  dryRun?: boolean;
  threadId: string;
  messageId: string;
  draftId?: string;
}

// Cache inbox ID to avoid repeated list calls
let cachedInboxId: string | null = null;

/**
 * Non-throwing variant for health checks - returns null on failure
 */
export async function tryResolveInboxId(): Promise<string | null> {
  try {
    return await resolveInboxId();
  } catch {
    return null;
  }
}

export async function agentmailSelfCheck() {
  const real = !!process.env.AGENTMAIL_API_KEY;
  let inboxId = null;
  let reason = "ok";
  try {
    inboxId = await resolveInboxId();
  } catch (e: any) {
    reason = e?.message || String(e);
  }
  return { real, inboxId, reason };
}

/**
 * Resolve inbox ID with precedence:
 * 1. AGENTMAIL_INBOX_ID from env
 * 2. Cache if available
 * 3. Filter by AGENTMAIL_FROM_ADDRESS if set
 * 4. Throw helpful error if not found
 */
export async function resolveInboxId(): Promise<string> {
  // Precedence 1: Use from env if provided
  if (env.AGENTMAIL_INBOX_ID) {
    return env.AGENTMAIL_INBOX_ID;
  }

  // Precedence 2: Use cached value if available
  if (cachedInboxId) {
    return cachedInboxId;
  }

  // Precedence 3: Resolve by address if AGENTMAIL_FROM_ADDRESS is set
  if (env.AGENTMAIL_FROM_ADDRESS) {
    const listUrl = `${env.AGENTMAIL_BASE_URL}/${env.AGENTMAIL_API_VERSION}/inboxes`;
    const response = await fetch(listUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${env.AGENTMAIL_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to list inboxes: ${response.status} ${errorText}`);
    }

    const result = await response.json() as { 
      inboxes?: Array<{ 
        inbox_id: string; 
        address?: string;
        display_name?: string;
      }>; 
      count?: number 
    };
    
    if (!result.inboxes || result.inboxes.length === 0) {
      throw new Error(`AgentMail: No inboxes found for this API key. Create inbox ${env.AGENTMAIL_FROM_ADDRESS} in AgentMail or set AGENTMAIL_INBOX_ID.`);
    }

    // Filter by address - inbox_id IS the address in AgentMail API
    const matchingInbox = result.inboxes.find(inbox => 
      inbox.inbox_id === env.AGENTMAIL_FROM_ADDRESS || 
      inbox.address === env.AGENTMAIL_FROM_ADDRESS
    );
    
    if (!matchingInbox) {
      throw new Error(`AgentMail: No inbox for AGENTMAIL_FROM_ADDRESS=${env.AGENTMAIL_FROM_ADDRESS}. Create it in the AgentMail dashboard or set AGENTMAIL_INBOX_ID.`);
    }

    cachedInboxId = matchingInbox.inbox_id;
    log.info('Cached inbox ID by address', { inboxId: cachedInboxId, address: env.AGENTMAIL_FROM_ADDRESS });
    
    return cachedInboxId;
  }

  // No address specified and no inbox ID
  throw new Error('AgentMail: Set AGENTMAIL_INBOX_ID or AGENTMAIL_FROM_ADDRESS.');
}

export async function sendEmail(payload: SendEmail): Promise<SendEmailResult> {
  const isMock = !env.AGENTMAIL_API_KEY;
  const isDryRun = String(env.AGENTMAIL_DRY_RUN || 'false').toLowerCase() === 'true';

  if (isMock) {
    const threadId = `mock-th_${nanoid(10)}`;
    const messageId = `mock-msg_${nanoid(10)}`;
    
    log.info('MOCK SEND', { 
      to: payload.to, 
      subject: payload.subject,
      threadId,
      messageId,
    });

    return {
      ok: true,
      mocked: true,
      threadId,
      messageId,
    };
  }

  // Real AgentMail API: Draft → Send flow
  try {
    // Step 1: Get inbox ID
    const inboxId = await resolveInboxId();
    
    // Use test recipient if in dry-run mode and test address is set
    const recipient = isDryRun && env.AGENTMAIL_TEST_TO 
      ? env.AGENTMAIL_TEST_TO 
      : (env.AGENTMAIL_TEST_TO || payload.to);
    
    // Step 2: Create draft
    const createDraftUrl = `${env.AGENTMAIL_BASE_URL}/${env.AGENTMAIL_API_VERSION}/inboxes/${inboxId}/drafts`;
    
    const fromDisplay = env.AGENTMAIL_FROM_NAME || 'Sutradhar Support';
    const fromAddress = env.AGENTMAIL_FROM_ADDRESS;
    
    const draftPayload: {
      to: string[];
      subject: string;
      text: string;
      from?: string[];
      cc?: string[];
      bcc?: string[];
      headers?: Record<string, string>;
    } = {
      to: [recipient],
      subject: payload.subject,
      text: payload.text,
    };

    // Note: AgentMail API may not support explicit 'from' field in draft creation
    // The 'from' is determined by the inbox. We'll set Reply-To header instead.

    // Always include Reply-To header
    draftPayload.headers = {
      ...(payload.headers || {}),
      'Reply-To': fromAddress ? `${fromDisplay} <${fromAddress}>` : fromDisplay,
    };

    if (payload.cc && payload.cc.length > 0) {
      draftPayload.cc = payload.cc;
    }
    if (payload.bcc && payload.bcc.length > 0) {
      draftPayload.bcc = payload.bcc;
    }

    const createResponse = await fetch(createDraftUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.AGENTMAIL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(draftPayload),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      
      // In dry-run mode, if draft creation fails due to bounce/complaint, 
      // treat it as expected and return success (since we won't actually send)
      if (isDryRun && (createResponse.status === 403 || errorText.includes('bounced') || errorText.includes('complained'))) {
        log.info('DRY RUN: Draft creation failed due to bounce/complaint (expected in test mode)', { 
          status: createResponse.status, 
          recipient 
        });
        return {
          ok: true,
          mocked: false,
          dryRun: true,
          threadId: `dry-run-th_${nanoid(10)}`,
          messageId: `dry-run-msg_${nanoid(10)}`,
          draftId: `dry-run-draft-${nanoid(10)}`,
        };
      }
      
      throw new Error(`Failed to create draft: ${createResponse.status} ${errorText}`);
    }

    const draftResult = await createResponse.json() as { draft_id: string; thread_id?: string };
    const draftId = draftResult.draft_id;
    
    if (!draftId) {
      throw new Error('Draft created but no draft_id returned from API');
    }
    
    log.info('Draft created', { draftId, threadId: draftResult.thread_id, dryRun: isDryRun });

    // Dry-run mode: create draft but skip sending
    if (isDryRun) {
      log.info('DRY RUN: Draft created, skipping send', { draftId, recipient });
      return {
        ok: true,
        mocked: false,
        dryRun: true,
        threadId: draftResult.thread_id || `dry-run-th_${draftId}`,
        messageId: `dry-run-msg_${draftId}`,
        draftId,
      };
    }

    // Step 3: Send draft with exponential backoff retry logic
    const sendDraftUrl = `${env.AGENTMAIL_BASE_URL}/${env.AGENTMAIL_API_VERSION}/inboxes/${inboxId}/drafts/${draftId}/send`;
    
    const maxRetries = 5;
    const baseDelayMs = 1000; // Start with 1 second
    const maxDelayMs = 30000; // Cap at 30 seconds
    let lastError: Error | null = null;
    let totalElapsedMs = 0;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      // Calculate exponential backoff with jitter to prevent thundering herd
      const exponentialDelay = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);
      // Add jitter: random 0-30% of the delay to spread out requests
      const jitterMs = Math.floor(Math.random() * (exponentialDelay * 0.3));
      const delayMs = exponentialDelay + jitterMs;

      if (attempt > 0) {
        log.info(`Retry attempt ${attempt + 1}/${maxRetries} after ${delayMs}ms`, { 
          draftId, 
          totalElapsedMs: totalElapsedMs + delayMs 
        });
        await new Promise(resolve => setTimeout(resolve, delayMs));
        totalElapsedMs += delayMs;
      } else {
        // First attempt: minimal delay to ensure draft is ready
        await new Promise(resolve => setTimeout(resolve, 1000));
        totalElapsedMs += 1000;
      }

      try {
        const sendResponse = await fetch(sendDraftUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.AGENTMAIL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        });

        if (sendResponse.ok) {
          const sendResult = await sendResponse.json() as { message_id: string; thread_id: string };
          
          log.info('Email sent successfully', { 
            messageId: sendResult.message_id,
            threadId: sendResult.thread_id,
            attempt: attempt + 1,
            totalElapsedMs,
          });

          return {
            ok: true,
            mocked: false,
            threadId: sendResult.thread_id,
            messageId: sendResult.message_id,
          };
        }

        const errorText = await sendResponse.text();
        lastError = new Error(`Failed to send draft: ${sendResponse.status} ${errorText}`);
        log.warn(`Send attempt ${attempt + 1} failed`, { 
          status: sendResponse.status, 
          error: errorText,
          draftId 
        });

        // If it's a 404, continue retrying (draft might not be ready)
        // If it's a different error, break early
        if (sendResponse.status !== 404) {
          break;
        }
      } catch (fetchError) {
        lastError = fetchError instanceof Error ? fetchError : new Error(String(fetchError));
        log.warn(`Send attempt ${attempt + 1} errored`, { 
          error: lastError.message,
          draftId 
        });
      }
    }

    // All retries exhausted - send error notification
    const errorDetails = {
      error: lastError?.message || 'Unknown error',
      draftId,
      totalElapsedMs,
      attempts: maxRetries,
      timestamp: new Date().toISOString(),
      payload: {
        to: payload.to,
        subject: payload.subject,
      },
    };

    log.error('All send attempts failed', { ...errorDetails, inboxId });

    // Send error notification to adi@agentmail.cc
    try {
      await sendErrorNotification(inboxId, errorDetails);
    } catch (notifyError) {
      log.error('Failed to send error notification', notifyError);
    }

    throw new Error(`Failed to send draft after ${maxRetries} attempts (${totalElapsedMs}ms total): ${lastError?.message || 'Unknown error'}`);
  } catch (error) {
    log.error('Failed to send email via AgentMail', error);
    throw error;
  }
}

