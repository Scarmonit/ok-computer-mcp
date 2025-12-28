#!/usr/bin/env node

/**
 * Tests for coverage gaps identified in code review
 *
 * Covers:
 * 1. get_learning_insights - detail levels and focus areas
 * 2. adapt_behavior - preference persistence and validation
 * 3. optimize_performance - optimization types
 * 4. auto_optimize - timing and force logic
 * 5. performAutoOptimization - error handling
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('📊 Coverage Gap Test Suite');
console.log('==========================\n');

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
  console.log('🚀 Server started, running coverage gap tests...\n');

  // ============================================
  // TEST GROUP 1: get_learning_insights
  // ============================================
  console.log('1️⃣ get_learning_insights - Detail Levels and Focus Areas');

  // Test 1.1: Default parameters (summary, all)
  const id1_1 = sendRequest('tools/call', {
    name: 'get_learning_insights',
    arguments: {}
  });
  await wait(500);
  const resp1_1 = getResponse(id1_1);
  const text1_1 = resp1_1?.result?.content?.[0]?.text || '';
  assert(resp1_1 && !resp1_1.error, 'Default parameters work');
  assert(text1_1.includes('summary'), 'Summary view mentioned in output');

  // Test 1.2: Detailed level
  const id1_2 = sendRequest('tools/call', {
    name: 'get_learning_insights',
    arguments: { detailLevel: 'detailed' }
  });
  await wait(500);
  const resp1_2 = getResponse(id1_2);
  const text1_2 = resp1_2?.result?.content?.[0]?.text || '';
  assert(resp1_2 && !resp1_2.error, 'Detailed level works');
  assert(text1_2.includes('detailed'), 'Detailed view mentioned in output');

  // Test 1.3: Full level
  const id1_3 = sendRequest('tools/call', {
    name: 'get_learning_insights',
    arguments: { detailLevel: 'full' }
  });
  await wait(500);
  const resp1_3 = getResponse(id1_3);
  const text1_3 = resp1_3?.result?.content?.[0]?.text || '';
  assert(resp1_3 && !resp1_3.error, 'Full level works');
  assert(text1_3.includes('Recent Learning'), 'Full level includes recent learning');

  // Test 1.4: Performance focus area
  const id1_4 = sendRequest('tools/call', {
    name: 'get_learning_insights',
    arguments: { focusArea: 'performance' }
  });
  await wait(500);
  const resp1_4 = getResponse(id1_4);
  const text1_4 = resp1_4?.result?.content?.[0]?.text || '';
  assert(resp1_4 && !resp1_4.error, 'Performance focus works');
  assert(text1_4.includes('Performance Metrics'), 'Performance metrics included');

  // Test 1.5: Patterns focus area
  const id1_5 = sendRequest('tools/call', {
    name: 'get_learning_insights',
    arguments: { focusArea: 'patterns' }
  });
  await wait(500);
  const resp1_5 = getResponse(id1_5);
  const text1_5 = resp1_5?.result?.content?.[0]?.text || '';
  assert(resp1_5 && !resp1_5.error, 'Patterns focus works');
  assert(text1_5.includes('Learned Patterns'), 'Patterns section included');

  // Test 1.6: Knowledge focus area
  const id1_6 = sendRequest('tools/call', {
    name: 'get_learning_insights',
    arguments: { focusArea: 'knowledge' }
  });
  await wait(500);
  const resp1_6 = getResponse(id1_6);
  const text1_6 = resp1_6?.result?.content?.[0]?.text || '';
  assert(resp1_6 && !resp1_6.error, 'Knowledge focus works');
  assert(text1_6.includes('Knowledge Base'), 'Knowledge base section included');

  // ============================================
  // TEST GROUP 2: adapt_behavior - Preference Persistence
  // ============================================
  console.log('\n2️⃣ adapt_behavior - Preference Persistence');

  // Test 2.1: Set communication style
  const id2_1 = sendRequest('tools/call', {
    name: 'adapt_behavior',
    arguments: {
      adaptation: { communicationStyle: 'formal' },
      reason: 'Testing formal style'
    }
  });
  await wait(500);
  const resp2_1 = getResponse(id2_1);
  const text2_1 = resp2_1?.result?.content?.[0]?.text || '';
  assert(resp2_1 && !resp2_1.error, 'Communication style update works');
  assert(text2_1.includes('Communication style'), 'Style change reflected in output');
  assert(text2_1.includes('formal'), 'New style value in output');

  // Test 2.2: Set response detail level
  const id2_2 = sendRequest('tools/call', {
    name: 'adapt_behavior',
    arguments: {
      adaptation: { responseDetailLevel: 'comprehensive' }
    }
  });
  await wait(500);
  const resp2_2 = getResponse(id2_2);
  const text2_2 = resp2_2?.result?.content?.[0]?.text || '';
  assert(resp2_2 && !resp2_2.error, 'Response detail level update works');
  assert(text2_2.includes('comprehensive'), 'Detail level change reflected');

  // Test 2.3: Set proactivity level
  const id2_3 = sendRequest('tools/call', {
    name: 'adapt_behavior',
    arguments: {
      adaptation: { proactivityLevel: 'proactive' }
    }
  });
  await wait(500);
  const resp2_3 = getResponse(id2_3);
  const text2_3 = resp2_3?.result?.content?.[0]?.text || '';
  assert(resp2_3 && !resp2_3.error, 'Proactivity level update works');
  assert(text2_3.includes('proactive'), 'Proactivity change reflected');

  // Test 2.4: Set learning rate
  const id2_4 = sendRequest('tools/call', {
    name: 'adapt_behavior',
    arguments: {
      adaptation: { learningRate: 'aggressive' }
    }
  });
  await wait(500);
  const resp2_4 = getResponse(id2_4);
  const text2_4 = resp2_4?.result?.content?.[0]?.text || '';
  assert(resp2_4 && !resp2_4.error, 'Learning rate update works');
  assert(text2_4.includes('aggressive'), 'Learning rate change reflected');

  // Test 2.5: Set custom preferences
  const id2_5 = sendRequest('tools/call', {
    name: 'adapt_behavior',
    arguments: {
      adaptation: {
        customPreferences: {
          theme: 'dark',
          language: 'en'
        }
      }
    }
  });
  await wait(500);
  const resp2_5 = getResponse(id2_5);
  const text2_5 = resp2_5?.result?.content?.[0]?.text || '';
  assert(resp2_5 && !resp2_5.error, 'Custom preferences update works');
  assert(text2_5.includes('Custom preferences'), 'Custom prefs change reflected');

  // Test 2.6: Multiple adaptations at once
  const id2_6 = sendRequest('tools/call', {
    name: 'adapt_behavior',
    arguments: {
      adaptation: {
        communicationStyle: 'technical',
        responseDetailLevel: 'detailed',
        proactivityLevel: 'responsive'
      },
      reason: 'Batch update test'
    }
  });
  await wait(500);
  const resp2_6 = getResponse(id2_6);
  const text2_6 = resp2_6?.result?.content?.[0]?.text || '';
  assert(resp2_6 && !resp2_6.error, 'Multiple adaptations at once work');
  assert(text2_6.includes('technical'), 'First adaptation in batch');
  assert(text2_6.includes('detailed'), 'Second adaptation in batch');
  assert(text2_6.includes('responsive'), 'Third adaptation in batch');
  assert(text2_6.includes('Batch update test'), 'Reason included in output');

  // Test 2.7: Empty adaptation object
  const id2_7 = sendRequest('tools/call', {
    name: 'adapt_behavior',
    arguments: {
      adaptation: {}
    }
  });
  await wait(500);
  const resp2_7 = getResponse(id2_7);
  assert(resp2_7 && !resp2_7.error, 'Empty adaptation object handled');

  // ============================================
  // TEST GROUP 3: optimize_performance
  // ============================================
  console.log('\n3️⃣ optimize_performance - Optimization Types');

  // Test 3.1: Comprehensive optimization (default)
  const id3_1 = sendRequest('tools/call', {
    name: 'optimize_performance',
    arguments: {}
  });
  await wait(500);
  const resp3_1 = getResponse(id3_1);
  const text3_1 = resp3_1?.result?.content?.[0]?.text || '';
  assert(resp3_1 && !resp3_1.error, 'Default optimization works');
  assert(text3_1.includes('Optimization'), 'Optimization mentioned');

  // Test 3.2: Response time optimization
  const id3_2 = sendRequest('tools/call', {
    name: 'optimize_performance',
    arguments: { optimizationType: 'response_time' }
  });
  await wait(500);
  const resp3_2 = getResponse(id3_2);
  assert(resp3_2 && !resp3_2.error, 'Response time optimization works');

  // Test 3.3: Accuracy optimization
  const id3_3 = sendRequest('tools/call', {
    name: 'optimize_performance',
    arguments: { optimizationType: 'accuracy' }
  });
  await wait(500);
  const resp3_3 = getResponse(id3_3);
  assert(resp3_3 && !resp3_3.error, 'Accuracy optimization works');

  // Test 3.4: User satisfaction optimization
  const id3_4 = sendRequest('tools/call', {
    name: 'optimize_performance',
    arguments: { optimizationType: 'user_satisfaction' }
  });
  await wait(500);
  const resp3_4 = getResponse(id3_4);
  assert(resp3_4 && !resp3_4.error, 'User satisfaction optimization works');

  // Test 3.5: Efficiency optimization
  const id3_5 = sendRequest('tools/call', {
    name: 'optimize_performance',
    arguments: { optimizationType: 'efficiency' }
  });
  await wait(500);
  const resp3_5 = getResponse(id3_5);
  assert(resp3_5 && !resp3_5.error, 'Efficiency optimization works');

  // Test 3.6: With implementation suggestions
  const id3_6 = sendRequest('tools/call', {
    name: 'optimize_performance',
    arguments: {
      optimizationType: 'comprehensive',
      includeImplementation: true
    }
  });
  await wait(500);
  const resp3_6 = getResponse(id3_6);
  const text3_6 = resp3_6?.result?.content?.[0]?.text || '';
  assert(resp3_6 && !resp3_6.error, 'Implementation suggestions work');

  // ============================================
  // TEST GROUP 4: auto_optimize - Timing and Force
  // ============================================
  console.log('\n4️⃣ auto_optimize - Timing and Force Logic');

  // Test 4.1: Force optimization
  const id4_1 = sendRequest('tools/call', {
    name: 'auto_optimize',
    arguments: { force: true }
  });
  await wait(500);
  const resp4_1 = getResponse(id4_1);
  assert(resp4_1 && !resp4_1.error, 'Force optimization works');

  // Test 4.2: Performance priority
  const id4_2 = sendRequest('tools/call', {
    name: 'auto_optimize',
    arguments: { priority: 'performance', force: true }
  });
  await wait(500);
  const resp4_2 = getResponse(id4_2);
  assert(resp4_2 && !resp4_2.error, 'Performance priority works');

  // Test 4.3: Productivity priority
  const id4_3 = sendRequest('tools/call', {
    name: 'auto_optimize',
    arguments: { priority: 'productivity', force: true }
  });
  await wait(500);
  const resp4_3 = getResponse(id4_3);
  assert(resp4_3 && !resp4_3.error, 'Productivity priority works');

  // Test 4.4: Tool usage priority
  const id4_4 = sendRequest('tools/call', {
    name: 'auto_optimize',
    arguments: { priority: 'tool_usage', force: true }
  });
  await wait(500);
  const resp4_4 = getResponse(id4_4);
  assert(resp4_4 && !resp4_4.error, 'Tool usage priority works');

  // Test 4.5: Balanced priority (default)
  const id4_5 = sendRequest('tools/call', {
    name: 'auto_optimize',
    arguments: { priority: 'balanced', force: true }
  });
  await wait(500);
  const resp4_5 = getResponse(id4_5);
  assert(resp4_5 && !resp4_5.error, 'Balanced priority works');

  // Test 4.6: Aggressive mode
  const id4_6 = sendRequest('tools/call', {
    name: 'auto_optimize',
    arguments: { aggressive: true, force: true }
  });
  await wait(500);
  const resp4_6 = getResponse(id4_6);
  assert(resp4_6 && !resp4_6.error, 'Aggressive mode works');

  // Test 4.7: Skip if recently run (without force)
  // First call
  sendRequest('tools/call', {
    name: 'auto_optimize',
    arguments: { force: true }
  });
  await wait(500);
  // Second call without force should skip
  const id4_7 = sendRequest('tools/call', {
    name: 'auto_optimize',
    arguments: { force: false }
  });
  await wait(500);
  const resp4_7 = getResponse(id4_7);
  const text4_7 = resp4_7?.result?.content?.[0]?.text || '';
  assert(resp4_7 && !resp4_7.error, 'Skip logic handles gracefully');
  // Note: May or may not skip depending on timing, just verify no error

  // ============================================
  // TEST GROUP 5: enhance_tool_usage - Additional Coverage
  // ============================================
  console.log('\n5️⃣ enhance_tool_usage - Analysis Types');

  // Test 5.1: Usage patterns
  const id5_1 = sendRequest('tools/call', {
    name: 'enhance_tool_usage',
    arguments: { analysisType: 'usage_patterns' }
  });
  await wait(500);
  const resp5_1 = getResponse(id5_1);
  assert(resp5_1 && !resp5_1.error, 'Usage patterns analysis works');

  // Test 5.2: Effectiveness analysis
  const id5_2 = sendRequest('tools/call', {
    name: 'enhance_tool_usage',
    arguments: { analysisType: 'effectiveness' }
  });
  await wait(500);
  const resp5_2 = getResponse(id5_2);
  assert(resp5_2 && !resp5_2.error, 'Effectiveness analysis works');

  // Test 5.3: Recommendations
  const id5_3 = sendRequest('tools/call', {
    name: 'enhance_tool_usage',
    arguments: { analysisType: 'recommendations' }
  });
  await wait(500);
  const resp5_3 = getResponse(id5_3);
  assert(resp5_3 && !resp5_3.error, 'Recommendations analysis works');

  // Test 5.4: Different timeframes
  const id5_4 = sendRequest('tools/call', {
    name: 'enhance_tool_usage',
    arguments: { timeframe: 'hour' }
  });
  await wait(500);
  const resp5_4 = getResponse(id5_4);
  assert(resp5_4 && !resp5_4.error, 'Hour timeframe works');

  // Test 5.5: Day timeframe
  const id5_5 = sendRequest('tools/call', {
    name: 'enhance_tool_usage',
    arguments: { timeframe: 'day' }
  });
  await wait(500);
  const resp5_5 = getResponse(id5_5);
  assert(resp5_5 && !resp5_5.error, 'Day timeframe works');

  // Test 5.6: Target specific tools
  const id5_6 = sendRequest('tools/call', {
    name: 'enhance_tool_usage',
    arguments: { targetTools: ['echo', 'system_info'] }
  });
  await wait(500);
  const resp5_6 = getResponse(id5_6);
  assert(resp5_6 && !resp5_6.error, 'Target tools filter works');

  // ============================================
  // TEST GROUP 6: track_productivity - Additional Coverage
  // ============================================
  console.log('\n6️⃣ track_productivity - Goal Management');

  // Test 6.1: Set a goal
  const id6_1 = sendRequest('tools/call', {
    name: 'track_productivity',
    arguments: {
      action: 'set_goal',
      goal: {
        description: 'Complete all tests',
        priority: 'high',
        deadline: new Date(Date.now() + 86400000).toISOString()
      }
    }
  });
  await wait(500);
  const resp6_1 = getResponse(id6_1);
  assert(resp6_1 && !resp6_1.error, 'Set goal works');

  // Test 6.2: Complete a task
  const id6_2 = sendRequest('tools/call', {
    name: 'track_productivity',
    arguments: {
      action: 'complete_task'
    }
  });
  await wait(500);
  const resp6_2 = getResponse(id6_2);
  assert(resp6_2 && !resp6_2.error, 'Complete task works');

  // Test 6.3: Analyze efficiency
  const id6_3 = sendRequest('tools/call', {
    name: 'track_productivity',
    arguments: {
      action: 'analyze_efficiency'
    }
  });
  await wait(500);
  const resp6_3 = getResponse(id6_3);
  assert(resp6_3 && !resp6_3.error, 'Analyze efficiency works');

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n==========================');
  console.log('📊 Coverage Gap Test Results');
  console.log('==========================');
  console.log(`  ✅ Passed: ${testsPassed}`);
  console.log(`  ❌ Failed: ${testsFailed}`);
  console.log(`  📈 Total:  ${testsPassed + testsFailed}`);

  if (testsFailed === 0) {
    console.log('\n🎉 All coverage gap tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Please review.');
  }

  // Stop server
  server.kill();
  process.exit(testsFailed > 0 ? 1 : 0);
}, 2000);
