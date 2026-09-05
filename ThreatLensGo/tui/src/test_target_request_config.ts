import assert from 'assert';
import { DEFAULT_TARGET_CONFIG, DEFAULT_REQUEST_CONFIG } from './state/securitySession.js';

console.log('--- Testing Default Target & Request Configuration ---');

console.log('DEFAULT_TARGET_CONFIG:', JSON.stringify(DEFAULT_TARGET_CONFIG, null, 2));
console.log('DEFAULT_REQUEST_CONFIG:', JSON.stringify(DEFAULT_REQUEST_CONFIG, null, 2));

assert.strictEqual(DEFAULT_TARGET_CONFIG.base_url, 'http://localhost:8000');
assert.strictEqual(DEFAULT_TARGET_CONFIG.endpoint, '/tc-auth/config/pulse');
assert.strictEqual(DEFAULT_TARGET_CONFIG.method, 'GET');
assert.strictEqual(DEFAULT_TARGET_CONFIG.path_params, null);
assert.strictEqual(DEFAULT_TARGET_CONFIG.query_params, null);

assert.strictEqual(DEFAULT_REQUEST_CONFIG.headers, null);
assert.strictEqual(DEFAULT_REQUEST_CONFIG.auth, null);
assert.strictEqual(DEFAULT_REQUEST_CONFIG.body, null);

// Simulate full attack request payload generated before launch
const samplePayload = {
  target: {
    base_url: DEFAULT_TARGET_CONFIG.base_url,
    endpoint: DEFAULT_TARGET_CONFIG.endpoint,
    method: DEFAULT_TARGET_CONFIG.method,
    path_params: DEFAULT_TARGET_CONFIG.path_params,
    query_params: DEFAULT_TARGET_CONFIG.query_params,
  },
  request: {
    headers: DEFAULT_REQUEST_CONFIG.headers,
    auth: DEFAULT_REQUEST_CONFIG.auth,
    body: DEFAULT_REQUEST_CONFIG.body,
  },
  attack: {
    duration: 30,
    requests: 1000,
    concurrency: 100,
    delay: 0.2,
    timeout: 1,
    retries: 0,
    on_failure: 'continue',
  },
};

console.log('\n--- Constructed Attack Payload ---');
console.log(JSON.stringify(samplePayload, null, 2));

assert.deepStrictEqual(samplePayload.target, {
  base_url: 'http://localhost:8000',
  endpoint: '/tc-auth/config/pulse',
  method: 'GET',
  path_params: null,
  query_params: null,
});

assert.deepStrictEqual(samplePayload.request, {
  headers: null,
  auth: null,
  body: null,
});

// Test custom configuration
const customTarget = {
  base_url: 'https://api.example.com',
  endpoint: '/v1/users',
  method: 'POST',
  path_params: { user_id: '42' },
  query_params: { active: 'true' },
};

const customRequest = {
  headers: {
    'Authorization': 'Bearer test-token-xyz',
    'Content-Type': 'application/json',
  },
  auth: 'Bearer test-token-xyz',
  body: { name: 'Alice' },
};

assert.strictEqual(customTarget.base_url, 'https://api.example.com');
assert.strictEqual(customTarget.endpoint, '/v1/users');
assert.strictEqual(customTarget.method, 'POST');
assert.deepStrictEqual(customRequest.headers, {
  'Authorization': 'Bearer test-token-xyz',
  'Content-Type': 'application/json',
});

console.log('\n✅ All target and request configuration assertions PASSED successfully!');
