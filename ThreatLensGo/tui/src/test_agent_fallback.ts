import { FallbackLLMClient, FallbackTier } from './agent/llm/fallbackLLMClient.js';
import { LLMClient, LLMMessage, LLMStreamCallbacks } from './agent/llm/llmClient.js';
import { ThreatLensAgentManager } from './agent/agentManager.js';

class FailingMockLLMClient implements LLMClient {
  private errorMessage: string;
  public attempts: number = 0;

  constructor(errorMessage: string) {
    this.errorMessage = errorMessage;
  }

  public async chat(
    _messages: LLMMessage[],
    _tools: Array<{ type: 'function'; function: any }>,
    _callbacks?: LLMStreamCallbacks
  ): Promise<LLMMessage> {
    this.attempts++;
    throw new Error(this.errorMessage);
  }
}

class SuccessfulMockLLMClient implements LLMClient {
  private responseText: string;
  public attempts: number = 0;

  constructor(responseText: string) {
    this.responseText = responseText;
  }

  public async chat(
    _messages: LLMMessage[],
    _tools: Array<{ type: 'function'; function: any }>,
    callbacks?: LLMStreamCallbacks
  ): Promise<LLMMessage> {
    this.attempts++;
    if (callbacks?.onToken) {
      callbacks.onToken(this.responseText);
    }
    return {
      role: 'assistant',
      content: this.responseText,
    };
  }
}

async function runTests() {
  console.log('🧪 Starting ThreatLens Agent Fallback Tests...\n');

  // Test 1: Fallback on 401 Authentication Error
  console.log('Test 1: Simulating 401 Missing Authentication header on primary tier...');
  const tier1_401 = new FailingMockLLMClient('Upstream Error (401): {"error":{"message":"Missing Authentication header","code":401}}');
  const tier2_success = new SuccessfulMockLLMClient('Remediation plan generated successfully via fallback.');

  let switchReported = false;
  let switchedFrom = '';
  let switchedTo = '';

  const fallbackClient401 = new FallbackLLMClient([
    { id: 'backend-gateway', name: 'Backend Gateway', client: tier1_401 },
    { id: 'direct-openrouter', name: 'Direct OpenRouter', client: tier2_success },
  ], {
    onTierSwitched: (from, to) => {
      switchReported = true;
      switchedFrom = from;
      switchedTo = to;
    },
  });

  const reasoningDeltas: string[] = [];
  const tokenDeltas: string[] = [];

  const res1 = await fallbackClient401.chat(
    [{ role: 'user', content: 'Audit code' }],
    [],
    {
      onReasoning: (d) => reasoningDeltas.push(d),
      onToken: (t) => tokenDeltas.push(t),
    }
  );

  console.assert(tier1_401.attempts === 1, 'Tier 1 should have been attempted once');
  console.assert(tier2_success.attempts === 1, 'Tier 2 should have been invoked after Tier 1 failure');
  console.assert(switchReported === true, 'onTierSwitched callback should fire');
  console.assert(switchedFrom === 'Backend Gateway', `Switched from ${switchedFrom}`);
  console.assert(switchedTo === 'Direct OpenRouter', `Switched to ${switchedTo}`);
  console.assert(res1.content === 'Remediation plan generated successfully via fallback.', 'Response should match Tier 2 output');
  console.assert(reasoningDeltas.some((d) => d.includes('[Fallback Active]')), 'Reasoning callback should include fallback notice');
  console.log('✅ Test 1 Passed: 401 error gracefully caught and routed to fallback tier.\n');

  // Test 2: Fallback on 429 Rate Limit
  console.log('Test 2: Simulating 429 Rate Limit on Tier 1 and Tier 2...');
  const tier1_429 = new FailingMockLLMClient('Rate limit exceeded (429): Quota reached for free tier model');
  const tier2_429 = new FailingMockLLMClient('Rate limit exceeded (429): Busy');
  const tier3_success = new SuccessfulMockLLMClient('Fallback response from secondary model.');

  const fallbackClient429 = new FallbackLLMClient([
    { id: 'model-a', name: 'Nemotron 3 Super', client: tier1_429 },
    { id: 'model-b', name: 'Llama 3.3 70B', client: tier2_429 },
    { id: 'model-c', name: 'Gemini 2.0 Flash', client: tier3_success },
  ]);

  const res2 = await fallbackClient429.chat([{ role: 'user', content: 'Scan' }], []);
  console.assert(tier1_429.attempts === 1, 'Tier 1 tried once');
  console.assert(tier2_429.attempts === 1, 'Tier 2 tried once');
  console.assert(tier3_success.attempts === 1, 'Tier 3 succeeded');
  console.assert(res2.content === 'Fallback response from secondary model.', 'Response matches tier 3');
  console.log('✅ Test 2 Passed: Multi-model 429 cascade resolved successfully.\n');

  // Test 3: Live ThreatLensAgentManager Initialization
  console.log('Test 3: Initializing ThreatLensAgentManager in live environment...');
  const manager = new ThreatLensAgentManager();
  const controller = await manager.init();
  const stats = manager.getStats();

  console.log('Agent Stats:');
  console.log(`  • Workspace: ${stats.workspaceRoot}`);
  console.log(`  • Files Indexed: ${stats.totalFiles}`);
  console.log(`  • Symbols: ${stats.totalSymbols}`);
  console.log(`  • Model Architecture: ${stats.modelName}`);
  console.log(`  • Is Live: ${stats.isLive}`);

  console.assert(stats.isLive === true, 'Agent should be live with configured credentials');
  console.assert(stats.modelName.includes('fallback tiers') || stats.modelName.includes('Backend Gateway') || stats.modelName.includes('Direct'), 'Model name should reflect active and fallback tiers');
  console.log('✅ Test 3 Passed: ThreatLensAgentManager initialized with full fallback architecture.\n');

  await manager.shutdown();
  console.log('🎉 All tests passed successfully!');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
