/**
 * Email API Routes
 * AgentMail integration endpoints
 */

import { Router } from 'express';
import { asyncHandler, rateLimiters, timeouts, validate } from '../../core/middleware';
import { emailService } from '../../core/services/email-service';
import { SendEmailSchema } from '../../agentmail/schemas';
import { env } from '../../env';

const router = Router();

/**
 * POST /api/v1/email/send
 * Send email via AgentMail
 */
router.post('/send',
  rateLimiters.strict,
  timeouts.standard,
  validate({ body: SendEmailSchema }),
  asyncHandler(async (req, res) => {
    const validationResult = SendEmailSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid payload',
        details: validationResult.error.errors,
      });
    }

    const replyTo = env.AGENTMAIL_FROM_ADDRESS
      ? `${env.AGENTMAIL_FROM_NAME || 'Sutradhar Support'} <${env.AGENTMAIL_FROM_ADDRESS}>`
      : undefined;

    // Use test recipient in dry-run mode or if specified
    const recipient = (env.AGENTMAIL_DRY_RUN === 'true' && env.AGENTMAIL_TEST_TO)
      ? env.AGENTMAIL_TEST_TO
      : (validationResult.data.to || env.AGENTMAIL_FROM_ADDRESS || env.AGENTMAIL_DEFAULT_TO);

    const payload = {
      to: recipient,
      subject: validationResult.data.subject || '[Escalation][P1] Test Send',
      text: validationResult.data.text,
      ...(validationResult.data.cc && { cc: validationResult.data.cc }),
      ...(validationResult.data.bcc && { bcc: validationResult.data.bcc }),
      headers: {
        ...(validationResult.data.headers || {}),
        ...(replyTo && { 'Reply-To': replyTo }),
      },
    };

    const result = await emailService.sendEmail(payload);
    
    if (!result.ok) {
      const statusCode = result.error?.includes('INBOX_NOT_FOUND') ? 428 : 500;
      return res.status(statusCode).json(result);
    }
    
    res.json({
      ...result,
      message: 'Email sent successfully.'
    });
  })
);

export { router as emailRoutes };

