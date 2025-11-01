/**
 * Test script to ping GitHub, Slack, and Calendar with real credentials
 * Usage: npx ts-node test-integrations.ts
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables in the same order as env.ts
// First: Load .env from current working directory (apps/worker/.env)
dotenv.config(); // This loads from process.cwd()/.env which is apps/worker/.env

// Then: Load .secrets.env from project root
const currentDir = __dirname || process.cwd();
const projectRoot = path.resolve(currentDir, '../..');
const secretsPath = path.resolve(projectRoot, '.secrets.env');
if (fs.existsSync(secretsPath)) {
  dotenv.config({ path: secretsPath, override: false }); // Don't override, .env takes precedence
  console.log('✅ Loaded .secrets.env from', secretsPath);
}

// Change working directory to root so env.ts module finds the secrets file
process.chdir(projectRoot);

// Verify we have the API key loaded
const apiKey = process.env.COMPOSIO_API_KEY;
if (!apiKey || apiKey.includes('your-') || apiKey.includes('example')) {
  console.warn('⚠️  WARNING: COMPOSIO_API_KEY appears to be a placeholder value!');
  console.warn('   Current value starts with:', apiKey?.substring(0, 20) || 'undefined');
} else {
  console.log('✅ COMPOSIO_API_KEY loaded (length:', apiKey?.length || 0, 'chars)');
}

// Enable Composio debug logging
process.env.COMPOSIO_LOGGING_LEVEL = 'debug';

import { createGithubIssue } from './src/integrations/actions/github';
import { slackPostMessage } from './src/integrations/actions/slack';
import { createCalendarEvent } from './src/integrations/actions/calendar';

async function testIntegrations() {
  console.log('🚀 Testing GitHub, Slack, and Calendar Integrations');
  console.log('===================================================\n');

  const results = {
    github: { success: false, error: null as string | null, data: null as any },
    slack: { success: false, error: null as string | null, data: null as any },
    calendar: { success: false, error: null as string | null, data: null as any },
  };

  // 1. Create GitHub Issue
  console.log('1️⃣  Creating GitHub issue...');
  try {
    const githubResult = await createGithubIssue(
      'Horopter!!!!',
      'This is a test issue created to verify GitHub integration is working.'
    );
    // safeAction returns SafeActionResult with result property
    const resultData = (githubResult as any).result?.data || (githubResult as any).result || (githubResult as any).data || githubResult;
    const issueUrl = resultData?.html_url || resultData?.htmlUrl || resultData?.url;
    const issueNumber = resultData?.number || resultData?.issue_number;
    
    results.github = {
      success: true,
      error: null,
      data: { url: issueUrl, number: issueNumber }
    };
    console.log(`   ✅ GitHub issue created: #${issueNumber || 'N/A'} - ${issueUrl || 'Success'}\n`);
  } catch (error: any) {
    results.github = {
      success: false,
      error: error.message || String(error),
      data: null
    };
    console.log(`   ❌ GitHub issue failed: ${error.message || error}\n`);
  }

  // 2. Send Slack Message
  console.log('2️⃣  Sending Slack message...');
  try {
    const slackResult = await slackPostMessage('Horopter!!!!');
    // safeAction returns SafeActionResult with result property
    const resultData = (slackResult as any).result?.data || (slackResult as any).result || (slackResult as any).data || slackResult;
    const messageTs = resultData?.ts || resultData?.message_ts;
    const permalink = resultData?.permalink || resultData?.message?.permalink;
    
    results.slack = {
      success: true,
      error: null,
      data: { ts: messageTs, permalink }
    };
    console.log(`   ✅ Slack message sent: ts=${messageTs || 'N/A'}, permalink=${permalink || 'Success'}\n`);
  } catch (error: any) {
    results.slack = {
      success: false,
      error: error.message || String(error),
      data: null
    };
    console.log(`   ❌ Slack message failed: ${error.message || error}\n`);
  }

  // 3. Create Calendar Event
  console.log('3️⃣  Creating calendar event...');
  try {
    // Create event 1 hour from now, lasting 30 minutes
    const now = new Date();
    const startTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    const endTime = new Date(startTime.getTime() + 30 * 60 * 1000); // 30 minutes later

    const calendarResult = await createCalendarEvent(
      'Horopter!!!!',
      startTime.toISOString(),
      endTime.toISOString(),
      'This is a test calendar invite created to verify Calendar integration is working.'
    );
    
    // Calendar returns CalendarEvent directly from safeAction
    const eventData = (calendarResult as any)?.htmlLink || (calendarResult as any)?.html_link || (calendarResult as any)?.link;
    const eventId = (calendarResult as any)?.id || (calendarResult as any)?.event_id;
    
    results.calendar = {
      success: true,
      error: null,
      data: { eventId, link: eventData }
    };
    console.log(`   ✅ Calendar event created: ID=${eventId || 'N/A'}, Link=${eventData || 'Success'}\n`);
  } catch (error: any) {
    results.calendar = {
      success: false,
      error: error.message || String(error),
      data: null
    };
    console.log(`   ❌ Calendar event failed: ${error.message || error}\n`);
  }

  // Summary
  console.log('📊 Summary');
  console.log('==========');
  console.log(`GitHub:  ${results.github.success ? '✅ Success' : `❌ Failed - ${results.github.error}`}`);
  console.log(`Slack:   ${results.slack.success ? '✅ Success' : `❌ Failed - ${results.slack.error}`}`);
  console.log(`Calendar: ${results.calendar.success ? '✅ Success' : `❌ Failed - ${results.calendar.error}`}`);
  console.log('');

  const allSuccess = results.github.success && results.slack.success && results.calendar.success;
  if (allSuccess) {
    console.log('🎉 All integrations working!');
    process.exit(0);
  } else {
    console.log('⚠️  Some integrations failed. Check errors above.');
    process.exit(1);
  }
}

// Run the tests
testIntegrations().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});

