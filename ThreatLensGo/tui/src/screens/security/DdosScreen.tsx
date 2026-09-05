import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { useNavigation } from '../../state/navigation.js';
import { useSecuritySession } from '../../state/securitySession.js';
import { TerminalLayout } from '../../components/TerminalLayout.js';
import { Select } from '../../components/Select.js';
import { AttackRunner } from '../../components/AttackRunner.js';

type Step = 1 | 2 | 3 | 4;
type AttackPattern = 'Flood' | 'Slowloris-style' | 'Burst-spike';
type Intensity = 'Light' | 'Medium' | 'Heavy';
type DurationOption = '10s' | '30s' | '60s' | 'Custom';

const CONCURRENCY_MAP: Record<Intensity, number> = {
  Light: 5,
  Medium: 10,
  Heavy: 20,
};

const PATTERN_SETTINGS: Record<AttackPattern, { delay: number; timeout: number }> = {
  Flood: { delay: 0.05, timeout: 1 },
  'Slowloris-style': { delay: 0.5, timeout: 5 },
  'Burst-spike': { delay: 0.1, timeout: 2 },
};

function parseDurationSeconds(d: string): number {
  const match = d.match(/(\d+)\s*([smh]?)/i);
  if (!match) return 30;
  const val = parseInt(match[1], 10);
  const unit = (match[2] || 's').toLowerCase();
  if (unit === 'm') return val * 60;
  if (unit === 'h') return val * 3600;
  return val;
}

function parseTargetUrl(raw: string): { base_url: string; endpoint: string } {
  const fallback = raw && raw.trim() !== '' ? raw : 'http://localhost:8001';
  try {
    const u = new URL(fallback.startsWith('http') ? fallback : `http://${fallback}`);
    return {
      base_url: `${u.protocol}//${u.host}`,
      endpoint: u.pathname && u.pathname !== '' ? u.pathname : '/health',
    };
  } catch {
    return {
      base_url: 'http://localhost:8001',
      endpoint: '/health',
    };
  }
}

export const DdosScreen: React.FC = () => {
  const { pop } = useNavigation();
  const { targetUrl } = useSecuritySession();

  const [step, setStep] = useState<Step>(1);
  const [pattern, setPattern] = useState<AttackPattern>('Flood');
  const [intensity, setIntensity] = useState<Intensity>('Medium');
  const [durationChoice, setDurationChoice] = useState<DurationOption>('30s');
  const [customDuration, setCustomDuration] = useState('');
  const [isEnteringCustom, setIsEnteringCustom] = useState(false);
  const [customError, setCustomError] = useState('');
  const [isAttacking, setIsAttacking] = useState(false);

  const isInteractive = Boolean(process.stdin?.isTTY);

  const effectiveDuration = durationChoice === 'Custom' ? customDuration : durationChoice;

  const handlePatternSelect = (item: { value: AttackPattern }) => {
    setPattern(item.value);
    setStep(2);
  };

  const handleIntensitySelect = (item: { value: Intensity }) => {
    setIntensity(item.value);
    setStep(3);
  };

  const handleDurationSelect = (item: { value: DurationOption }) => {
    if (item.value === 'Custom') {
      setDurationChoice('Custom');
      setIsEnteringCustom(true);
    } else {
      setDurationChoice(item.value);
      setIsEnteringCustom(false);
      setStep(4);
    }
  };

  const handleCustomDurationSubmit = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setCustomError('Custom duration cannot be empty.');
      return;
    }
    setCustomError('');
    setCustomDuration(trimmed);
    setIsEnteringCustom(false);
    setStep(4);
  };

  const handleConfirmSelect = (item: { value: 'confirm' | 'back' }) => {
    if (item.value === 'back') {
      setStep(3);
      return;
    }
    setIsAttacking(true);
  };

  useInput(
    (_input, key) => {
      if (isAttacking) return;
      if (key.escape) {
        if (isEnteringCustom) {
          setIsEnteringCustom(false);
        } else if (step === 4) {
          setStep(3);
        } else if (step === 3) {
          setStep(2);
        } else if (step === 2) {
          setStep(1);
        } else {
          pop();
        }
      }
    },
    { isActive: isInteractive }
  );

  // Construct DDoSConfig matching schema and execute.py
  const { base_url, endpoint } = parseTargetUrl(targetUrl);
  const parsedDuration = parseDurationSeconds(effectiveDuration);
  const concurrencyValue = CONCURRENCY_MAP[intensity] || 10;
  const { delay: delayValue, timeout: timeoutValue } = PATTERN_SETTINGS[pattern] || PATTERN_SETTINGS.Flood;
  const requestCount = Math.max(50, parsedDuration * concurrencyValue * 2);

  const ddosConfig = {
    target: {
      base_url,
      endpoint,
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
      duration: parsedDuration,
      requests: requestCount,
      concurrency: concurrencyValue,
      delay: delayValue,
      timeout: timeoutValue,
      retries: 0,
      on_failure: 'continue',
    },
  };

  return (
    <TerminalLayout
      title="DDoS Traffic Simulation"
      subtitle="Configure distributed traffic load patterns and stress test endpoint limits"
      breadcrumb="SECURITY > DDOS"
      step={step}
      totalSteps={4}
      accentColor="yellow"
      statusText={isAttacking ? 'ATTACK DISPATCHED' : `STEP ${step} OF 4`}
      statusType={isAttacking ? 'warning' : 'ready'}
      keyHints={isAttacking ? 's / esc halt attack' : `↑↓ navigate · enter select · esc ${step === 1 ? 'exit' : 'back'}`}
    >
      {!isAttacking ? (
        <>
          {/* Target Host banner */}
          <Box flexDirection="column" marginY={1} paddingLeft={1}>
            <Text color="gray">
              Target Target: <Text bold color="cyan">{base_url}{endpoint}</Text>
            </Text>
          </Box>

          {/* Step 1: Pattern */}
          {step === 1 && (
            <Box flexDirection="column" marginY={1}>
              <Text bold color="white">
                1. Select Attack Pattern:
              </Text>
              <Box marginTop={1}>
                <Select
                  items={[
                    { label: '1. Flood (High volume continuous HTTP flood traffic, low delay)', value: 'Flood' as AttackPattern },
                    { label: '2. Slowloris-style (Low-and-slow socket and thread pool exhaustion)', value: 'Slowloris-style' as AttackPattern },
                    { label: '3. Burst-spike (Intermittent high-amplitude traffic spikes)', value: 'Burst-spike' as AttackPattern },
                  ]}
                  onSelect={handlePatternSelect}
                  isFocused={isInteractive}
                />
              </Box>
            </Box>
          )}

          {/* Step 2: Intensity */}
          {step === 2 && (
            <Box flexDirection="column" marginY={1}>
              <Text bold color="white">
                2. Select Traffic Intensity:
              </Text>
              <Box marginTop={1}>
                <Select
                  items={[
                    { label: '1. Light (Low concurrency [5 workers] baseline latency probe)', value: 'Light' as Intensity },
                    { label: '2. Medium (Standard concurrency [10 workers] stress test)', value: 'Medium' as Intensity },
                    { label: '3. Heavy (High concurrency [20 workers] capacity stress test)', value: 'Heavy' as Intensity },
                  ]}
                  onSelect={handleIntensitySelect}
                  isFocused={isInteractive}
                />
              </Box>
            </Box>
          )}

          {/* Step 3: Duration */}
          {step === 3 && (
            <Box flexDirection="column" marginY={1}>
              <Text bold color="white">
                3. Select Attack Duration:
              </Text>
              {!isEnteringCustom ? (
                <Box marginTop={1}>
                  <Select
                    items={[
                      { label: '1. 10s (Quick benchmark probe)', value: '10s' as DurationOption },
                      { label: '2. 30s (Standard evaluation window)', value: '30s' as DurationOption },
                      { label: '3. 60s (Extended endurance run)', value: '60s' as DurationOption },
                      { label: '4. Custom (Enter custom duration string)...', value: 'Custom' as DurationOption },
                    ]}
                    onSelect={handleDurationSelect}
                    isFocused={isInteractive}
                  />
                </Box>
              ) : (
                <Box flexDirection="column" marginTop={1}>
                  <Box flexDirection="row">
                    <Box width={24}>
                      <Text color="yellow">› Custom Duration:</Text>
                    </Box>
                    <Box flexGrow={1}>
                      <TextInput
                        value={customDuration}
                        onChange={(val) => {
                          setCustomDuration(val);
                          if (customError) setCustomError('');
                        }}
                        onSubmit={handleCustomDurationSubmit}
                        focus={isInteractive}
                        placeholder="e.g. 15s, 45s, 2m"
                      />
                    </Box>
                  </Box>
                  {customError ? (
                    <Box marginTop={1} paddingLeft={2}>
                      <Text color="red" bold>✗ {customError}</Text>
                    </Box>
                  ) : null}
                </Box>
              )}
            </Box>
          )}

          {/* Step 4: Confirmation */}
          {step === 4 && (
            <Box flexDirection="column" marginY={1}>
              <Text bold color="white">
                4. Review Configuration Summary:
              </Text>
              <Box flexDirection="column" marginY={1} paddingLeft={2}>
                <Text color="gray">
                  • Target URL: <Text color="cyan" bold>{base_url}{endpoint}</Text>
                </Text>
                <Text color="gray">
                  • Attack Pattern: <Text color="yellow" bold>{pattern}</Text>
                </Text>
                <Text color="gray">
                  • Concurrency: <Text color="yellow" bold>{concurrencyValue} workers ({intensity})</Text>
                </Text>
                <Text color="gray">
                  • Duration: <Text color="yellow" bold>{parsedDuration}s</Text>
                </Text>
                <Text color="gray">
                  • Planned Volume: <Text color="white">{requestCount} requests (delay: {delayValue}s)</Text>
                </Text>
              </Box>
              <Box marginTop={1}>
                <Select
                  items={[
                    { label: 'Confirm & Launch DDoS Attack', value: 'confirm' as const },
                    { label: 'Back to edit', value: 'back' as const },
                  ]}
                  onSelect={handleConfirmSelect}
                  isFocused={isInteractive}
                />
              </Box>
            </Box>
          )}
        </>
      ) : (
        <AttackRunner
          attackType="ddos"
          config={ddosConfig}
          onDone={() => pop()}
        />
      )}
    </TerminalLayout>
  );
};

export default DdosScreen;
