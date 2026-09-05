import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { useNavigation } from '../../state/navigation.js';
import { useSecuritySession } from '../../state/securitySession.js';
import { MultiSelect } from '../../components/MultiSelect.js';
import { TerminalLayout } from '../../components/TerminalLayout.js';
import { Select } from '../../components/Select.js';
import { AttackRunner } from '../../components/AttackRunner.js';

type Step = 1 | 2 | 3;
type ExfilVector =
  | 'API response leakage'
  | 'Error message leakage'
  | 'Debug endpoint exposure'
  | 'Header leakage';
type ScanDepth = 'Surface scan' | 'Deep scan';

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

export const ExfilScreen: React.FC = () => {
  const { pop } = useNavigation();
  const { targetUrl } = useSecuritySession();

  const [step, setStep] = useState<Step>(1);
  const [vectors, setVectors] = useState<ExfilVector[]>([
    'API response leakage',
    'Error message leakage',
  ]);
  const [depth, setDepth] = useState<ScanDepth>('Surface scan');
  const [isAttacking, setIsAttacking] = useState(false);

  const isInteractive = Boolean(process.stdin?.isTTY);

  const handleVectorsSubmit = (selected: ExfilVector[]) => {
    setVectors(selected);
    setStep(2);
  };

  const handleDepthSelect = (item: { value: ScanDepth }) => {
    setDepth(item.value);
    setStep(3);
  };

  const handleConfirmSelect = (item: { value: 'confirm' | 'back' }) => {
    if (item.value === 'back') {
      setStep(2);
      return;
    }
    setIsAttacking(true);
  };

  useInput(
    (_input, key) => {
      if (isAttacking) return;
      if (key.escape) {
        if (step === 3) {
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

  // Construct data-burning configuration
  const { base_url, endpoint } = parseTargetUrl(targetUrl);
  const isDeep = depth === 'Deep scan';

  const dataBurningConfig = {
    target: {
      base_url,
      endpoint,
      method: 'GET',
      path_params: null,
      query_params: null,
    },
    request: {
      headers: {
        'X-ThreatLens-Vectors': vectors.join(','),
        'X-Scan-Depth': depth,
      },
      auth: null,
      body: null,
    },
    attack: {
      duration: isDeep ? 20 : 10,
      requests: isDeep ? 40 : 20,
      concurrency: isDeep ? 10 : 5,
      delay: 0.1,
      timeout: 5,
      retries: 0,
      on_failure: 'continue',
    },
  };

  return (
    <TerminalLayout
      title="Data Exfiltration & Leakage Assessment"
      subtitle="Detect inadvertent sensitive disclosures, stack traces, and debug interfaces"
      breadcrumb="SECURITY > EXFIL"
      step={step}
      totalSteps={3}
      accentColor="yellow"
      statusText={isAttacking ? 'DATA-BURNING RUNNING' : `STEP ${step} OF 3`}
      statusType={isAttacking ? 'warning' : 'ready'}
      keyHints={
        isAttacking
          ? 's / esc halt attack'
          : step === 1
          ? 'space toggle · enter confirm · esc exit'
          : `↑↓ navigate · enter select · esc back`
      }
    >
      {!isAttacking ? (
        <>
          {/* Target Host banner */}
          <Box flexDirection="column" marginY={1} paddingLeft={1}>
            <Text color="gray">
              Target Endpoint: <Text bold color="cyan">{base_url}{endpoint}</Text>
            </Text>
          </Box>

          {/* Step 1: Vectors MultiSelect */}
          {step === 1 && (
            <Box flexDirection="column" marginY={1}>
              <Text bold color="white">
                1. Select Exfiltration & Leakage Vectors:
              </Text>
              <Box marginTop={1}>
                <MultiSelect<ExfilVector>
                  items={[
                    { label: 'API response leakage (PII, tokens, and keys in JSON payloads)', value: 'API response leakage' },
                    { label: 'Error message leakage (Verbose stack traces & unhandled exceptions)', value: 'Error message leakage' },
                    { label: 'Debug endpoint exposure (/actuator, /debug, /metrics, /env)', value: 'Debug endpoint exposure' },
                    { label: 'Header leakage (Server, X-Powered-By, internal hostname headers)', value: 'Header leakage' },
                  ]}
                  initialSelected={vectors}
                  onSubmit={handleVectorsSubmit}
                  isFocused={isInteractive}
                  minSelected={1}
                />
              </Box>
            </Box>
          )}

          {/* Step 2: Scan Depth Select */}
          {step === 2 && (
            <Box flexDirection="column" marginY={1}>
              <Text bold color="white">
                2. Select Scan Depth:
              </Text>
              <Box marginTop={1}>
                <Select
                  items={[
                    { label: '1. Surface scan (Fast reconnaissance across exposed public endpoints - 10s)', value: 'Surface scan' as ScanDepth },
                    { label: '2. Deep scan (Recursive route discovery & active parameter testing - 20s)', value: 'Deep scan' as ScanDepth },
                  ]}
                  onSelect={handleDepthSelect}
                  isFocused={isInteractive}
                />
              </Box>
            </Box>
          )}

          {/* Step 3: Confirmation Screen */}
          {step === 3 && (
            <Box flexDirection="column" marginY={1}>
              <Text bold color="white">
                3. Review Configuration Summary:
              </Text>
              <Box flexDirection="column" marginY={1} paddingLeft={2}>
                <Text color="gray">
                  • Target URL: <Text color="cyan" bold>{base_url}{endpoint}</Text>
                </Text>
                <Text color="gray">
                  • Exfiltration Vectors: <Text color="yellow" bold>{vectors.join(', ')}</Text>
                </Text>
                <Text color="gray">
                  • Scan Depth: <Text color="yellow" bold>{depth}</Text>
                </Text>
                <Text color="gray">
                  • Concurrency: <Text color="white">{dataBurningConfig.attack.concurrency} workers</Text>
                </Text>
              </Box>
              <Box marginTop={1}>
                <Select
                  items={[
                    { label: 'Confirm & Launch Data Burning Assessment', value: 'confirm' as const },
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
          attackType="data-burning"
          config={dataBurningConfig}
          onDone={() => pop()}
        />
      )}
    </TerminalLayout>
  );
};

export default ExfilScreen;
