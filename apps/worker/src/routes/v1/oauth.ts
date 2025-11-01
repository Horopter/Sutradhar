/**
 * OAuth API Routes
 * Authentication endpoints
 */

import { Router } from 'express';
import { asyncHandler, rateLimiters } from '../../core/middleware';
import { log } from '../../log';
import { env } from '../../env';

const router = Router();

/**
 * Unified OAuth login handler
 */
const handleOAuthLogin = asyncHandler(async (req, res) => {
  const provider = req.path.split('/').pop(); // Get provider from path
  const hasApiKey = !!(env.COMPOSIO_API_KEY || env.RUBE_API_KEY);
  
  if (hasApiKey) {
    log.info(`OAuth requested for ${provider} but using dummy mode (OAuth requires dashboard setup)`);
    res.json({
      ok: true,
      dummy: true,
      message: 'OAuth temporarily unavailable. Using demo mode.',
      token: `dummy_${provider}_${Date.now()}`,
      provider,
    });
  } else {
    res.json({
      ok: true,
      dummy: true,
      message: 'OAuth not configured. Using demo mode.',
      token: `dummy_${provider}_${Date.now()}`,
      provider,
    });
  }
});

/**
 * Unified OAuth callback handler
 */
const handleOAuthCallback = asyncHandler(async (req, res) => {
  const { code } = req.query;
  const provider = req.path.split('/').pop();
  const hasApiKey = !!(env.COMPOSIO_API_KEY || env.RUBE_API_KEY);

  if (code && hasApiKey) {
    log.info(`OAuth callback received for ${provider}, using dummy mode`);
    res.json({
      ok: true,
      dummy: true,
      provider,
      token: `dummy_${provider}_${Date.now()}`,
      message: 'OAuth callback received. Complete OAuth flow implementation needed.'
    });
  } else {
    res.status(400).json({
      ok: false,
      error: 'no_code',
      message: 'OAuth callback received without authorization code.'
    });
  }
});

// OAuth login endpoints
router.post('/github/login', rateLimiters.standard, handleOAuthLogin);
router.post('/slack/login', rateLimiters.standard, handleOAuthLogin);
router.post('/google/login', rateLimiters.standard, handleOAuthLogin);

// OAuth callback endpoints
router.get('/github/callback', handleOAuthCallback);
router.get('/slack/callback', handleOAuthCallback);
router.get('/google/callback', handleOAuthCallback);

export { router as oauthRoutes };

