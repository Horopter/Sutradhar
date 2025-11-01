/**
 * API v1 Routes
 * All v1 endpoints organized by resource
 */

import { Router } from 'express';
import { answerRoutes } from './answer';
import { llmRoutes } from './llm';
import { actionRoutes } from './actions';
import { emailRoutes } from './email';
import { retrievalRoutes } from './retrieval';
import { sessionRoutes } from './sessions';
import { voiceRoutes } from './voice';
import { oauthRoutes } from './oauth';
import { docsRoute } from './docs';
import logsRoutes from './logs';
import githubRoutes from './github';
import slackRoutes from './slack';
import calendarRoutes from './calendar';
import webhooksRoutes from './webhooks';
import { imageRoutes } from './images';

const router = Router();

// Documentation endpoint
router.get('/docs', docsRoute);

// Resource routes
router.use('/answer', answerRoutes);
router.use('/llm', llmRoutes);
router.use('/actions', actionRoutes);
router.use('/email', emailRoutes);
router.use('/retrieval', retrievalRoutes);
router.use('/sessions', sessionRoutes);
router.use('/voice', voiceRoutes);
router.use('/auth', oauthRoutes);
router.use('/logs', logsRoutes);

// RESTful service routes
router.use('/github', githubRoutes);
router.use('/slack', slackRoutes);
router.use('/calendar', calendarRoutes);
router.use('/webhooks', webhooksRoutes);
router.use('/images', imageRoutes);

// API info endpoint
router.get('/', async (req, res) => {
  res.json({
    version: '1.0.0',
    name: 'Sutradhar API v1',
    description: 'AI-powered assistant API with retrieval, actions, and LLM capabilities',
    endpoints: {
      answer: '/api/v1/answer',
      llm: '/api/v1/llm',
      actions: '/api/v1/actions',
      email: '/api/v1/email',
      retrieval: '/api/v1/retrieval',
      sessions: '/api/v1/sessions',
      voice: '/api/v1/voice',
      auth: '/api/v1/auth',
      logs: '/api/v1/logs',
      github: '/api/v1/github',
      slack: '/api/v1/slack',
      calendar: '/api/v1/calendar',
      webhooks: '/api/v1/webhooks',
      images: '/api/v1/images',
      docs: '/api/v1/docs'
    },
    documentation: '/api/v1/docs'
  });
});

export { router as v1Routes };

