/**
 * API Documentation Route
 * Returns OpenAPI specification
 */

import { Request, Response } from 'express';
import { promises as fs } from 'fs';
import path from 'path';

import { asyncHandler } from '../../core/middleware';

export const docsRoute = asyncHandler(async (req, res) => {
  try {
    const openApiPath = path.join(__dirname, '../../../openapi.yaml');
    const spec = await fs.readFile(openApiPath, 'utf-8');
    
    res.setHeader('Content-Type', 'application/yaml');
    res.send(spec);
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: 'Failed to load API documentation',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

