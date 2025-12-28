#!/usr/bin/env node

/**
 * Tests for security fixes
 *
 * Covers:
 * 1. deepSanitize() - prototype pollution prevention
 * 2. Input validation - learnFromInteraction, trackProductivity
 * 3. Division by zero guards
 * 4. Error tracking metrics
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔒 Security Fixes Test Suite');
console.log('============================\n');

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
  // Capture stderr for debugging
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
  console.log('🚀 Server started, running security tests...\n');

  // ============================================
  // TEST GROUP 1: Prototype Pollution Prevention
  // ============================================
  console.log('1️⃣ Prototype Pollution Prevention (deepSanitize)');

  // Test 1.1: Nested __proto__ should be stripped
  const id1_1 = sendRequest('tools/call', {
    name: 'echo',
    arguments: {
      message: 'test',
      nested: {
        __proto__: { malicious: true },
        safe: 'value'
      }
    }
  });
  await wait(500);
  const resp1_1 = getResponse(id1_1);
  assert(resp1_1 && !resp1_1.error, 'Nested __proto__ is safely handled');

  // Test 1.2: Top-level constructor should be stripped
  const id1_2 = sendRequest('tools/call', {
    name: 'echo',
    arguments: {
      message: 'test',
      constructor: { prototype: { polluted: true } }
    }
  });
  await wait(500);
  const resp1_2 = getResponse(id1_2);
  assert(resp1_2 && !resp1_2.error, 'Top-level constructor is safely handled');

  // Test 1.3: Deep nesting should work (within limit)
  const deepNested = { a: { b: { c: { d: { e: { message: 'deep' } } } } } };
  const id1_3 = sendRequest('tools/call', {
    name: 'echo',
    arguments: { message: 'test', deep: deepNested }
  });
  await wait(500);
  const resp1_3 = getResponse(id1_3);
  assert(resp1_3 && !resp1_3.error, 'Deep nesting within limit works');

  // Test 1.4: Array with nested dangerous properties
  const id1_4 = sendRequest('tools/call', {
    name: 'echo',
    arguments: {
      message: 'test',
      items: [
        { __proto__: { bad: true } },
        { normal: 'value' }
      ]
    }
  });
  await wait(500);
  const resp1_4 = getResponse(id1_4);
  assert(resp1_4 && !resp1_4.error, 'Arrays with dangerous nested props handled');

  // ============================================
  // TEST GROUP 2: learnFromInteraction Validation
  // ============================================
  console.log('\n2️⃣ learnFromInteraction Input Validation');

  // Test 2.1: Missing interaction object
  const id2_1 = sendRequest('tools/call', {
    name: 'learn_from_interaction',
    arguments: {}
  });
  await wait(500);
  const resp2_1 = getResponse(id2_1);
  assert(resp2_1?.error !== undefined, 'Missing interaction throws error');

  // Test 2.2: Missing userInput
  const id2_2 = sendRequest('tools/call', {
    name: 'learn_from_interaction',
    arguments: {
      interaction: {
        aiResponse: 'response'
      }
    }
  });
  await wait(500);
  const resp2_2 = getResponse(id2_2);
  assert(resp2_2?.error !== undefined, 'Missing userInput throws error');

  // Test 2.3: Missing aiResponse
  const id2_3 = sendRequest('tools/call', {
    name: 'learn_from_interaction',
    arguments: {
      interaction: {
        userInput: 'input'
      }
    }
  });
  await wait(500);
  const resp2_3 = getResponse(id2_3);
  assert(resp2_3?.error !== undefined, 'Missing aiResponse throws error');

  // Test 2.4: Non-string userInput
  const id2_4 = sendRequest('tools/call', {
    name: 'learn_from_interaction',
    arguments: {
      interaction: {
        userInput: 123,
        aiResponse: 'response'
      }
    }
  });
  await wait(500);
  const resp2_4 = getResponse(id2_4);
  assert(resp2_4?.error !== undefined, 'Non-string userInput throws error');

  // Test 2.5: Non-boolean success
  const id2_5 = sendRequest('tools/call', {
    name: 'learn_from_interaction',
    arguments: {
      interaction: {
        userInput: 'input',
        aiResponse: 'response',
        success: 'yes'  // Should be boolean
      }
    }
  });
  await wait(500);
  const resp2_5 = getResponse(id2_5);
  assert(resp2_5?.error !== undefined, 'Non-boolean success throws error');

  // Test 2.6: Valid input should succeed
  const id2_6 = sendRequest('tools/call', {
    name: 'learn_from_interaction',
    arguments: {
      interaction: {
        userInput: 'valid input',
        aiResponse: 'valid response',
        success: true
      }
    }
  });
  await wait(500);
  const resp2_6 = getResponse(id2_6);
  assert(resp2_6 && !resp2_6.error, 'Valid interaction succeeds');

  // ============================================
  // TEST GROUP 3: trackProductivity Validation
  // ============================================
  console.log('\n3️⃣ trackProductivity Input Validation');

  // Test 3.1: Missing task for add_task action
  const id3_1 = sendRequest('tools/call', {
    name: 'track_productivity',
    arguments: {
      action: 'add_task'
    }
  });
  await wait(500);
  const resp3_1 = getResponse(id3_1);
  const text3_1 = resp3_1?.result?.content?.[0]?.text || '';
  assert(text3_1.includes('❌'), 'Missing task returns error');

  // Test 3.2: Missing task.name
  const id3_2 = sendRequest('tools/call', {
    name: 'track_productivity',
    arguments: {
      action: 'add_task',
      task: { efficiency: 0.5 }
    }
  });
  await wait(500);
  const resp3_2 = getResponse(id3_2);
  const text3_2 = resp3_2?.result?.content?.[0]?.text || '';
  assert(text3_2.includes('❌') && text3_2.includes('name'), 'Missing task.name returns error');

  // Test 3.3: Non-string task.name
  const id3_3 = sendRequest('tools/call', {
    name: 'track_productivity',
    arguments: {
      action: 'add_task',
      task: { name: 123 }
    }
  });
  await wait(500);
  const resp3_3 = getResponse(id3_3);
  const text3_3 = resp3_3?.result?.content?.[0]?.text || '';
  assert(text3_3.includes('❌'), 'Non-string task.name returns error');

  // Test 3.4: Efficiency out of range (> 1)
  const id3_4 = sendRequest('tools/call', {
    name: 'track_productivity',
    arguments: {
      action: 'add_task',
      task: { name: 'test', efficiency: 1.5 }
    }
  });
  await wait(500);
  const resp3_4 = getResponse(id3_4);
  const text3_4 = resp3_4?.result?.content?.[0]?.text || '';
  assert(text3_4.includes('❌') && text3_4.includes('0 and 1'), 'Efficiency > 1 returns error');

  // Test 3.5: Efficiency out of range (< 0)
  const id3_5 = sendRequest('tools/call', {
    name: 'track_productivity',
    arguments: {
      action: 'add_task',
      task: { name: 'test', efficiency: -0.5 }
    }
  });
  await wait(500);
  const resp3_5 = getResponse(id3_5);
  const text3_5 = resp3_5?.result?.content?.[0]?.text || '';
  assert(text3_5.includes('❌') && text3_5.includes('0 and 1'), 'Efficiency < 0 returns error');

  // Test 3.6: Non-array toolsUsed
  const id3_6 = sendRequest('tools/call', {
    name: 'track_productivity',
    arguments: {
      action: 'add_task',
      task: { name: 'test', toolsUsed: 'not-an-array' }
    }
  });
  await wait(500);
  const resp3_6 = getResponse(id3_6);
  const text3_6 = resp3_6?.result?.content?.[0]?.text || '';
  assert(text3_6.includes('❌') && text3_6.includes('array'), 'Non-array toolsUsed returns error');

  // Test 3.7: toolsUsed with non-string items
  const id3_7 = sendRequest('tools/call', {
    name: 'track_productivity',
    arguments: {
      action: 'add_task',
      task: { name: 'test', toolsUsed: ['valid', 123, 'also-valid'] }
    }
  });
  await wait(500);
  const resp3_7 = getResponse(id3_7);
  const text3_7 = resp3_7?.result?.content?.[0]?.text || '';
  assert(text3_7.includes('❌') && text3_7.includes('strings'), 'Non-string in toolsUsed returns error');

  // Test 3.8: Valid task should succeed
  const id3_8 = sendRequest('tools/call', {
    name: 'track_productivity',
    arguments: {
      action: 'add_task',
      task: {
        name: 'Valid Task',
        efficiency: 0.8,
        toolsUsed: ['tool1', 'tool2'],
        success: true
      }
    }
  });
  await wait(500);
  const resp3_8 = getResponse(id3_8);
  const text3_8 = resp3_8?.result?.content?.[0]?.text || '';
  assert(text3_8.includes('✅'), 'Valid task succeeds');

  // ============================================
  // TEST GROUP 4: Division by Zero Guards
  // ============================================
  console.log('\n4️⃣ Division by Zero Guards');

  // Test 4.1: get_metrics with no tool usage data
  const id4_1 = sendRequest('tools/call', {
    name: 'track_productivity',
    arguments: {
      action: 'get_metrics'
    }
  });
  await wait(500);
  const resp4_1 = getResponse(id4_1);
  assert(resp4_1 && !resp4_1.error, 'get_metrics handles zero tool usage');

  // Test 4.2: enhance_tool_usage with no data
  const id4_2 = sendRequest('tools/call', {
    name: 'enhance_tool_usage',
    arguments: {
      analysisType: 'comprehensive'
    }
  });
  await wait(500);
  const resp4_2 = getResponse(id4_2);
  assert(resp4_2 && !resp4_2.error, 'enhance_tool_usage handles zero data');

  // ============================================
  // TEST GROUP 5: Error Tracking
  // ============================================
  console.log('\n5️⃣ Error Tracking Metrics');

  // Test 5.1: Trigger an error and verify tracking works
  const id5_1 = sendRequest('tools/call', {
    name: 'nonexistent_tool_12345',
    arguments: {}
  });
  await wait(500);
  const resp5_1 = getResponse(id5_1);
  assert(resp5_1?.error !== undefined, 'Invalid tool triggers error');

  // Test 5.2: Error message includes available tools
  const errorMsg = resp5_1?.error?.message || '';
  assert(errorMsg.includes('Available tools'), 'Error message lists available tools');

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n============================');
  console.log('📊 Security Test Results');
  console.log('============================');
  console.log(`  ✅ Passed: ${testsPassed}`);
  console.log(`  ❌ Failed: ${testsFailed}`);
  console.log(`  📈 Total:  ${testsPassed + testsFailed}`);

  if (testsFailed === 0) {
    console.log('\n🎉 All security tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Please review.');
  }

  // Stop server
  server.kill();
  process.exit(testsFailed > 0 ? 1 : 0);
}, 2000);
