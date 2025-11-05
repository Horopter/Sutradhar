/**
 * Integration Test Script - Tests all layers of the architecture
 * Run with: node scripts/test-integration.js
 */

const fetch = require('node-fetch');

const SUTRADHAR_URL = process.env.SUTRADHAR_URL || 'http://localhost:5000';
const OPTIMUS_URL = process.env.OPTIMUS_URL || 'http://localhost:4001';
const APEX_ACADEMY_URL = process.env.APEX_ACADEMY_URL || 'http://localhost:3000';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function check(result, message) {
  if (result) {
    log(`✅ ${message}`, 'green');
    return true;
  } else {
    log(`❌ ${message}`, 'red');
    return false;
  }
}

async function testEndpoint(url, options = {}) {
  try {
    const response = await fetch(url, {
      timeout: 5000,
      ...options,
    });
    const data = await response.json().catch(() => ({}));
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

async function runTests() {
  log('\n🏥 Sutradhar Health Check & Integration Tests\n', 'blue');
  log('='.repeat(50), 'blue');
  console.log('');

  let passed = 0;
  let total = 0;

  // ========== Level 1: Sutradhar Server Health ==========
  log('📡 Level 1: Sutradhar Server Health', 'blue');
  log('-'.repeat(50), 'blue');

  total++;
  const sutradharHealth = await testEndpoint(`${SUTRADHAR_URL}/health`);
  if (check(sutradharHealth.ok, 'Sutradhar server is running')) {
    passed++;
    console.log(`   Response: ${JSON.stringify(sutradharHealth.data)}`);
  } else {
    log(`   Make sure Sutradhar is running: cd apps/sutradhar && npm run dev`, 'yellow');
    console.log('');
    return;
  }
  console.log('');

  // ========== Level 2: Agent Health Checks ==========
  log('🤖 Level 2: Agent Health Checks (Sutradhar)', 'blue');
  log('-'.repeat(50), 'blue');

  const agents = ['email-agent', 'action-agent', 'llm-agent', 'retrieval-agent', 'data-agent'];
  
  for (const agentId of agents) {
    total++;
    const health = await testEndpoint(`${SUTRADHAR_URL}/orchestrator/agents/${agentId}/health`);
    const status = health.data?.health?.status || 'unknown';
    if (check(health.ok && status === 'healthy', `${agentId} is ${status}`)) {
      passed++;
    }
  }
  console.log('');

  // ========== Level 3: Agent Registration & Listing ==========
  log('📋 Level 3: Agent Registration & Listing', 'blue');
  log('-'.repeat(50), 'blue');

  total++;
  const agentsList = await testEndpoint(`${SUTRADHAR_URL}/orchestrator/agents`);
  if (check(agentsList.ok && agentsList.data?.agents?.length > 0, 'Agents list retrieved')) {
    passed++;
    console.log(`   Found ${agentsList.data.agents.length} registered agents:`);
    agentsList.data.agents.forEach(agent => {
      console.log(`     - ${agent.id} (${agent.type}, ${agent.runtime})`);
    });
  }
  console.log('');

  // ========== Level 4: Agent Task Execution ==========
  log('⚙️  Level 4: Agent Task Execution Tests', 'blue');
  log('-'.repeat(50), 'blue');

  // Test LLM Agent
  total++;
  const llmTask = await testEndpoint(`${SUTRADHAR_URL}/orchestrator/tasks/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agentId: 'llm-agent',
      task: {
        type: 'chat',
        payload: {
          system: 'You are a test assistant.',
          user: 'Say hello',
          provider: 'openai',
          model: 'gpt-4o-mini',
        },
      },
    }),
  });
  
  if (check(llmTask.ok && llmTask.data?.success, 'LLM agent task execution')) {
    passed++;
  } else {
    log('   Note: LLM agent may be in mock mode (expected in dev)', 'yellow');
  }
  console.log('');

  // Test Data Agent
  total++;
  const dataTask = await testEndpoint(`${SUTRADHAR_URL}/orchestrator/tasks/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agentId: 'data-agent',
      task: {
        type: 'query',
        payload: {
          path: 'sessions:list',
          args: {},
        },
      },
    }),
  });
  
  if (check(dataTask.ok && dataTask.data?.success, 'Data agent query execution')) {
    passed++;
  } else {
    log('   Note: Data agent may fail if Convex is not running', 'yellow');
  }
  console.log('');

  // ========== Level 5: Optimus Integration ==========
  log('🔗 Level 5: Optimus → Sutradhar Integration', 'blue');
  log('-'.repeat(50), 'blue');

  total++;
  const optimusHealth = await testEndpoint(`${OPTIMUS_URL}/health`);
  if (check(optimusHealth.ok, 'Optimus server is running')) {
    passed++;
    console.log(`   Response: ${JSON.stringify(optimusHealth.data)}`);
    
    total++;
    if (check(
      optimusHealth.data?.sutradharConnected === true,
      'Optimus connected to Sutradhar'
    )) {
      passed++;
    }
  } else {
    log('   Optimus server is not running. Run: cd apps/optimus && npm run dev', 'yellow');
  }
  console.log('');

  // ========== Level 6: Optimus Agent Endpoints ==========
  log('🎯 Level 6: Optimus Agent Endpoints', 'blue');
  log('-'.repeat(50), 'blue');

  if (optimusHealth.ok) {
    total++;
    const optimusAgents = await testEndpoint(`${OPTIMUS_URL}/agents`);
    if (check(optimusAgents.ok && optimusAgents.data?.agents?.length > 0, 'Optimus agents list retrieved')) {
      passed++;
      console.log(`   Found ${optimusAgents.data.agents.length} Optimus agents`);
    }

    total++;
    const catalog = await testEndpoint(`${OPTIMUS_URL}/catalog`);
    if (check(catalog.ok, 'Optimus catalog endpoint')) {
      passed++;
    }
  }
  console.log('');

  // ========== Level 7: Apex Academy Integration ==========
  log('🌐 Level 7: Apex Academy → Optimus Integration', 'blue');
  log('-'.repeat(50), 'blue');

  total++;
  const apexHealth = await testEndpoint(`${APEX_ACADEMY_URL}`);
  if (check(apexHealth.ok, 'Apex Academy server is running')) {
    passed++;
  } else {
    log('   Apex Academy server is not running. Run: cd apps/apex-academy && pnpm dev', 'yellow');
  }
  console.log('');

  // ========== Summary ==========
  log('📊 Summary', 'blue');
  log('='.repeat(50), 'blue');
  log(`Tests passed: ${passed}/${total}`, passed === total ? 'green' : 'yellow');
  console.log('');

  if (passed === total) {
    log('🎉 All integration tests passed!', 'green');
  } else {
    log('⚠️  Some tests failed. Check the output above.', 'yellow');
  }
  console.log('');
}

// Run tests
runTests().catch(error => {
  log(`\n❌ Test execution failed: ${error.message}`, 'red');
  process.exit(1);
});

