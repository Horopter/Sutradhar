/**
 * Convex Client - For Optimus to access Convex database
 * Uses HTTP client to communicate with Convex
 */

import fetch from 'node-fetch';

export class ConvexClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.CONVEX_URL || 'http://localhost:3210';
  }

  async queries(functionName: string, args: any = {}): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: functionName,
          args,
          format: 'json'
        }),
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      return null;
    }
  }

  async mutations(functionName: string, args: any = {}): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/mutation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: functionName,
          args,
          format: 'json'
        }),
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      return null;
    }
  }
}

// Singleton instance
export const Convex = new ConvexClient();

