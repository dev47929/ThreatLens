import React, { useState, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { useNavigation } from '../../state/navigation.js';
import { useSecuritySession } from '../../state/securitySession.js';
import { TerminalLayout } from '../../components/TerminalLayout.js';
import { Select } from '../../components/Select.js';

// Regex allowing localhost, domain names, IPv4, IPv6, and ports
const URL_REGEX = /^https?:\/\/([a-zA-Z0-9-._]+|\[[0-9a-fA-F:]+\])(:\d+)?(\/.*)?$/i;

interface PresetOption {
  label: string;
  value: string;
}

const PRESETS: PresetOption[] = [
  { label: '1. Port 8001 — Healthy Secure API (FastAPI Reference)', value: 'http://localhost:8001' },
  { label: '2. Port 8003 — Vulnerable Fintech API (SSRF, Auth & Balance)', value: 'http://localhost:8003' },
  { label: '3. Port 8004 — Vulnerable Social Node (XSS, JWT & Posts)', value: 'http://localhost:8004' },
  { label: '4. Port 8005 — Vulnerable Hospital Node (IDOR & Uploads)', value: 'http://localhost:8005' },
  { label: '5. Custom Target URL (Enter custom IP / Host / Port)...', value: 'custom' },
];

export const TargetUrlScreen: React.FC = () => {
  const { pop, replace } = useNavigation();
  const { targetUrl: existingUrl, setTargetUrl } = useSecuritySession();

  const [mode, setMode] = useState<'preset' | 'custom'>(existingUrl ? 'custom' : 'preset');
  const [urlInput, setUrlInput] = useState(existingUrl || 'http://localhost:8001');
  const [error, setError] = useState('');

  const isInteractive = Boolean(process.stdin?.isTTY);

  const applyUrl = useCallback(
    (url: string) => {
      const trimmed = url.trim();
      if (!trimmed) {
        setError('Target URL cannot be empty.');
        return;
      }
      if (!URL_REGEX.test(trimmed)) {
        setError('Invalid URL. Must include protocol (e.g. http://localhost:8001 or https://example.com)');
        return;
      }
      setError('');
      setTargetUrl(trimmed);
      replace({ type: 'securityMenu' });
    },
    [setTargetUrl, replace]
  );

  const handlePresetSelect = (item: PresetOption) => {
    if (item.value === 'custom') {
      setMode('custom');
    } else {
      applyUrl(item.value);
    }
  };

  const handleSubmit = useCallback(
    (value: string) => {
      applyUrl(value);
    },
    [applyUrl]
  );

  useInput(
    (_input, key) => {
      if (key.escape) {
        if (mode === 'custom' && !existingUrl) {
          setMode('preset');
        } else {
          pop();
        }
      }
    },
    { isActive: isInteractive }
  );

  return (
    <TerminalLayout
      title="Target Endpoint Configuration"
      subtitle="Select a dummy test backend or specify a custom root target URL"
      breadcrumb="SECURITY > TARGET CONFIG"
      accentColor="yellow"
      statusText={error ? 'INVALID TARGET URL' : 'AWAITING TARGET'}
      statusType={error ? 'error' : 'ready'}
      keyHints={mode === 'preset' ? '↑↓ choose preset · enter select · esc back' : 'enter confirm · esc back'}
    >
      <Box flexDirection="column" marginY={1}>
        {mode === 'preset' ? (
          <Box flexDirection="column">
            <Text bold color="white">
              Select Active Target Endpoint:
            </Text>
            <Box marginTop={1}>
              <Select items={PRESETS} onSelect={handlePresetSelect} isFocused={isInteractive} />
            </Box>
          </Box>
        ) : (
          <Box flexDirection="column">
            <Box flexDirection="row" marginY={1}>
              <Box width={20}>
                <Text bold color="yellow">
                  › Target URL:
                </Text>
              </Box>
              <Box flexGrow={1}>
                <TextInput
                  value={urlInput}
                  onChange={(val) => {
                    setUrlInput(val);
                    if (error) setError('');
                  }}
                  onSubmit={handleSubmit}
                  focus={isInteractive}
                  placeholder="http://localhost:8001"
                />
              </Box>
            </Box>

            {error ? (
              <Box marginTop={1} paddingLeft={2}>
                <Text color="red" bold>
                  ✗ {error}
                </Text>
              </Box>
            ) : null}

            <Box marginTop={1}>
              <Text color="gray" dimColor>
                Press <Text bold color="white">[Esc]</Text> to view preset targets list.
              </Text>
            </Box>
          </Box>
        )}
      </Box>
    </TerminalLayout>
  );
};

export default TargetUrlScreen;
