import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { Select } from './Select.js';
import { useTheme } from '../state/themeContext.js';
import type { AttackTargetConfig, AttackRequestConfig } from '../state/securitySession.js';

export interface TargetRequestEditorProps {
  initialTarget: AttackTargetConfig;
  initialRequest: AttackRequestConfig;
  onSave: (target: AttackTargetConfig, request: AttackRequestConfig) => void;
  onCancel: () => void;
  title?: string;
}

type EditorField =
  | 'menu'
  | 'base_url'
  | 'endpoint'
  | 'method'
  | 'query_params'
  | 'path_params'
  | 'headers'
  | 'auth'
  | 'body'
  | 'presets';

const HTTP_METHODS = [
  { label: 'GET (Retrieve resource / ping probe)', value: 'GET' },
  { label: 'POST (Submit payload / mutate state)', value: 'POST' },
  { label: 'PUT (Replace resource)', value: 'PUT' },
  { label: 'DELETE (Remove resource)', value: 'DELETE' },
  { label: 'PATCH (Partial resource update)', value: 'PATCH' },
  { label: 'HEAD (Fetch headers only)', value: 'HEAD' },
  { label: 'OPTIONS (Probe CORS / allowed methods)', value: 'OPTIONS' },
];

const PRESET_CONFIGS: Array<{
  label: string;
  value: string;
  target: AttackTargetConfig;
  request: AttackRequestConfig;
}> = [
  {
    label: '1. ThreatLens Auth / Pulse (http://localhost:8000/tc-auth/config/pulse [GET])',
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
    label: '2. Port 8001 — Healthy Reference API (http://localhost:8001/health [GET])',
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
    label: '3. Port 8003 — Fintech Auth Login (http://localhost:8003/api/auth/login [POST])',
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
    label: '4. Port 8004 — Social Feed Search (http://localhost:8004/api/feed/search [GET])',
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
    label: '5. Port 8005 — Hospital Patient Records (http://localhost:8005/api/patients/1 [GET])',
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
];

function stringifyVal(val: any): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') {
    return JSON.stringify(val);
  }
  return String(val);
}

function parseJsonOrString(raw: string): any {
  const trimmed = raw.trim();
  if (!trimmed || trimmed === 'null') return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return trimmed;
  }
}

function parseKeyValueOrJson(raw: string): Record<string, any> | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed === 'null') return null;
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      // fallback to key value parser
    }
  }

  // Parse key=val&k2=v2 or Header: Val, H2: V2
  const result: Record<string, any> = {};
  if (trimmed.includes('&') || trimmed.includes('=')) {
    const pairs = trimmed.split('&');
    for (const pair of pairs) {
      const [k, ...v] = pair.split('=');
      if (k && k.trim()) {
        result[k.trim()] = v.join('=').trim();
      }
    }
    return Object.keys(result).length > 0 ? result : null;
  }

  if (trimmed.includes(':')) {
    const lines = trimmed.split(/[\n,]/);
    for (const line of lines) {
      const [k, ...v] = line.split(':');
      if (k && k.trim()) {
        result[k.trim()] = v.join(':').trim();
      }
    }
    return Object.keys(result).length > 0 ? result : null;
  }

  return { value: trimmed };
}

export const TargetRequestEditor: React.FC<TargetRequestEditorProps> = ({
  initialTarget,
  initialRequest,
  onSave,
  onCancel,
  title = 'Configure Target & Request Parameters',
}) => {
  const { theme } = useTheme();

  const [target, setTarget] = useState<AttackTargetConfig>({ ...initialTarget });
  const [request, setRequest] = useState<AttackRequestConfig>({ ...initialRequest });

  const [activeField, setActiveField] = useState<EditorField>('menu');
  const [fieldInput, setFieldInput] = useState<string>('');
  const [fieldError, setFieldError] = useState<string>('');

  const isInteractive = Boolean(process.stdin?.isTTY);

  const startEditField = (field: EditorField, currentVal: any) => {
    setFieldError('');
    setActiveField(field);
    setFieldInput(stringifyVal(currentVal));
  };

  const handleInputSubmit = (val: string) => {
    const trimmed = val.trim();

    if (activeField === 'base_url') {
      if (!trimmed) {
        setFieldError('Base URL cannot be empty.');
        return;
      }
      try {
        const withProto = trimmed.startsWith('http') ? trimmed : `http://${trimmed}`;
        const u = new URL(withProto);
        setTarget((prev) => ({ ...prev, base_url: `${u.protocol}//${u.host}` }));
      } catch {
        setFieldError('Invalid Base URL format (e.g. http://localhost:8000).');
        return;
      }
    } else if (activeField === 'endpoint') {
      if (!trimmed) {
        setTarget((prev) => ({ ...prev, endpoint: '/' }));
      } else {
        const formatted = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
        setTarget((prev) => ({ ...prev, endpoint: formatted }));
      }
    } else if (activeField === 'query_params') {
      const parsed = parseKeyValueOrJson(trimmed);
      setTarget((prev) => ({ ...prev, query_params: parsed }));
    } else if (activeField === 'path_params') {
      const parsed = parseKeyValueOrJson(trimmed);
      setTarget((prev) => ({ ...prev, path_params: parsed }));
    } else if (activeField === 'headers') {
      const parsed = parseKeyValueOrJson(trimmed);
      setRequest((prev) => ({ ...prev, headers: parsed }));
    } else if (activeField === 'auth') {
      const parsed = parseJsonOrString(trimmed);
      setRequest((prev) => ({ ...prev, auth: parsed }));
    } else if (activeField === 'body') {
      const parsed = parseJsonOrString(trimmed);
      setRequest((prev) => ({ ...prev, body: parsed }));
    }

    setActiveField('menu');
  };

  const handleMethodSelect = (item: { value: string }) => {
    setTarget((prev) => ({ ...prev, method: item.value }));
    setActiveField('menu');
  };

  const handlePresetSelect = (item: { value: string }) => {
    const found = PRESET_CONFIGS.find((p) => p.value === item.value);
    if (found) {
      setTarget(found.target);
      setRequest(found.request);
    }
    setActiveField('menu');
  };

  const handleMenuSelect = (item: { value: string }) => {
    switch (item.value) {
      case 'save':
        onSave(target, request);
        break;
      case 'cancel':
        onCancel();
        break;
      case 'presets':
        setActiveField('presets');
        break;
      case 'base_url':
        startEditField('base_url', target.base_url);
        break;
      case 'endpoint':
        startEditField('endpoint', target.endpoint);
        break;
      case 'method':
        setActiveField('method');
        break;
      case 'query_params':
        startEditField('query_params', target.query_params);
        break;
      case 'path_params':
        startEditField('path_params', target.path_params);
        break;
      case 'headers':
        startEditField('headers', request.headers);
        break;
      case 'auth':
        startEditField('auth', request.auth);
        break;
      case 'body':
        startEditField('body', request.body);
        break;
    }
  };

  useInput(
    (_input, key) => {
      if (key.escape) {
        if (activeField !== 'menu') {
          setActiveField('menu');
          setFieldError('');
        } else {
          onCancel();
        }
      }
    },
    { isActive: isInteractive }
  );

  const menuOptions = [
    {
      label: `💾 Save & Apply Configuration (${target.method} ${target.base_url}${target.endpoint})`,
      value: 'save',
    },
    {
      label: `🎯 1. Target Base URL: [${target.base_url || 'empty'}]`,
      value: 'base_url',
    },
    {
      label: `📍 2. Target Endpoint: [${target.endpoint || '/'}]`,
      value: 'endpoint',
    },
    {
      label: `⚡ 3. HTTP Method: [${target.method}]`,
      value: 'method',
    },
    {
      label: `🔍 4. Query Params: [${target.query_params ? JSON.stringify(target.query_params) : 'null'}]`,
      value: 'query_params',
    },
    {
      label: `🛤️ 5. Path Params: [${target.path_params ? JSON.stringify(target.path_params) : 'null'}]`,
      value: 'path_params',
    },
    {
      label: `📑 6. Request Headers: [${request.headers ? JSON.stringify(request.headers) : 'null'}]`,
      value: 'headers',
    },
    {
      label: `🔑 7. Request Auth: [${request.auth ? stringifyVal(request.auth) : 'null'}]`,
      value: 'auth',
    },
    {
      label: `📦 8. Request Body: [${request.body ? stringifyVal(request.body) : 'null'}]`,
      value: 'body',
    },
    {
      label: `📋 9. Quick Presets (ThreatLens Pulse, Fintech, Health API, Social)...`,
      value: 'presets',
    },
    {
      label: `↩ Cancel / Back`,
      value: 'cancel',
    },
  ];

  return (
    <Box flexDirection="column" paddingY={1}>
      {/* Title */}
      <Box marginBottom={1} flexDirection="column">
        <Text bold color={theme.highlight}>
          {title}
        </Text>
        <Text color="gray" dimColor>
          Configure `request.target` and `request.request` payload parameters
        </Text>
      </Box>

      {/* Active configuration preview badge */}
      <Box
        borderStyle="single"
        borderColor="gray"
        paddingX={1}
        marginBottom={1}
        flexDirection="column"
      >
        <Box flexDirection="row">
          <Box width={16}>
            <Text bold color="cyan">target.method:</Text>
          </Box>
          <Text bold color="yellow">{target.method}</Text>
          <Box width={16} marginLeft={2}>
            <Text bold color="cyan">target.base_url:</Text>
          </Box>
          <Text color="white">{target.base_url}</Text>
        </Box>
        <Box flexDirection="row">
          <Box width={16}>
            <Text bold color="cyan">target.endpoint:</Text>
          </Box>
          <Text bold color="green">{target.endpoint}</Text>
          <Box width={16} marginLeft={2}>
            <Text bold color="cyan">full target:</Text>
          </Box>
          <Text bold color="cyan">{target.base_url}{target.endpoint}</Text>
        </Box>
        <Box flexDirection="row">
          <Box width={16}>
            <Text color="gray">query_params:</Text>
          </Box>
          <Text color={target.query_params ? 'white' : 'gray'}>
            {target.query_params ? JSON.stringify(target.query_params) : 'null'}
          </Text>
          <Box width={16} marginLeft={2}>
            <Text color="gray">headers:</Text>
          </Box>
          <Text color={request.headers ? 'white' : 'gray'}>
            {request.headers ? JSON.stringify(request.headers) : 'null'}
          </Text>
        </Box>
      </Box>

      {/* Main Menu View */}
      {activeField === 'menu' && (
        <Box flexDirection="column">
          <Select
            items={menuOptions}
            onSelect={handleMenuSelect}
            isFocused={isInteractive}
          />
        </Box>
      )}

      {/* HTTP Method Selection */}
      {activeField === 'method' && (
        <Box flexDirection="column" marginY={1}>
          <Text bold color="yellow">Select Target HTTP Method:</Text>
          <Box marginTop={1}>
            <Select
              items={HTTP_METHODS}
              onSelect={handleMethodSelect}
              isFocused={isInteractive}
            />
          </Box>
          <Box marginTop={1}>
            <Text color="gray" dimColor>Press [Esc] to cancel.</Text>
          </Box>
        </Box>
      )}

      {/* Presets Selection */}
      {activeField === 'presets' && (
        <Box flexDirection="column" marginY={1}>
          <Text bold color="yellow">Select a Target Configuration Preset:</Text>
          <Box marginTop={1}>
            <Select
              items={PRESET_CONFIGS.map((p) => ({ label: p.label, value: p.value }))}
              onSelect={handlePresetSelect}
              isFocused={isInteractive}
            />
          </Box>
          <Box marginTop={1}>
            <Text color="gray" dimColor>Press [Esc] to cancel.</Text>
          </Box>
        </Box>
      )}

      {/* Text Input for Editable Fields */}
      {activeField !== 'menu' && activeField !== 'method' && activeField !== 'presets' && (
        <Box flexDirection="column" marginY={1}>
          <Box flexDirection="row">
            <Box width={22}>
              <Text bold color="yellow">› Edit {activeField}:</Text>
            </Box>
            <Box flexGrow={1}>
              <TextInput
                value={fieldInput}
                onChange={(val) => {
                  setFieldInput(val);
                  if (fieldError) setFieldError('');
                }}
                onSubmit={handleInputSubmit}
                focus={isInteractive}
                placeholder={
                  activeField === 'base_url'
                    ? 'http://localhost:8000'
                    : activeField === 'endpoint'
                    ? '/tc-auth/config/pulse'
                    : activeField === 'query_params'
                    ? 'e.g. param1=val&param2=123 or {"param1":"val"}'
                    : activeField === 'path_params'
                    ? 'e.g. id=2 or {"id": 2}'
                    : activeField === 'headers'
                    ? 'e.g. {"Authorization":"Bearer ..."} or Content-Type: application/json'
                    : activeField === 'auth'
                    ? 'e.g. Bearer token string or null'
                    : 'e.g. {"username":"test"} or raw text'
                }
              />
            </Box>
          </Box>

          {fieldError ? (
            <Box marginTop={1} paddingLeft={2}>
              <Text color="red" bold>✗ {fieldError}</Text>
            </Box>
          ) : null}

          <Box marginTop={1}>
            <Text color="gray" dimColor>
              Press <Text bold color="white">[Enter]</Text> to confirm · <Text bold color="white">[Esc]</Text> to cancel
            </Text>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default TargetRequestEditor;
