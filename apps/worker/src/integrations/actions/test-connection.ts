/**
 * Test Rube.app connection with Composio credentials
 */

import { env } from "../env";
import { log } from "../log";

export async function testRubeConnection() {
  const projectId = env.RUBE_PROJECT_ID || env.COMPOSIO_API_KEY; // Fallback to Composio key if available
  const orgId = env.RUBE_ORG_ID;
  const userId = env.RUBE_USER_ID;
  const baseUrl = env.RUBE_BASE_URL || 'https://api.rube.app';

  log.info('Testing Rube.app connection...', {
    baseUrl,
    hasProjectId: !!projectId,
    hasOrgId: !!orgId,
    hasUserId: !!userId,
  });

  // Try different authentication methods
  const authMethods = [
    // Method 1: Try API key as Bearer token
    {
      name: 'Bearer Token (API Key)',
      headers: projectId ? { 'Authorization': `Bearer ${projectId}` } : null,
    },
    // Method 2: Try project ID in header
    {
      name: 'Project ID Header',
      headers: projectId ? { 'X-Project-ID': projectId } : null,
    },
    // Method 3: Try with org and user IDs
    {
      name: 'Multi-Header Auth',
      headers: {
        ...(projectId && { 'X-Project-ID': projectId }),
        ...(orgId && { 'X-Org-ID': orgId }),
        ...(userId && { 'X-User-ID': userId }),
      },
    },
  ];

  for (const method of authMethods) {
    if (!method.headers || Object.keys(method.headers).length === 0) continue;

    try {
      log.info(`Trying ${method.name}...`);
      
      // Try a health check or info endpoint
      const testEndpoints = [
        '/health',
        '/v1/health',
        '/api/health',
        '/status',
        '/v1/projects',
        '/projects',
      ];

      for (const endpoint of testEndpoints) {
        try {
          const url = `${baseUrl}${endpoint}`;
          log.info(`  Testing ${url}...`);
          
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...method.headers,
            },
          });

          const status = response.status;
          const text = await response.text();
          let data: any;
          
          try {
            data = JSON.parse(text);
          } catch {
            data = { raw: text };
          }

          log.info(`  Response: ${status}`, { endpoint, data: data });

          if (status === 200 || status === 401 || status === 403) {
            // 401/403 means endpoint exists, just need correct auth
            return {
              success: status === 200,
              method: method.name,
              endpoint,
              status,
              data,
              authHeaders: method.headers,
            };
          }
        } catch (error: any) {
          log.warn(`  Error on ${endpoint}:`, error.message);
        }
      }
    } catch (error: any) {
      log.warn(`Method ${method.name} failed:`, error.message);
    }
  }

  return {
    success: false,
    message: 'Could not connect to Rube.app with any authentication method',
  };
}

