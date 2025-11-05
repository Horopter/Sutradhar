/**
 * Optimus Server - Backend Agents Layer
 * Uses Sutradhar Orchestrator to execute agents
 */

import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import { SutradharClient } from './client/sutradhar-client';

const app = express();
const PORT = process.env.PORT || 4001;
const SUTRADHAR_URL = process.env.SUTRADHAR_URL || 'http://localhost:5000';

// Initialize Sutradhar client
const sutradharClient = new SutradharClient(SUTRADHAR_URL);

// Middleware
app.use(cors());
app.use(compression());
app.use(bodyParser.json());
app.use(morgan('combined'));

// Health check
app.get('/health', async (req, res) => {
  try {
    // Check connection to Sutradhar
    const agents = await sutradharClient.listAgents();
    res.json({
      ok: true,
      service: 'optimus',
      sutradharConnected: agents.ok,
      agentsCount: agents.agents?.length || 0,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      service: 'optimus',
      error: 'Failed to connect to Sutradhar',
    });
  }
});

// EdTech routes
import { edtechRoutes } from './routes/edtech';
app.use('/', edtechRoutes);

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Optimus Backend running on port ${PORT}`);
  console.log(`📡 EdTech API: http://localhost:${PORT}`);
  console.log(`🔗 Connected to Sutradhar: ${SUTRADHAR_URL}`);
  
  // TODO: Register EdTech agents with Sutradhar on startup
  // await registerEdTechAgents();
});

export { app, sutradharClient };

