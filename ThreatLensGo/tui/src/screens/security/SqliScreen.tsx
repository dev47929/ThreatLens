import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { useNavigation } from '../../state/navigation.js';
import { useSecuritySession } from '../../state/securitySession.js';
import { MultiSelect, MultiSelectItem } from '../../components/MultiSelect.js';
import { TerminalLayout } from '../../components/TerminalLayout.js';
import { Select } from '../../components/Select.js';
import { Spinner } from '../../components/Spinner.js';
import { AttackRunner } from '../../components/AttackRunner.js';
import { backendClient } from '../../api/backendClient.js';
import { formatBackendError } from '../../api/errorHandler.js';

type Step = 1 | 2 | 3 | 4;
type HttpMethod = 'POST' | 'GET';

function parseTargetUrl(raw: string, defaultEndpoint: string): { base_url: string; endpoint: string } {
  const fallback = raw && raw.trim() !== '' ? raw : 'http://localhost:8001';
  try {
    const u = new URL(fallback.startsWith('http') ? fallback : `http://${fallback}`);
    return {
      base_url: `${u.protocol}//${u.host}`,
      endpoint: u.pathname && u.pathname !== '/' ? u.pathname : defaultEndpoint,
    };
  } catch {
    return {
      base_url: 'http://localhost:8001',
      endpoint: defaultEndpoint,
    };
  }
}

export const SqliScreen: React.FC = () => {
  const { pop } = useNavigation();
  const { targetUrl } = useSecuritySession();

  const [step, setStep] = useState<Step>(1);
  const [method, setMethod] = useState<HttpMethod>('POST');
  const [endpointInput, setEndpointInput] = useState<string>('');
  const [isEditingEndpoint, setIsEditingEndpoint] = useState<boolean>(false);

  // Parameter Configuration State
  const [paramInput, setParamInput] = useState<string>('username, password');
  const [paramError, setParamError] = useState<string>('');

  // Case Management State
  const [casesLoading, setCasesLoading] = useState(false);
  const [casesError, setCasesError] = useState('');
  const [casesDict, setCasesDict] = useState<Record<string, any>>({});
  const [caseItems, setCaseItems] = useState<MultiSelectItem[]>([]);
  const [selectedCaseNames, setSelectedCaseNames] = useState<string[]>([]);

  // Execution State
  const [isAttacking, setIsAttacking] = useState(false);

  const isInteractive = Boolean(process.stdin?.isTTY);

  // Derive initial target & endpoint
  const defaultEndpoint = method === 'POST' ? '/api/auth/login' : '/api/products/search';
  const parsedTarget = parseTargetUrl(targetUrl, defaultEndpoint);
  const effectiveEndpoint = endpointInput.trim() || parsedTarget.endpoint;

  const loadCases = useCallback(async () => {
    setCasesLoading(true);
    setCasesError('');
    try {
      const data = await backendClient.getAttackCases('sqli');
      if (data && typeof data === 'object') {
        setCasesDict(data);
        const keys = Object.keys(data);
        const items = keys.map((k) => ({
          label: `${k} ${data[k]?.description ? `(${data[k].description})` : ''}`,
          value: k,
        }));
        setCaseItems(items);
        const initial = keys.filter((k) => data[k]?.enabled !== false);
        setSelectedCaseNames(initial.length > 0 ? initial : keys);
      } else {
        throw new Error('Invalid test cases structure received from backend.');
      }
    } catch (err: any) {
      setCasesError(formatBackendError(err));
    } finally {
      setCasesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (step === 3) {
      loadCases();
    }
  }, [step, loadCases]);

  // Step 1: Method selection
  const handleMethodSelect = (item: { value: HttpMethod }) => {
    setMethod(item.value);
    if (item.value === 'POST') {
      setParamInput('username, password');
      if (!endpointInput) setEndpointInput('/api/auth/login');
    } else {
      setParamInput('id');
      if (!endpointInput) setEndpointInput('/api/products/search');
    }
    setStep(2);
  };

  // Step 2: Parameter configuration
  const handleParamSubmit = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setParamError('Please enter at least one parameter name to test.');
      return;
    }
    setParamError('');
    setParamInput(trimmed);
    setStep(3);
  };

  // Step 3: Test cases selection
  const handleCasesSubmit = async (selected: string[]) => {
    if (selected.length === 0) {
      setCasesError('Select at least one test case.');
      return;
    }
    setCasesError('');
    setSelectedCaseNames(selected);

    // Sync enabled state to backend
    const patchPayload = Object.keys(casesDict).map((caseName) => ({
      case: caseName,
      enabled: selected.includes(caseName),
    }));

    try {
      await backendClient.patchAttackCases('sqli', patchPayload);
    } catch (err: any) {
      console.warn('Non-blocking: Failed to update SQLi cases on backend:', err.message);
    }

    setStep(4);
  };

  // Step 4: Final Confirmation
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
        if (isEditingEndpoint) {
          setIsEditingEndpoint(false);
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

  // Build target body or query parameters
  const paramList = paramInput
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

  const queryParams: Record<string, string> = {};
  const bodyParams: Record<string, string> = {};

  if (method === 'GET') {
    paramList.forEach((p) => {
      queryParams[p] = 'test';
    });
  } else {
    paramList.forEach((p) => {
      bodyParams[p] = 'test';
    });
  }

  const sqliConfig = {
    target: {
      base_url: parsedTarget.base_url,
      endpoint: effectiveEndpoint,
      method,
      query_params: queryParams,
      path_params: {},
    },
    request: {
      headers: method === 'POST' ? { 'Content-Type': 'application/json' } : {},
      body: method === 'POST' ? bodyParams : {},
      auth: null,
    },
    attack: {
      requests_per_case: 1,
      delay: 0.1,
      timeout: 5,
      on_failure: 'continue',
    },
  };

  return (
    <TerminalLayout
      title="SQL Injection Assessment"
      subtitle="Probe database boundaries, error heuristics, and query structure vulnerabilities"
      breadcrumb="SECURITY > SQLI"
      step={step}
      totalSteps={4}
      accentColor="yellow"
      statusText={isAttacking ? 'SQLI ATTACK RUNNING' : `STEP ${step} OF 4`}
      statusType={isAttacking ? 'warning' : 'ready'}
      keyHints={
        isAttacking
          ? 's / esc halt attack'
          : step === 3
          ? 'space toggle · enter confirm · esc back'
          : `enter select/submit · esc ${step === 1 ? 'exit' : 'back'}`
      }
    >
      {!isAttacking ? (
        <>
          {/* Step 1: Target Endpoint & Method Selection */}
          {step === 1 && (
            <Box flexDirection="column" marginY={1}>
              <Box flexDirection="column" marginBottom={1} paddingLeft={1}>
                <Text color="gray">
                  Target Host: <Text bold color="cyan">{parsedTarget.base_url}</Text>
                </Text>
                <Text color="gray">
                  Target Endpoint: <Text bold color="yellow">{effectiveEndpoint}</Text>
                </Text>
              </Box>

              <Text bold color="white">
                1. Select Target HTTP Method:
              </Text>
              <Box marginY={1}>
                <Select
                  items={[
                    {
                      label: '1. POST — Form/JSON Body Injection (e.g. login username/password fields)',
                      value: 'POST' as HttpMethod,
                    },
                    {
                      label: '2. GET — Query Parameter Injection (e.g. search, filter, or id URL params)',
                      value: 'GET' as HttpMethod,
                    },
                  ]}
                  onSelect={handleMethodSelect}
                  isFocused={isInteractive}
                />
              </Box>
            </Box>
          )}

          {/* Step 2: Parameter Names Input */}
          {step === 2 && (
            <Box flexDirection="column" marginY={1}>
              <Text bold color="white">
                2. Specify Injection Target Parameter(s):
              </Text>
              <Box marginY={1} paddingLeft={1}>
                <Text color="gray">
                  {method === 'POST'
                    ? 'Enter JSON body parameter keys to inject into (comma-separated, e.g. username, password):'
                    : 'Enter query parameter key(s) to test (comma-separated, e.g. id, q, search):'}
                </Text>
              </Box>

              <Box flexDirection="row" marginY={1}>
                <Box width={22}>
                  <Text bold color="yellow">
                    › Parameters:
                  </Text>
                </Box>
                <Box flexGrow={1}>
                  <TextInput
                    value={paramInput}
                    onChange={(val) => {
                      setParamInput(val);
                      if (paramError) setParamError('');
                    }}
                    onSubmit={handleParamSubmit}
                    focus={isInteractive}
                    placeholder={method === 'POST' ? 'username, password' : 'id'}
                  />
                </Box>
              </Box>

              {paramError ? (
                <Box marginTop={1} paddingLeft={2}>
                  <Text color="red" bold>
                    ✗ {paramError}
                  </Text>
                </Box>
              ) : null}

              <Box marginTop={1} paddingLeft={1}>
                <Text color="gray" dimColor>
                  Press <Text bold color="white">[Enter]</Text> to confirm parameters and load test cases.
                </Text>
              </Box>
            </Box>
          )}

          {/* Step 3: Test Case Selection (Loaded from Backend) */}
          {step === 3 && (
            <Box flexDirection="column" marginY={1}>
              <Text bold color="white">
                3. Select SQLi Attack Vectors & Test Cases:
              </Text>

              {casesLoading ? (
                <Box flexDirection="row" alignItems="center" marginY={1}>
                  <Box marginRight={1}>
                    <Spinner type="dots" color="#38BDF8" />
                  </Box>
                  <Text color="gray">Loading attack test cases from backend...</Text>
                </Box>
              ) : casesError ? (
                <Box flexDirection="column" marginY={1}>
                  <Text color="red" bold>
                    ✗ {casesError}
                  </Text>
                  <Box marginTop={1}>
                    <Select
                      items={[
                        { label: '1. Run with default cases', value: 'default' as const },
                        { label: '2. Go back to parameters', value: 'back' as const },
                      ]}
                      onSelect={(item) => {
                        if (item.value === 'default') {
                          setStep(4);
                        } else {
                          setStep(2);
                        }
                      }}
                      isFocused={isInteractive}
                    />
                  </Box>
                </Box>
              ) : caseItems.length > 0 ? (
                <Box flexDirection="column" marginTop={1}>
                  <MultiSelect
                    items={caseItems}
                    initialSelected={selectedCaseNames}
                    minSelected={1}
                    onSubmit={handleCasesSubmit}
                    isFocused={isInteractive}
                  />
                </Box>
              ) : (
                <Box marginY={1}>
                  <Text color="yellow">No cases returned by backend.</Text>
                </Box>
              )}
            </Box>
          )}

          {/* Step 4: Review & Confirmation */}
          {step === 4 && (
            <Box flexDirection="column" marginY={1}>
              <Text bold color="white">
                4. Review SQLi Configuration Summary:
              </Text>
              <Box flexDirection="column" marginY={1} paddingLeft={2}>
                <Text color="gray">
                  • Target URL: <Text color="cyan" bold>{sqliConfig.target.base_url}{sqliConfig.target.endpoint}</Text>
                </Text>
                <Text color="gray">
                  • Method: <Text color="yellow" bold>{sqliConfig.target.method}</Text>
                </Text>
                <Text color="gray">
                  • Injected Parameters: <Text color="yellow" bold>{paramList.join(', ')}</Text>
                </Text>
                <Text color="gray">
                  • Active Test Cases: <Text color="yellow" bold>{selectedCaseNames.length} selected</Text>
                </Text>
                <Text color="gray">
                  • Request Timeout: <Text color="white">5s (delay: 0.1s)</Text>
                </Text>
              </Box>

              <Box marginTop={1}>
                <Select
                  items={[
                    { label: 'Confirm & Launch SQL Injection Assessment', value: 'confirm' as const },
                    { label: 'Back to edit cases', value: 'back' as const },
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
          attackType="sqli"
          config={sqliConfig}
          onDone={() => pop()}
        />
      )}
    </TerminalLayout>
  );
};

export default SqliScreen;
