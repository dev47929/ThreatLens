import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { TerminalLayout } from '../components/TerminalLayout.js';
import { Select, SelectOption } from '../components/Select.js';
import { useNavigation } from '../state/navigation.js';
import { useTheme } from '../state/themeContext.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
import { backendClient } from '../api/backendClient.js';
import {
  LLM_PRESETS,
  LlmPreset,
  loadSavedLlmConfig,
  saveLlmConfig,
  PersistentLlmConfig,
} from '../state/llmConfig.js';

type ViewMode =
  | 'menu'
  | 'edit_baseUrl'
  | 'edit_apiKey'
  | 'edit_model'
  | 'select_preset'
  | 'select_provider';

export const LlmConfigScreen: React.FC = () => {
  const { pop } = useNavigation();
  const { theme } = useTheme();
  const { rows } = useTerminalSize();

  const saved = loadSavedLlmConfig();
  const [provider, setProvider] = useState<'custom' | 'openrouter' | 'groq'>(saved.provider || 'custom');
  const [baseUrl, setBaseUrl] = useState<string>(saved.custom_base_url || 'http://localhost:11434/v1');
  const [apiKey, setApiKey] = useState<string>(saved.custom_api_key || '');
  const [model, setModel] = useState<string>(saved.custom_model || 'llama3');

  const [viewMode, setViewMode] = useState<ViewMode>('menu');
  const [fieldInput, setFieldInput] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('Select an option to configure local AI or cloud LLM');
  const [statusType, setStatusType] = useState<'ready' | 'success' | 'warning' | 'error'>('ready');
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [appliedNotification, setAppliedNotification] = useState<string | null>(null);

  const isInteractive = Boolean(process.stdin?.isTTY);

  // Load live backend provider configuration on mount
  useEffect(() => {
    backendClient
      .getLlmProvider()
      .then((res) => {
        if (res?.current?.provider) {
          const prov = res.current.provider as 'custom' | 'openrouter' | 'groq';
          setProvider(prov);
          if (res.current.base_url) setBaseUrl(res.current.base_url);
          if (res.current.default_model) setModel(res.current.default_model);
          setStatusMessage(`Active Backend: [${res.current.provider.toUpperCase()}] · ${res.current.default_model}`);
        }
      })
      .catch(() => {
        // Backend not yet ready or offline
      });
  }, []);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setStatusType('warning');
    setStatusMessage(`Testing connection to ${baseUrl}...`);
    setTestResult(null);

    try {
      const res = await backendClient.testLlmProvider({
        base_url: baseUrl,
        api_key: apiKey,
        model,
      });

      if (res.success) {
        setTestResult({
          success: true,
          message: `✓ Connection verified! Host reachable (${res.status_code || 200})`,
        });
        setStatusType('success');
        setStatusMessage(`Connection verified: ${baseUrl}`);
      } else {
        setTestResult({
          success: false,
          message: `✗ ${res.message}`,
        });
        setStatusType('error');
        setStatusMessage(`Connection check failed: ${res.message}`);
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `✗ Connection failed: ${err.message || 'Host unreachable'}`,
      });
      setStatusType('error');
      setStatusMessage('Connection test failed');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    setStatusType('warning');
    setStatusMessage('Saving and activating LLM configuration...');

    const conf: PersistentLlmConfig = {
      provider,
      custom_base_url: baseUrl.trim(),
      custom_api_key: apiKey.trim(),
      custom_model: model.trim(),
    };

    saveLlmConfig(conf);

    try {
      if (provider === 'custom') {
        await backendClient.setCustomLlmProvider({
          base_url: conf.custom_base_url,
          api_key: conf.custom_api_key,
          default_model: conf.custom_model,
        });
      } else {
        await backendClient.setLlmProvider(provider);
      }

      setStatusType('success');
      setAppliedNotification(`✓ Activated [${provider.toUpperCase()}]: ${conf.custom_model} (${conf.custom_base_url})`);
      setStatusMessage('Configuration successfully saved and applied to backend!');

      setTimeout(() => {
        pop();
      }, 1000);
    } catch (err: any) {
      setStatusType('ready');
      setAppliedNotification(`✓ Saved to ~/.threatlensgo/config.json (Backend response: ${err.message})`);
      setTimeout(() => {
        pop();
      }, 1200);
    }
  };

  const startEdit = (mode: ViewMode, initialVal: string) => {
    setFieldInput(initialVal);
    setViewMode(mode);
  };

  const handleFieldSubmit = (val: string) => {
    const trimmed = val.trim();
    if (viewMode === 'edit_baseUrl') {
      if (trimmed) setBaseUrl(trimmed);
    } else if (viewMode === 'edit_apiKey') {
      setApiKey(trimmed);
    } else if (viewMode === 'edit_model') {
      if (trimmed) setModel(trimmed);
    }
    setViewMode('menu');
  };

  const handleMenuSelect = (item: SelectOption) => {
    switch (item.value) {
      case 'save':
        handleSave();
        break;
      case 'test':
        handleTestConnection();
        break;
      case 'provider':
        setViewMode('select_provider');
        break;
      case 'preset':
        setViewMode('select_preset');
        break;
      case 'baseUrl':
        startEdit('edit_baseUrl', baseUrl);
        break;
      case 'apiKey':
        startEdit('edit_apiKey', apiKey);
        break;
      case 'model':
        startEdit('edit_model', model);
        break;
      case 'back':
        pop();
        break;
    }
  };

  const handlePresetSelect = (item: SelectOption) => {
    const preset = LLM_PRESETS.find((p) => p.id === item.value);
    if (preset) {
      if (preset.id === 'openrouter' || preset.id === 'groq') {
        setProvider(preset.id as any);
      } else {
        setProvider('custom');
      }
      setBaseUrl(preset.baseUrl);
      setModel(preset.defaultModel);
      if (!preset.requiresKey) {
        setApiKey('');
      }
      setStatusMessage(`Loaded preset: ${preset.name}`);
      setTestResult(null);
    }
    setViewMode('menu');
  };

  const handleProviderSelect = (item: SelectOption) => {
    setProvider(item.value as any);
    setViewMode('menu');
  };

  // Only handle escape key in sub-views or menu exit
  useInput(
    (_input, key) => {
      if (key.escape) {
        if (appliedNotification) {
          pop();
        } else if (viewMode !== 'menu') {
          setViewMode('menu');
        } else {
          pop();
        }
      }
    },
    { isActive: isInteractive }
  );

  const menuOptions: SelectOption[] = [
    {
      label: '💾 Save & Activate Configuration (Apply to running backend & persist)',
      value: 'save',
    },
    {
      label: `🧪 Test Connection to Endpoint ${isTesting ? '⏳' : ''}`,
      value: 'test',
    },
    {
      label: `⚡ Active Provider: [${provider.toUpperCase()}] (Press to switch)`,
      value: 'provider',
    },
    {
      label: '📦 Load Preset (Ollama, LM Studio, vLLM, LocalAI, OpenRouter, Groq)',
      value: 'preset',
    },
    {
      label: `🌐 Base URL: [${baseUrl}]`,
      value: 'baseUrl',
    },
    {
      label: `🔑 API Key / Token: [${apiKey ? '••••' + apiKey.slice(-4) : '(None - local models do not need token)'}]`,
      value: 'apiKey',
    },
    {
      label: `🧠 Default Model: [${model}]`,
      value: 'model',
    },
    {
      label: '↩ Back to Main Menu',
      value: 'back',
    },
  ];

  const providerOptions: SelectOption[] = [
    { label: '1. Custom / Local AI (Ollama, LM Studio, vLLM, LocalAI)', value: 'custom' },
    { label: '2. OpenRouter (Cloud Multi-Model Gateway)', value: 'openrouter' },
    { label: '3. Groq (Ultra-Fast Cloud LPU)', value: 'groq' },
  ];

  const presetOptions: SelectOption[] = LLM_PRESETS.map((p, idx) => ({
    label: `${idx + 1}. ${p.name} (${p.baseUrl} · ${p.defaultModel})`,
    value: p.id,
  }));

  return (
    <TerminalLayout
      title="LLM & Local AI Configuration"
      subtitle="Configure custom provider base URL, token, and default model for local or cloud AI."
      breadcrumb="LLM CONFIG"
      statusText={statusMessage}
      statusType={statusType}
      keyHints={
        viewMode === 'menu'
          ? '↑↓ navigate · enter select · esc back'
          : 'enter confirm · esc cancel'
      }
    >
      <Box flexDirection="column" gap={1}>
        {/* Applied Notification Banner */}
        {appliedNotification && (
          <Box borderStyle="round" borderColor={theme.success} paddingX={2} paddingY={0}>
            <Text bold color={theme.success}>
              {appliedNotification}
            </Text>
          </Box>
        )}

        {/* Current Active Configuration Card */}
        <Box
          borderStyle="round"
          borderColor={theme.accent}
          paddingX={2}
          paddingY={0}
          flexDirection="column"
        >
          <Box justifyContent="space-between">
            <Text bold color={theme.accent}>
              ACTIVE CONFIG: [{provider.toUpperCase()}]
            </Text>
            <Text color={theme.textMuted}>
              Model: <Text bold color={theme.text}>{model}</Text>
            </Text>
          </Box>
          <Box flexDirection="row" gap={2}>
            <Text color={theme.textMuted}>
              URL: <Text color={theme.text}>{baseUrl}</Text>
            </Text>
            <Text color={theme.textMuted}>·</Text>
            <Text color={theme.textMuted}>
              Auth:{' '}
              <Text color={apiKey ? theme.success : theme.textMuted}>
                {apiKey ? 'Key Configured' : 'No Token (Local Mode)'}
              </Text>
            </Text>
          </Box>
        </Box>

        {/* Test Result Badge */}
        {testResult && (
          <Box
            borderStyle="single"
            borderColor={testResult.success ? theme.success : theme.error}
            paddingX={1}
          >
            <Text bold color={testResult.success ? theme.success : theme.error}>
              {testResult.message}
            </Text>
          </Box>
        )}

        {/* Main Menu View */}
        {viewMode === 'menu' && (
          <Box flexDirection="column" marginTop={0}>
            <Select
              items={menuOptions}
              onSelect={handleMenuSelect}
              isFocused={isInteractive}
              limit={rows && rows < 34 ? 8 : 10}
            />
          </Box>
        )}

        {/* Provider Selection View */}
        {viewMode === 'select_provider' && (
          <Box flexDirection="column" marginY={1}>
            <Text bold color={theme.accent}>Select Active LLM Provider:</Text>
            <Box marginTop={1}>
              <Select
                items={providerOptions}
                onSelect={handleProviderSelect}
                isFocused={isInteractive}
              />
            </Box>
            <Box marginTop={1}>
              <Text color={theme.textMuted} dimColor>Press [Esc] to cancel.</Text>
            </Box>
          </Box>
        )}

        {/* Preset Selection View */}
        {viewMode === 'select_preset' && (
          <Box flexDirection="column" marginY={1}>
            <Text bold color={theme.accent}>Select Local / Cloud Runner Preset:</Text>
            <Box marginTop={1}>
              <Select
                items={presetOptions}
                onSelect={handlePresetSelect}
                isFocused={isInteractive}
              />
            </Box>
            <Box marginTop={1}>
              <Text color={theme.textMuted} dimColor>Press [Esc] to cancel.</Text>
            </Box>
          </Box>
        )}

        {/* Single-Field Edit View */}
        {(viewMode === 'edit_baseUrl' || viewMode === 'edit_apiKey' || viewMode === 'edit_model') && (
          <Box
            flexDirection="column"
            borderStyle="round"
            borderColor={theme.highlight}
            paddingX={2}
            paddingY={1}
            marginY={1}
          >
            <Text bold color={theme.highlight}>
              {viewMode === 'edit_baseUrl' && '› Edit Provider Base URL:'}
              {viewMode === 'edit_apiKey' && '› Edit API Key / Token:'}
              {viewMode === 'edit_model' && '› Edit Default Model Tag:'}
            </Text>

            <Box marginTop={1} flexDirection="row">
              <Box width={16}>
                <Text color={theme.textMuted}>Current Value:</Text>
              </Box>
              <TextInput
                value={fieldInput}
                onChange={setFieldInput}
                onSubmit={handleFieldSubmit}
                focus={isInteractive}
                placeholder={
                  viewMode === 'edit_baseUrl'
                    ? 'http://localhost:11434/v1'
                    : viewMode === 'edit_apiKey'
                    ? 'Optional (leave blank for local models)'
                    : 'llama3'
                }
              />
            </Box>

            <Box marginTop={1}>
              <Text color={theme.textMuted} dimColor>
                {viewMode === 'edit_baseUrl' &&
                  'Enter OpenAI-compatible base URL (e.g. http://localhost:11434/v1 for Ollama, http://localhost:1234/v1 for LM Studio)'}
                {viewMode === 'edit_apiKey' &&
                  'Enter bearer token or leave blank if running Ollama, LM Studio, or LocalAI without auth'}
                {viewMode === 'edit_model' &&
                  'Enter model name matching your runner (e.g. llama3, qwen2.5-coder, mistral, deepseek-r1)'}
              </Text>
            </Box>

            <Box marginTop={1}>
              <Text color={theme.accent}>Press [Enter] to confirm · [Esc] to cancel</Text>
            </Box>
          </Box>
        )}
      </Box>
    </TerminalLayout>
  );
};

export default LlmConfigScreen;
