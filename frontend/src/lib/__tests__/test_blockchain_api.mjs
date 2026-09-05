import { chainApi, ethApi, SAMPLE_CHAINS, SAMPLE_BLOCKS } from "../api.js";

async function runTests() {
  console.log("=== RUNNING BLOCKCHAIN API & DATA WIRING TESTS ===");
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  // Test 1: API Object Exports
  assert(typeof chainApi.getChains === "function", "chainApi.getChains is exported");
  assert(typeof chainApi.getChain === "function", "chainApi.getChain is exported");
  assert(typeof chainApi.verifyChain === "function", "chainApi.verifyChain is exported");
  assert(typeof chainApi.buildChain === "function", "chainApi.buildChain is exported");
  assert(typeof chainApi.validateChain === "function", "chainApi.validateChain is exported");
  assert(typeof ethApi.getAnchors === "function", "ethApi.getAnchors is exported");

  // Test 2: Fetching Chains
  const chains = await chainApi.getChains("mock_token");
  assert(Array.isArray(chains) && chains.length > 0, `getChains returned ${chains.length} chains`);
  assert(chains.includes("atharv_1"), "Chains list contains 'atharv_1'");

  // Test 3: Fetching Chain Blocks
  const blocks = await chainApi.getChain("mock_token", "atharv_1", 1, 10);
  assert(Array.isArray(blocks) && blocks.length >= 5, `getChain('atharv_1') returned ${blocks.length} blocks`);

  // Test 4: Block Schema & Cryptographic Linkage
  let linkageValid = true;
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (typeof b.index !== "number" || !b.type || !b.current || !b.data) {
      linkageValid = false;
      break;
    }
    if (i === 0) {
      if (b.prev !== null) linkageValid = false;
    } else {
      if (b.prev !== blocks[i - 1].current) {
        linkageValid = false;
        console.error(`Hash linkage mismatch at block ${i}: prev is ${b.prev}, expected ${blocks[i - 1].current}`);
        break;
      }
    }
  }
  assert(linkageValid, "Cryptographic hash linkage (current -> prev) verified across all blocks");

  // Test 5: Verify Chain API
  const verifyRes = await chainApi.verifyChain("mock_token", "atharv_1", "full");
  assert(verifyRes?.status === true, `verifyChain returned success status: ${verifyRes?.message}`);

  // Test 6: Ethereum Anchors API
  const anchors = await ethApi.getAnchors("chain_id", "atharv_1");
  assert(Array.isArray(anchors) && anchors.length > 0, `getAnchors returned ${anchors.length} anchor records`);
  assert(anchors[0].chain_id === "atharv_1", "Anchor record matches chain_id");

  console.log(`\nTEST SUMMARY: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
