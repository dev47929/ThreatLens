import fs from 'fs';
import path from 'path';
import os from 'os';

export interface LlmPreset {
  id: string;
  name: string;
  description: string;
  baseUrl: string;
  defaultModel: string;
  requiresKey: boolean;
  keyPlaceholder?: string;
}

export const LLM_PRESETS: LlmPreset[] = [
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    description: 'Local open-source models running via Ollama (port 11434)',
    baseUrl: 'http://localhost:11434/v1',
    defaultModel: 'llama3',
    requiresKey: false,
    keyPlaceholder: 'Not needed (leave blank)',
  },
  {
    id: 'lm_studio',
    name: 'LM Studio (Local)',
    description: 'Local GUI inference server running OpenAI-compatible API',
    baseUrl: 'http://localhost:1234/v1',
    defaultModel: 'local-model',
    requiresKey: false,
    keyPlaceholder: 'Not needed (leave blank)',
  },
  {
    id: 'vllm',
    name: 'vLLM (Local / Self-Hosted)',
    description: 'High-throughput local/GPU LLM inference engine',
    baseUrl: 'http://localhost:8000/v1',
    defaultModel: 'meta-llama/Llama-3-8B-Instruct',
    requiresKey: false,
    keyPlaceholder: 'Optional (e.g. token or leave blank)',
  },
  {
    id: 'localai',
    name: 'LocalAI (Local)',
    description: 'Self-hosted drop-in OpenAI replacement for CPU/GPU',
    baseUrl: 'http://localhost:8080/v1',
    defaultModel: 'gpt-4',
    requiresKey: false,
    keyPlaceholder: 'Optional (leave blank)',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter (Cloud)',
    description: 'Multi-provider cloud gateway (Claude, GPT-4, Llama, DeepSeek)',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'nvidia/nemotron-3-super-120b-a12b:free',
    requiresKey: true,
    keyPlaceholder: 'sk-or-v1-...',
  },
  {
    id: 'groq',
    name: 'Groq (Cloud)',
    description: 'Ultra-fast LPU inference (Llama 3.3, Mixtral)',
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    requiresKey: true,
    keyPlaceholder: 'gsk_...',
  },
];

export interface PersistentLlmConfig {
  provider: 'custom' | 'openrouter' | 'groq';
  custom_base_url: string;
  custom_api_key: string;
  custom_model: string;
}

function getConfigFilePath(): string {
  return path.join(os.homedir(), '.threatlensgo', 'config.json');
}

export function loadSavedLlmConfig(): PersistentLlmConfig {
  try {
    const configPath = getConfigFilePath();
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && parsed.llm) {
        return {
          provider: parsed.llm.provider || 'custom',
          custom_base_url: parsed.llm.custom_base_url || 'http://localhost:11434/v1',
          custom_api_key: parsed.llm.custom_api_key || '',
          custom_model: parsed.llm.custom_model || 'llama3',
        };
      }
    }
  } catch {
    // Fail gracefully
  }

  return {
    provider: (process.env.LLM_PROVIDER as any) || 'custom',
    custom_base_url: process.env.CUSTOM_LLM_URL || 'http://localhost:11434/v1',
    custom_api_key: process.env.CUSTOM_LLM_API_KEY || '',
    custom_model: process.env.CUSTOM_LLM_MODEL || 'llama3',
  };
}

export function saveLlmConfig(conf: PersistentLlmConfig): void {
  try {
    const dir = path.join(os.homedir(), '.threatlensgo');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const configPath = path.join(dir, 'config.json');
    let existing: Record<string, any> = {};
    if (fs.existsSync(configPath)) {
      try {
        existing = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      } catch {
        existing = {};
      }
    }
    existing.llm = {
      provider: conf.provider,
      custom_base_url: conf.custom_base_url,
      custom_api_key: conf.custom_api_key,
      custom_model: conf.custom_model,
    };
    existing.updatedAt = new Date().toISOString();
    fs.writeFileSync(configPath, JSON.stringify(existing, null, 2), 'utf-8');
  } catch {
    // Fail gracefully
  }
}
