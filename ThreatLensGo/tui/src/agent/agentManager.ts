import 'dotenv/config';
import path from 'node:path';
import { SqliteIndexStore } from '../indexer/sqliteStore.js';
import { FileScanner } from '../indexer/fileScanner.js';
import { AstExtractor } from '../indexer/astExtractor.js';
import { UnifiedSearchEngine } from '../indexer/unifiedSearch.js';
import { FileWatcher } from '../indexer/fileWatcher.js';
import { ToolRegistry } from './tools/toolRegistry.js';
import { AutonomousAgentLoop } from './AutonomousAgentLoop.js';
import { AgentController } from './types.js';
import { LLMClient, OpenAILLMClient, FallbackLLMClient } from './llm/llmClient.js';
import { BackendGatewayLLMClient } from './llm/backendGatewayClient.js';
import { backendClient } from '../api/backendClient.js';
import { MockAgentController } from './MockAgentController.js';
import { DEFAULT_AGENT_CONFIG, AgentConfig } from './config.js';

export interface AgentManagerStats {
  workspaceRoot: string;
  totalFiles: number;
  totalSymbols: number;
  totalDependencies: number;
  modelName: string;
  isLive: boolean;
}

export class ThreatLensAgentManager {
  private workspaceRoot: string;
  private store: SqliteIndexStore | null = null;
  private searchEngine: UnifiedSearchEngine | null = null;
  private toolRegistry: ToolRegistry | null = null;
  private watcher: FileWatcher | null = null;
  private controller: AgentController | null = null;
  private config: AgentConfig;
  private isLive = false;
  private modelName = 'Mock / Scripted';

  constructor(workspaceRoot?: string, config: AgentConfig = DEFAULT_AGENT_CONFIG) {
    this.workspaceRoot = path.resolve(workspaceRoot || process.cwd());
    this.config = config;
  }

  /**
   * Initializes the full codebase indexing, dependency graph, SQLite store, and AutonomousAgentLoop.
   */
  public async init(options?: { customLLM?: LLMClient }): Promise<AgentController> {
    const dbPath = path.join(this.workspaceRoot, '.threatlens_index.db');
    this.store = new SqliteIndexStore(dbPath);

    const scanner = new FileScanner(this.workspaceRoot);
    const extractor = new AstExtractor();

    // 1. Startup hash reconciliation (sub-millisecond if unchanged)
    const scanResult = await scanner.scan();
    await this.store.reconcile(scanResult, extractor, this.workspaceRoot);

    // 2. Initialize Search & Tool Registry
    this.searchEngine = new UnifiedSearchEngine(this.workspaceRoot, this.store);
    this.toolRegistry = new ToolRegistry(
      {
        workspaceRoot: this.workspaceRoot,
        searchEngine: this.searchEngine,
        store: this.store,
      },
      this.config
    );

    // 3. Start Live File Watcher
    this.watcher = new FileWatcher(this.workspaceRoot, this.store, extractor);
    await this.watcher.start();

    // 4. Resolve Resilient LLM Client with Fallback Architecture:
    // Priority:
    // (1) options.customLLM if provided
    // (2) FallbackLLMClient chain:
    //     - Tier 1: BackendGatewayLLMClient (if backend is online)
    //     - Tier 2: Direct OpenRouter (Primary model)
    //     - Tier 3: Direct OpenRouter (Llama 3.3 70B Free fallback model)
    //     - Tier 4: Direct OpenRouter (Gemini 2.0 Flash fallback model)
    //     - Tier 5: Direct Groq (if configured)
    //     - Tier 6: Direct OpenAI (if configured)
    // (3) MockAgentController if no backend and no credentials exist
    let llmClient: LLMClient;

    if (options?.customLLM) {
      llmClient = options.customLLM;
      this.isLive = true;
      this.modelName = 'Custom LLM';
    } else {
      const openRouterKey = process.env.OPENROUTER_API_KEY || process.env.OPEN_ROUTER_API_KEY;
      const groqKey = process.env.GROQ_API_KEY;
      const openAiKey = process.env.OPENAI_API_KEY;
      const primaryModel = process.env.LLM_MODEL || 'nvidia/nemotron-3-super-120b-a12b:free';

      let isBackendOnline = false;
      try {
        const pulse = await backendClient.pulse();
        isBackendOnline = pulse.connect === true || pulse.status === 'Live';
      } catch {
        isBackendOnline = false;
      }

      const tiers: Array<{ id: string; name: string; client: LLMClient }> = [];

      // Tier 1: Backend Gateway (if online)
      if (isBackendOnline) {
        tiers.push({
          id: 'backend-gateway',
          name: `Backend Gateway (${primaryModel})`,
          client: new BackendGatewayLLMClient(primaryModel),
        });
      }

      // Tier 2: Direct OpenRouter (Primary Model)
      if (openRouterKey) {
        tiers.push({
          id: 'direct-openrouter-primary',
          name: `Direct OpenRouter (${primaryModel})`,
          client: new OpenAILLMClient({
            apiKey: openRouterKey,
            baseUrl: process.env.LLM_BASE_URL || 'https://openrouter.ai/api/v1',
            model: primaryModel,
          }),
        });

        // Tier 3: Direct OpenRouter Alternative Model (Llama 3.3 70B Free)
        if (primaryModel !== 'meta-llama/llama-3.3-70b-instruct:free') {
          tiers.push({
            id: 'direct-openrouter-llama',
            name: 'Direct OpenRouter (meta-llama/llama-3.3-70b-instruct:free)',
            client: new OpenAILLMClient({
              apiKey: openRouterKey,
              baseUrl: 'https://openrouter.ai/api/v1',
              model: 'meta-llama/llama-3.3-70b-instruct:free',
            }),
          });
        }

        // Tier 4: Direct OpenRouter Alternative Model (Gemini 2.0 Flash)
        if (primaryModel !== 'google/gemini-2.0-flash-001') {
          tiers.push({
            id: 'direct-openrouter-gemini',
            name: 'Direct OpenRouter (google/gemini-2.0-flash-001)',
            client: new OpenAILLMClient({
              apiKey: openRouterKey,
              baseUrl: 'https://openrouter.ai/api/v1',
              model: 'google/gemini-2.0-flash-001',
            }),
          });
        }
      }

      // Tier 5: Direct Groq (if configured)
      if (groqKey) {
        const cleanGroqKey = groqKey.replace(/^"|"$/g, '');
        tiers.push({
          id: 'direct-groq',
          name: 'Direct Groq (llama-3.3-70b-versatile)',
          client: new OpenAILLMClient({
            apiKey: cleanGroqKey,
            baseUrl: 'https://api.groq.com/openai/v1',
            model: 'llama-3.3-70b-versatile',
          }),
        });
      }

      // Tier 6: Direct OpenAI (if configured)
      if (openAiKey) {
        tiers.push({
          id: 'direct-openai',
          name: 'Direct OpenAI (gpt-4o)',
          client: new OpenAILLMClient({
            apiKey: openAiKey,
            baseUrl: 'https://api.openai.com/v1',
            model: 'gpt-4o',
          }),
        });
      }

      if (tiers.length > 0) {
        this.isLive = true;
        const fallbackCount = tiers.length - 1;
        this.modelName = fallbackCount > 0
          ? `${tiers[0].name} (+${fallbackCount} fallback tiers)`
          : tiers[0].name;

        llmClient = new FallbackLLMClient(tiers, {
          onTierSwitched: (fromTier, toTier) => {
            this.modelName = `${toTier} (active fallback)`;
          },
        });
      } else {
        // Fallback to MockAgentController if no API keys are provided in terminal environment
        this.isLive = false;
        this.modelName = 'Simulated Agent (Set OPENROUTER_API_KEY for live LLM)';
        this.controller = new MockAgentController();
        return this.controller;
      }
    }

    this.controller = new AutonomousAgentLoop(llmClient, this.toolRegistry, this.config);
    return this.controller;
  }

  public getController(): AgentController {
    if (!this.controller) {
      throw new Error('ThreatLensAgentManager not initialized. Call init() first.');
    }
    return this.controller;
  }

  public getStats(): AgentManagerStats {
    return {
      workspaceRoot: this.workspaceRoot,
      totalFiles: this.store ? this.store.getFileCount() : 0,
      totalSymbols: this.store ? this.store.getSymbolCount() : 0,
      totalDependencies: this.store ? this.store.getAllDependencies().length : 0,
      modelName: this.modelName,
      isLive: this.isLive,
    };
  }

  /**
   * Shuts down watcher, close database connection, and cleans up resources.
   */
  public async shutdown(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }
    if (this.store) {
      this.store.close();
      this.store = null;
    }
  }
}
