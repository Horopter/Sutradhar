import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load regular environment variables
dotenv.config();

// Load secrets from .secrets.env file (if it exists)
// This file should NEVER be committed to git
// Check both the current directory and the project root (for monorepo setups)
const secretsPath = path.resolve(process.cwd(), '.secrets.env');
const rootSecretsPath = path.resolve(__dirname, '../../..', '.secrets.env');
const secretsFile = fs.existsSync(secretsPath) ? secretsPath : (fs.existsSync(rootSecretsPath) ? rootSecretsPath : null);

if (secretsFile) {
  dotenv.config({ path: secretsFile, override: false });
  console.log(`✅ Loaded secrets from ${secretsFile}`);
} else {
  console.warn('⚠️  .secrets.env file not found in current directory or project root. Copy .secrets.example to .secrets.env and add your secrets.');
}

const envSchema = z.object({
  PORT: z.string().default('2198').transform(Number),
  AGENTMAIL_BASE_URL: z.string().url().default('https://api.agentmail.to'),
  AGENTMAIL_API_KEY: z.string().optional(),
  AGENTMAIL_API_VERSION: z.string().default('v0'),
  AGENTMAIL_INBOX_ID: z.string().optional(), // Optional: skip list call if set
  AGENTMAIL_FROM_ADDRESS: z.string().email().optional(),
  AGENTMAIL_FROM_NAME: z.string().optional(),
  AGENTMAIL_DEFAULT_FROM: z.string().email().default('poltergeist@demo.local'),
  AGENTMAIL_DEFAULT_TO: z.string().email().default('support@demo.local'),
  AGENTMAIL_WEBHOOK_SECRET: z.string().optional(),
  AGENTMAIL_DRY_RUN: z.string().default('false'),
  AGENTMAIL_TEST_TO: z.string().email().optional(),
  CONVEX_URL: z.string().optional().refine((val) => !val || z.string().url().safeParse(val).success, {
    message: "CONVEX_URL must be a valid URL if provided",
  }),
  // Rube.app (replaces Composio)
  RUBE_API_KEY: z.string().optional(),
  RUBE_BASE_URL: z.string().url().default('https://api.rube.app'),
  RUBE_PROJECT_ID: z.string().optional(),
  RUBE_ORG_ID: z.string().optional(),
  RUBE_USER_ID: z.string().optional(),
  MOCK_ACTIONS: z.string().default('false'),
  // Composio Connection IDs (store in .secrets.env)
  GITHUB_CONNECTED_ACCOUNT_ID: z.string().optional(),
  GITHUB_USER_ID: z.string().optional(),
  SLACK_CONNECTED_ACCOUNT_ID: z.string().optional(),
  SLACK_USER_ID: z.string().optional(),
  GCAL_CONNECTED_ACCOUNT_ID: z.string().optional(),
  GCAL_USER_ID: z.string().optional(),
  COMPOSIO_ACCOUNT_ID: z.string().optional(),
  COMPOSIO_USER_ID: z.string().optional(),
  SLACK_CHANNEL_ID: z.string().optional(),
  GCAL_CALENDAR_ID: z.string().optional(),
  GITHUB_REPO_SLUG: z.string().optional(),
  // Composio (deprecated, kept for backward compatibility)
  COMPOSIO_API_KEY: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  // LiveKit
  LIVEKIT_URL: z.string().url().optional(),
  LIVEKIT_API_KEY: z.string().optional(),
  LIVEKIT_API_SECRET: z.string().optional(),
  // Retrieval
  MOCK_RETRIEVAL: z.string().default('true'),
  RETRIEVAL_TIMEOUT_MS: z.string().default('2500').transform(Number),
  HYPERSPELL_API_KEY: z.string().optional(),
  HYPERSPELL_BASE_URL: z.string().url().default('https://api.hyperspell.ai'),
  MOSS_PROJECT_ID: z.string().optional(),
  MOSS_PROJECT_KEY: z.string().optional(),
  MOSS_INDEX_NAME: z.string().default('seed'),
  MOSS_IMAGE_INDEX_NAME: z.string().default('images'),
  MOSS_BRIDGE_URL: z.string().url().default('http://127.0.0.1:4050'),
  RETRIEVAL_REQUIRE_HS: z.string().default('false'),
  // Browser Use
  MOCK_BROWSER: z.string().default('true'),
  FORUM_URL: z.string().optional().refine((val) => !val || z.string().url().safeParse(val).success, {
    message: "FORUM_URL must be a valid URL if provided",
  }),
  FORUM_USER: z.string().default('demo'),
  FORUM_PASS: z.string().default('demo'),
  SCREENSHOT_DIR: z.string().default('./screenshots'),
  // LLM Providers
  OPENAI_API_KEY: z.string().optional(),
  PERPLEXITY_API_KEY: z.string().optional(),
  LLM_DEFAULT_PROVIDER: z.string().default('openai'),
  LLM_OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  LLM_PERPLEXITY_MODEL: z.string().default('pplx-7b-online'),
  MOCK_LLM: z.string().default('true'),
  // Test & CI
  RL_BYPASS: z.string().default('false'),
  LOG_JSON: z.string().default('false'),
  SENTRY_DSN: z.string().optional(),
  // Caching
  REDIS_URL: z.string().optional(), // URL validation happens at runtime when Redis is actually used
  USE_REDIS: z.string().default('false'), // Force Redis in dev if needed
  CACHE_DEFAULT_TTL: z.string().default('3600').transform(Number),
  // CORS & API
  ALLOWED_ORIGINS: z.string().optional(), // Comma-separated list
  FRONTEND_URL: z.string().url().optional(),
        // Graceful shutdown
        GRACEFUL_SHUTDOWN_TIMEOUT: z.string().default('30000').transform(Number),
        // Logging
        LOG_LEVEL: z.string().default('info'),
        LOG_FILE: z.string().optional(),
        LOG_PERSIST: z.string().default('false'),
});

export type Env = z.infer<typeof envSchema>;

let env: Env;

try {
  env = envSchema.parse(process.env);
} catch (error: any) {
  const errorMsg = error?.message || error?.issues || String(error);
  console.error('❌ Invalid environment variables:', errorMsg);
  if (error?.issues) {
    console.error('Validation issues:', JSON.stringify(error.issues, null, 2));
  }
  process.exit(1);
}

export { env };

