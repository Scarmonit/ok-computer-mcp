#!/usr/bin/env node

/**
 * Tests for the tool/prompt lookup fix
 *
 * Verifies:
 * 1. Tools can be called by snake_case name (e.g., system_info)
 * 2. Prompts can be called by snake_case name (e.g., code_review)
 * 3. Non-existent tools throw appropriate errors
 * 4. system_info tool doesn't expose process.env (security fix)
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Tool/Prompt Lookup Fix Tests');
console.log('================================\n');

const serverPath = join(__dirname, 'src', 'index.js');
const server = spawn('node', [serverPath]);

let responses = [];
let requestId = 0;
let testsPassed = 0;
let testsFailed = 0;

// Setup response handler
let buffer = '';
server.stdout.on('data', (data) => {
  buffer += data.toString();
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';

  lines.forEach(line => {
    if (line.trim()) {
      try {
        const response = JSON.parse(line);
        responses.push(response);
      } catch (e) {
        // Ignore non-JSON output
      }
    }
  });
});

server.stderr.on('data', (data) => {
  // Capture stderr but don't print unless error
});

function sendRequest(method, params) {
  requestId++;
  const request = {
    jsonrpc: '2.0',
    id: requestId,
    method,
    params
  };
  server.stdin.write(JSON.stringify(request) + '\n');
  return requestId;
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getResponse(id) {
  return responses.find(r => r.id === id);
}

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    testsPassed++;
  } else {
    console.log(`  ❌ FAIL: ${testName}`);
    if (details) console.log(`     Details: ${details}`);
    testsFailed++;
  }
}

// Wait for server to start
setTimeout(async () => {
  console.log('🚀 Server started, running tests...\n');

  // ============================================
  // TEST 1: Tool lookup by snake_case name
  // ============================================
  console.log('1️⃣ Tool lookup by snake_case name (system_info)');
  const id1 = sendRequest('tools/call', {
    name: 'system_info',  // snake_case, not systemInfo
    arguments: { detail: 'basic' }
  });
  await wait(1000);
  const resp1 = getResponse(id1);
  assert(resp1 && !resp1.error, 'system_info tool callable by snake_case name');
  assert(
    resp1?.result?.content?.[0]?.text?.includes('System Information'),
    'system_info returns expected content'
  );

  // ============================================
  // TEST 2: Prompt lookup by snake_case name
  // ============================================
  console.log('\n2️⃣ Prompt lookup by snake_case name (code_review)');
  const id2 = sendRequest('prompts/get', {
    name: 'code_review',  // snake_case, not codeReview
    arguments: { code: 'console.log("test")', language: 'javascript' }
  });
  await wait(1000);
  const resp2 = getResponse(id2);
  assert(resp2 && !resp2.error, 'code_review prompt callable by snake_case name');
  assert(
    resp2?.result?.messages?.[0]?.content?.text?.includes('javascript'),
    'code_review returns expected prompt content'
  );

  // ============================================
  // TEST 3: Non-existent tool returns error
  // ============================================
  console.log('\n3️⃣ Non-existent tool returns error');
  const id3 = sendRequest('tools/call', {
    name: 'nonexistent_tool',
    arguments: {}
  });
  await wait(1000);
  const resp3 = getResponse(id3);
  assert(resp3?.error !== undefined, 'Non-existent tool returns error');
  assert(
    resp3?.error?.message?.includes('Tool not found'),
    'Error message mentions "Tool not found"',
    resp3?.error?.message
  );

  // ============================================
  // TEST 4: system_info doesn't expose process.env (security)
  // ============================================
  console.log('\n4️⃣ Security: system_info does NOT expose process.env');
  const id4 = sendRequest('tools/call', {
    name: 'system_info',
    arguments: { detail: 'full' }
  });
  await wait(1000);
  const resp4 = getResponse(id4);
  const content4 = resp4?.result?.content?.[0]?.text || '';

  // Parse the JSON from the response
  const jsonMatch = content4.match(/```json\n([\s\S]*?)\n```/);
  let info = {};
  if (jsonMatch) {
    try {
      info = JSON.parse(jsonMatch[1]);
    } catch (e) {
      // Ignore parse errors
    }
  }

  assert(!info.env, 'process.env is NOT exposed in response');
  assert(info.safeEnv !== undefined, 'safeEnv is provided instead');
  assert(info.versions !== undefined, 'versions is still included');

  // ============================================
  // TEST 5: All snake_case tools are callable
  // ============================================
  console.log('\n5️⃣ All tools callable by snake_case name');
  const toolsToTest = [
    'echo',
    'learn_from_interaction',
    'get_learning_insights',
    'adapt_behavior',
    'optimize_performance',
    'auto_optimize',
    'track_productivity',
    'enhance_tool_usage'
  ];

  for (const toolName of toolsToTest) {
    const id = sendRequest('tools/call', {
      name: toolName,
      arguments: toolName === 'echo' ? { message: 'test' } :
                 toolName === 'learn_from_interaction' ? { interaction: { userInput: 'test', aiResponse: 'test' } } :
                 toolName === 'adapt_behavior' ? { adaptation: {} } :
                 {}
    });
    await wait(500);
    const resp = getResponse(id);
    assert(resp && !resp.error, `${toolName} is callable`);
  }

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n================================');
  console.log('📊 Test Results Summary');
  console.log('================================');
  console.log(`  ✅ Passed: ${testsPassed}`);
  console.log(`  ❌ Failed: ${testsFailed}`);
  console.log(`  📈 Total:  ${testsPassed + testsFailed}`);

  if (testsFailed === 0) {
    console.log('\n🎉 All tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the failures above.');
  }

  // Stop server
  server.kill();
  process.exit(testsFailed > 0 ? 1 : 0);
}, 2000);
