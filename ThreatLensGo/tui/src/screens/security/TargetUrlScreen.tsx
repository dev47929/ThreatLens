import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { useNavigation } from '../../state/navigation.js';
import { useSecuritySession, AttackTargetConfig, AttackRequestConfig } from '../../state/securitySession.js';
import { TerminalLayout } from '../../components/TerminalLayout.js';
import { Select } from '../../components/Select.js';
import { TargetRequestEditor } from '../../components/TargetRequestEditor.js';

interface PresetItem {
  label: string;
  value: string;
  target?: AttackTargetConfig;
  request?: AttackRequestConfig;
}

const PRESET_OPTIONS: PresetItem[] = [
  {
    label: '1. Port 8000 — ThreatLens Auth Pulse (http://localhost:8000/tc-auth/config/pulse [GET])',
    value: 'tl_pulse',
    target: {
      base_url: 'http://localhost:8000',
      endpoint: '/tc-auth/config/pulse',
      method: 'GET',
      path_params: null,
      query_params: null,
    },
    request: {
      headers: null,
      auth: null,
      body: null,
    },
  },
  {
    label: '2. Port 8001 — Healthy Secure API Reference (http://localhost:8001/health [GET])',
    value: 'port_8001',
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
  },
  {
    label: '3. Port 8003 — Vulnerable Fintech API (http://localhost:8003/api/auth/login [POST])',
    value: 'port_8003',
    target: {
      base_url: 'http://localhost:8003',
      endpoint: '/api/auth/login',
      method: 'POST',
      path_params: null,
      query_params: null,
    },
    request: {
      headers: { 'Content-Type': 'application/json' },
      auth: null,
      body: { username: 'admin', password: 'password123' },
    },
  },
  {
    label: '4. Port 8004 — Vulnerable Social Node (http://localhost:8004/api/feed/search [GET])',
    value: 'port_8004',
    target: {
      base_url: 'http://localhost:8004',
      endpoint: '/api/feed/search',
      method: 'GET',
      path_params: null,
      query_params: { q: 'security' },
    },
    request: {
      headers: null,
      auth: null,
      body: null,
    },
  },
  {
    label: '5. Port 8005 — Vulnerable Hospital Node (http://localhost:8005/api/patients/1 [GET])',
    value: 'port_8005',
    target: {
      base_url: 'http://localhost:8005',
      endpoint: '/api/patients/1',
      method: 'GET',
      path_params: null,
      query_params: null,
    },
    request: {
      headers: null,
      auth: null,
      body: null,
    },
  },
  {
    label: '6. ⚙️ Customize Target & Request (Base URL, Endpoint, Method, Headers, Auth, Body)...',
    value: 'custom',
  },
];

export const TargetUrlScreen: React.FC = () => {
  const { pop, replace, canGoBack } = useNavigation();
  const { targetConfig, requestConfig, setTargetAndRequest } = useSecuritySession();

  const [mode, setMode] = useState<'preset' | 'editor'>('preset');

  const isInteractive = Boolean(process.stdin?.isTTY);

  const handlePresetSelect = (item: PresetItem) => {
    if (item.value === 'custom') {
      setMode('editor');
      return;
    }

    if (item.target && item.request) {
      setTargetAndRequest(item.target, item.request);
      if (canGoBack) {
        pop();
      } else {
        replace({ type: 'securityMenu' });
      }
    }
  };

  const handleEditorSave = (newTarget: AttackTargetConfig, newRequest: AttackRequestConfig) => {
    setTargetAndRequest(newTarget, newRequest);
    if (canGoBack) {
      pop();
    } else {
      replace({ type: 'securityMenu' });
    }
  };

  useInput(
    (_input, key) => {
      if (key.escape) {
        if (mode === 'editor') {
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
      title="Target & Request Configuration"
      subtitle="Select a target preset or customize endpoint, HTTP method, headers, auth & body"
      breadcrumb="SECURITY > TARGET CONFIG"
      accentColor="yellow"
      statusText={mode === 'editor' ? 'CUSTOM CONFIGURATION' : 'AWAITING SELECTION'}
      statusType="ready"
      keyHints={mode === 'preset' ? '↑↓ choose preset · enter select · esc back' : 'enter select/confirm · esc cancel'}
    >
      <Box flexDirection="column" marginY={1}>
        {/* Active Target Banner */}
        <Box
          borderStyle="single"
          borderColor="gray"
          paddingX={1}
          marginBottom={1}
          flexDirection="column"
        >
          <Text color="gray">
            Current Session Target:{' '}
            <Text bold color="yellow">[{targetConfig.method}]</Text>{' '}
            <Text bold color="cyan">{targetConfig.base_url}{targetConfig.endpoint}</Text>
          </Text>
          <Text color="gray" dimColor>
            Headers: {targetConfig.query_params ? JSON.stringify(targetConfig.query_params) : 'none'} · Auth: {requestConfig.auth ? 'configured' : 'none'}
          </Text>
        </Box>

        {mode === 'preset' ? (
          <Box flexDirection="column">
            <Text bold color="white">
              Select Active Target Endpoint Preset:
            </Text>
            <Box marginTop={1}>
              <Select items={PRESET_OPTIONS} onSelect={handlePresetSelect} isFocused={isInteractive} />
            </Box>
          </Box>
        ) : (
          <TargetRequestEditor
            initialTarget={targetConfig}
            initialRequest={requestConfig}
            onSave={handleEditorSave}
            onCancel={() => setMode('preset')}
            title="Custom Target & Request Configuration"
          />
        )}
      </Box>
    </TerminalLayout>
  );
};

export default TargetUrlScreen;

