/**
 * Unified API v1 Router
 * Clean, UI-focused endpoints that abstract all external API complexity
 */

import { Router } from 'express';
import { conversationRoutes } from './conversations';
import { knowledgeRoutes } from './knowledge';
import { communicationRoutes } from './communications';
import { collaborationRoutes } from './collaboration';
import { schedulingRoutes } from './scheduling';
import { mediaRoutes } from './media';
import { systemRoutes } from './system';

const router = Router();

// UI-Focused Resource Routes
router.use('/conversations', conversationRoutes);
router.use('/knowledge', knowledgeRoutes);
router.use('/communications', communicationRoutes);  // Messages and channels
router.use('/collaboration', collaborationRoutes);   // Issues and tasks
router.use('/scheduling', schedulingRoutes);         // Calendar and events
router.use('/media', mediaRoutes);                   // Images and voice
router.use('/system', systemRoutes);                 // Health and capabilities

// API Info
router.get('/', async (req, res) => {
  res.json({
    version: '1.0.0',
    name: 'Sutradhar Unified API',
    description: 'Clean, unified interface for all AI assistant capabilities',
    endpoints: {
      conversations: '/api/v1/conversations',
      knowledge: '/api/v1/knowledge',
      communications: '/api/v1/communications',
      collaboration: '/api/v1/collaboration',
      scheduling: '/api/v1/scheduling',
      media: '/api/v1/media',
      system: '/api/v1/system',
    },
    design: 'All external APIs (AgentMail, Convex, Composio, Moss, Hyperspell, LiveKit, etc.) are abstracted and encapsulated internally',
  });
});

export { router as unifiedApiRoutes };

