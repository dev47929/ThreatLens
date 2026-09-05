/**
 * End-to-End Automated Testing for TUI Attack Suites
 * Tests: DDoS, SQLi, XSS, Data Burning, and Origin-Proxy attacks
 * against live backend and test backends using backendClient.
 */
import { backendClient } from './api/backendClient.js';
import type { AttackType, AttackStatus } from './api/types.js';

async function runAttackTest(
  name: string,
  type: AttackType,
  config: any,
  timeoutMs: number = 30000
): Promise<{ success: boolean; data?: AttackStatus; error?: string }> {
  console.log(`\n==================================================`);
  console.log(`▶️ RUNNING: ${name} (${type.toUpperCase()})`);
  console.log(`   Target: ${config.target.base_url}${config.target.endpoint} [${config.target.method}]`);
  console.log(`==================================================`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const startRes = await backendClient.startAttack(type, config, {
      signal: controller.signal,
    });
    console.log(`  ✓ Dispatched attack. ID: ${startRes.attack_id}, initial status: ${startRes.status}`);

    const stream = backendClient.streamAttack(type, startRes.attack_id, {
      signal: controller.signal,
    });

    let lastStatus: AttackStatus | undefined;
    let sseCount = 0;

    for await (const chunk of stream) {
      lastStatus = chunk;
      sseCount++;
      const attempted = chunk.progress?.attempted_requests ?? 0;
      const planned = chunk.progress?.planned_requests ?? 0;
      const successful = chunk.requests?.successful ?? 0;
      process.stdout.write(`\r  [SSE #${sseCount}] Status: ${chunk.status} | Attempted: ${attempted}/${planned} | Success: ${successful}`);

      const stateStr = (chunk.status || '').toLowerCase();
      if (stateStr === 'completed' || stateStr === 'stopped' || stateStr === 'failed') {
        break;
      }
    }

    clearTimeout(timeoutId);
    console.log(''); // newline

    if (!lastStatus) {
      // Fallback to direct GET status if SSE ended before yielding
      lastStatus = await backendClient.getAttackStatus(type, startRes.attack_id);
    }

    console.log(`  ✓ Terminal State Reached: ${lastStatus.status}`);
    console.log(`  📊 Telemetry Summary:`);
    console.log(`     • Attempted: ${lastStatus.progress?.attempted_requests ?? 'N/A'}`);
    console.log(`     • Successful: ${lastStatus.requests?.successful ?? 'N/A'}`);
    console.log(`     • Status Codes: ${JSON.stringify(lastStatus.status_codes ?? {})}`);
    if (Array.isArray(lastStatus.findings) && lastStatus.findings.length > 0) {
      console.log(`     • Findings Detected: ${lastStatus.findings.length} vulnerabilities flagged!`);
    }

    return { success: true, data: lastStatus };
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.log(`\n  ✗ FAILED: ${err.message}`);
    return { success: false, error: err.message };
  }
}

async function main() {
  console.log('🚀 Starting ThreatLensGo TUI Attack Test Suite...');
  console.log(`   Backend URL: ${backendClient.getBaseUrl()}`);

  const results: Record<string, boolean> = {};

  // 1. DDoS Simulation Test
  const ddosRes = await runAttackTest(
    'DDoS Traffic Simulation (Healthy API Reference)',
    'ddos',
    {
      target: {
        base_url: 'http://localhost:8001',
        endpoint: '/health',
        method: 'GET',
        path_params: null,
        query_params: null,
      },
      request: {
        headers: null,
        auth: null,
        body: null,
      },
      attack: {
        duration: 2,
        requests: 15,
        concurrency: 3,
        delay: 0.05,
        timeout: 1,
        retries: 0,
        on_failure: 'continue',
      },
    },
    15000
  );
  results['DDoS Simulation'] = ddosRes.success;

  // 2. SQL Injection Test (POST Body parameters)
  const sqliRes = await runAttackTest(
    'SQL Injection Assessment (Healthy API Login)',
    'sqli',
    {
      target: {
        base_url: 'http://localhost:8001',
        endpoint: '/api/auth/login',
        method: 'POST',
        query_params: {},
        path_params: {},
      },
      request: {
        headers: { 'Content-Type': 'application/json' },
        body: { username: 'test', password: 'test' },
        auth: null,
      },
      attack: {
        requests_per_case: 1,
        delay: 0.02,
        timeout: 2,
        on_failure: 'continue',
      },
    },
    20000
  );
  results['SQL Injection'] = sqliRes.success;

  // 3. XSS Assessment Test (GET Query parameters on Vulnerable Social Node)
  const xssRes = await runAttackTest(
    'Cross-Site Scripting (XSS) Probe (Social Node Feed Search)',
    'xss',
    {
      target: {
        base_url: 'http://localhost:8004',
        endpoint: '/api/feed/search',
        method: 'GET',
        query_params: { q: '' },
        path_params: {},
      },
      request: {
        headers: {},
        body: {},
        auth: null,
      },
      attack: {
        requests_per_case: 1,
        delay: 0.02,
        timeout: 2,
        on_failure: 'continue',
      },
    },
    20000
  );
  results['Cross-Site Scripting (XSS)'] = xssRes.success;

  // 4. Data Burning / Exfiltration Test
  const exfilRes = await runAttackTest(
    'Data Burning & Exfiltration Scan (Healthy API)',
    'data-burning',
    {
      target: {
        base_url: 'http://localhost:8001',
        endpoint: '/health',
        method: 'GET',
        path_params: null,
        query_params: null,
      },
      request: {
        headers: {
          'X-ThreatLens-Vectors': 'API response leakage,Header leakage',
          'X-Scan-Depth': 'Surface scan',
        },
        auth: null,
        body: null,
      },
      attack: {
        duration: 2,
        requests: 10,
        concurrency: 2,
        delay: 0.05,
        timeout: 2,
        retries: 0,
        on_failure: 'continue',
      },
    },
    15000
  );
  results['Data Burning'] = exfilRes.success;

  // 5. Origin-Proxy Interception Test
  const proxyRes = await runAttackTest(
    'Origin & Proxy Interception Probes (Healthy API)',
    'origin-proxy',
    {
      target: {
        base_url: 'http://localhost:8001',
        endpoint: '/health',
        method: 'GET',
        path_params: null,
        query_params: null,
      },
      request: {
        headers: {},
        auth: null,
        body: null,
      },
      attack: {
        requests_per_case: 1,
        delay: 0.02,
        timeout: 2,
        on_failure: 'continue',
      },
    },
    20000
  );
  results['Origin & Proxy'] = proxyRes.success;

  console.log('\n==================================================');
  console.log('🏁 TEST SUITE RUN RESULTS');
  console.log('==================================================');
  let allPassed = true;
  for (const [testName, passed] of Object.entries(results)) {
    console.log(`  ${passed ? '✅ PASSED' : '❌ FAILED'}: ${testName}`);
    if (!passed) allPassed = false;
  }
  console.log('==================================================');

  if (allPassed) {
    console.log('🎉 ALL 5 ATTACK MODULES AND TUI INTEGRATIONS VERIFIED SUCCESSFULLY!');
    process.exit(0);
  } else {
    console.error('⚠️ Some attack tests failed.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
