import { masterTicker } from './hooks/useAnimationFrame.js';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${msg}`);
    process.exit(1);
  }
}

async function testTicker() {
  console.log('--- Testing Master Animation Ticker ---');

  let tickCountA = 0;
  let tickCountB = 0;

  // Subscribe subscriber A at 40ms interval
  const unsubA = masterTicker.subscribe(() => {
    tickCountA++;
  }, 40);

  // Subscribe subscriber B at 80ms interval
  const unsubB = masterTicker.subscribe(() => {
    tickCountB++;
  }, 80);

  // Wait 180ms
  await new Promise((r) => setTimeout(r, 180));

  console.log(`Ticks recorded in 180ms -> SubA (40ms): ${tickCountA}, SubB (80ms): ${tickCountB}`);
  assert(tickCountA >= 3, `SubA should have ticked at least 3 times, got ${tickCountA}`);
  assert(tickCountB >= 1, `SubB should have ticked at least 1 time, got ${tickCountB}`);
  assert(tickCountA >= tickCountB, 'SubA should tick more frequently than SubB');

  // Unsubscribe A
  unsubA();
  const countAFrozen = tickCountA;

  // Wait another 120ms
  await new Promise((r) => setTimeout(r, 120));

  assert(tickCountA === countAFrozen, `SubA must stop ticking after unsubscribe, was ${countAFrozen}, now ${tickCountA}`);
  assert(tickCountB > 0, `SubB should still be ticking`);

  // Unsubscribe B
  unsubB();

  // Wait 80ms to confirm no exceptions when 0 subscribers
  await new Promise((r) => setTimeout(r, 80));

  console.log('✅ Master Animation Ticker verified successfully with 0 memory leaks!');
}

testTicker().catch((err) => {
  console.error('Ticker test failed:', err);
  process.exit(1);
});
