import React, { useState, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { useNavigation } from '../state/navigation.js';
import { useSecuritySession } from '../state/securitySession.js';
import { TerminalLayout } from '../components/TerminalLayout.js';
import { AttackRunner } from '../components/AttackRunner.js';
import type { AttackStatus } from '../api/types.js';

function parseTargetUrl(raw: string): { base_url: string; endpoint: string } {
  const fallback = raw && raw.trim() !== '' ? raw : 'http://localhost:8001/health';
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

export const RateLimitScreen: React.FC = () => {
  const { pop } = useNavigation();
  const { targetConfig, requestConfig } = useSecuritySession();

  const [step, setStep] = useState<'config' | 'running' | 'done'>('config');
  const [urlInput, setUrlInput] = useState(`${targetConfig.base_url}${targetConfig.endpoint}`);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attackResult, setAttackResult] = useState<AttackStatus | null>(null);

  const isInteractive = Boolean(process.stdin?.isTTY);
  const parsed = parseTargetUrl(urlInput);

  // Light intensity DDoS configuration tailored for Rate Limiting / 429 testing
  const rateLimitConfig = {
    target: {
      base_url: parsed.base_url,
      endpoint: parsed.endpoint,
      method: targetConfig.method || 'GET',
      path_params: targetConfig.path_params,
      query_params: targetConfig.query_params,
    },
    request: {
      headers: requestConfig.headers,
      auth: requestConfig.auth,
      body: requestConfig.body,
    },
    attack: {
      duration: 5,
      requests: 30,
      concurrency: 5, // Light intensity = 5 concurrent workers
      delay: 0.05,
      timeout: 2,
      retries: 0,
      on_failure: 'continue',
    },
  };

  const handleStart = useCallback(() => {
    if (!urlInput.trim()) {
      setErrorMessage('Target URL cannot be empty.');
      return;
    }
    setErrorMessage(null);
    setAttackResult(null);
    setStep('running');
  }, [urlInput]);

  const handleDone = useCallback((result: AttackStatus) => {
    setAttackResult(result);
    setStep('done');
  }, []);

  const handleError = useCallback((err: string) => {
    setErrorMessage(err);
    setStep('done');
  }, []);

  useInput(
    (_input, key) => {
      if (key.escape) {
        if (step === 'done') {
          setStep('config');
        } else if (step === 'config') {
          pop();
        }
      } else if (key.return && step === 'done') {
        setStep('config');
      }
    },
    { isActive: isInteractive && step !== 'running' }
  );

  const totalAttempted = attackResult?.progress?.attempted_requests ?? attackResult?.requests?.successful ?? 30;
  const successful = attackResult?.requests?.successful ?? 0;
  const rateLimited429 = attackResult?.status_codes?.['429'] ?? 0;
  const failed = attackResult?.requests?.failed ?? 0;
  const avgLatency = attackResult?.performance?.average_latency_ms ?? 0;

  return (
    <TerminalLayout
      title="Rate Limiting Assessment"
      subtitle="Verify endpoint throttling thresholds, burst capacities, and 429 response enforcement"
      breadcrumb="SECURITY > RATE LIMIT"
      accentColor="yellow"
      statusText={
        step === 'running'
          ? 'EVALUATING 429 POLICIES'
          : step === 'done'
          ? 'ASSESSMENT COMPLETE'
          : 'CONFIGURE RATE TEST'
      }
      statusType={step === 'running' ? 'warning' : step === 'done' ? 'success' : 'ready'}
      keyHints={
        step === 'running'
          ? 's stop · esc abort'
          : step === 'done'
          ? 'enter / esc re-test or back'
          : 'enter start assessment · esc back'
      }
    >
      {step === 'config' && (
        <Box flexDirection="column" marginY={1}>
          <Box flexDirection="row" marginY={1}>
            <Box width={26}>
              <Text bold color="yellow">
                › Target Endpoint:
              </Text>
            </Box>
            <Box flexGrow={1}>
              <TextInput
                value={urlInput}
                onChange={(val) => {
                  setUrlInput(val);
                  if (errorMessage) setErrorMessage(null);
                }}
                onSubmit={handleStart}
                focus={isInteractive}
                placeholder="http://localhost:8001/health"
              />
            </Box>
          </Box>

          <Box flexDirection="column" marginY={1} paddingLeft={2}>
            <Text color="gray">
              • Engine: <Text color="white" bold>DDoS Rapid Burst (5 concurrent workers)</Text>
            </Text>
            <Text color="gray">
              • Burst Volume: <Text color="white">30 requests over 5 seconds</Text>
            </Text>
            <Text color="gray">
              • Objective: <Text color="cyan">Trigger & verify HTTP 429 (Too Many Requests) throttling</Text>
            </Text>
          </Box>

          {errorMessage && (
            <Box marginTop={1} paddingLeft={2}>
              <Text color="red" bold>
                ✗ {errorMessage}
              </Text>
            </Box>
          )}

          <Box marginTop={1}>
            <Text color="gray" dimColor>
              Press <Text bold color="white">[Enter]</Text> to launch rate-limit stress test.
            </Text>
          </Box>
        </Box>
      )}

      {step === 'running' && (
        <Box flexDirection="column" marginY={1}>
          <AttackRunner
            attackType="ddos"
            config={rateLimitConfig}
            onDone={handleDone}
            onError={handleError}
          />
        </Box>
      )}

      {step === 'done' && (
        <Box flexDirection="column" marginY={1} paddingLeft={1}>
          {attackResult ? (
            <Box flexDirection="column">
              <Box flexDirection="row" alignItems="center" marginBottom={1}>
                <Text color="green" bold>✓ </Text>
                <Text bold color="green">
                  Assessment Completed Successfully ({attackResult.status || 'finished'})
                </Text>
              </Box>

              <Box flexDirection="column" paddingLeft={2} marginY={1}>
                <Text color="gray">
                  • Target: <Text color="cyan">{urlInput}</Text>
                </Text>
                <Text color="gray">
                  • Total Requests Attempted: <Text color="white" bold>{totalAttempted}</Text>
                </Text>
                <Text color="gray">
                  • Successful Responses: <Text color="green" bold>{successful}</Text>
                </Text>
                <Text color="gray">
                  • Rate-Limited (429): <Text color="yellow" bold>{rateLimited429}</Text>
                </Text>
                <Text color="gray">
                  • Other Failed/Errors: <Text color={failed > 0 ? 'red' : 'gray'} bold>{failed}</Text>
                </Text>
                <Text color="gray">
                  • Average Latency: <Text color="white">{avgLatency.toFixed(1)} ms</Text>
                </Text>
              </Box>

              <Box marginTop={1} paddingLeft={2}>
                {rateLimited429 > 0 ? (
                  <Text color="green" bold>
                    🛡 Rate Limit Enforced: Endpoint throttled excess traffic and triggered protective 429 thresholds.
                  </Text>
                ) : (
                  <Text color="yellow">
                    ⚠ Notice: No 429 throttling observed at 5 concurrent bursts. Check endpoint throttling configuration.
                  </Text>
                )}
              </Box>
            </Box>
          ) : (
            <Box flexDirection="column">
              <Text color="red" bold>
                ✗ {errorMessage || 'Rate limiting assessment encountered an error.'}
              </Text>
            </Box>
          )}

          <Box marginTop={2}>
            <Text color="gray" dimColor>
              Press <Text bold color="white">[Enter]</Text> or <Text bold color="white">[Esc]</Text> to reconfigure.
            </Text>
          </Box>
        </Box>
      )}
    </TerminalLayout>
  );
};

export default RateLimitScreen;
