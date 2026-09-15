# ThreatLens — System Architecture & Design Document
**Document Version:** 1.0.0  
**Status:** Approved  
**Target:** Core Engineers, Security Architects, and DevOps Teams  

---

## 1. System Topology & High-Level Architecture

ThreatLens is engineered around an event-driven, multi-tier micro-architecture separating presentation, dynamic execution, static code intelligence, autonomous AI reasoning, and audit ledger persistence.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION & CLIENTS                          │
│                                                                        │
│   ┌────────────────────────────────┐   ┌───────────────────────────┐   │
│   │   ThreatLens Web Dashboard     │   │   ThreatLensGo (TUI)      │   │
│   │   React 18 + Vite + Tailwind   │   │   React 18 + Ink 5 + TS   │   │
│   │   Port: 5173                   │   │   Port: Terminal / CLI    │   │
│   └───────────────┬────────────────┘   └─────────────┬─────────────┘   │
└───────────────────┼──────────────────────────────────┼─────────────────┘
                    │                                  │
                    ▼                                  ▼
┌──────────────────────────────────────┐   ┌─────────────────────────────┐
│       CORE ENTERPRISE BACKEND        │   │    CLI & AGENT ENGINE       │
│           (FastAPI :8000)            │   │      (FastAPI :8001)        │
│                                      │   │                             │
│ - JWT Authentication & RBAC          │   │ - In-Memory Tree-sitter WASM│
│ - Repository Indexing & Sync         │   │ - SQLite WAL Cache Engine   │
│ - Security Scan Scheduler            │   │ - 7-Tool ReAct Agent Loop   │
│ - Merkle Audit Ledger Generator      │   │ - Dynamic Exploit Runner    │
└──────────────────┬───────────────────┘   └──────────────┬──────────────┘
                   │                                      │
                   ▼                                      ▼
┌──────────────────────────────────────┐   ┌─────────────────────────────┐
│          DATA & AUDIT TIER           │   │    EXTERNAL AI & SERVICES   │
│                                      │   │                             │
│ - PostgreSQL 14 (Primary Database)   │   │ - OpenRouter / OpenAI /     │
│ - SQLite WAL (AST Symbol Tables)     │   │   Anthropic / Ultron Models │
│ - AuditAnchor.sol (Ethereum EVM)     │   │ - Dynamic Target Endpoints  │
└──────────────────────────────────────┘   └─────────────────────────────┘
```

---

## 2. Core Subsystems

### 2.1 AST Codebase Intelligence Engine
The AST subsystem converts multi-language source repositories into navigable syntax graphs in memory without executing third-party code.

- **Parser Framework**: Tree-sitter WebAssembly (WASM) runtime bindings.
- **Supported Languages**: Python (`tree-sitter-python`), TypeScript/JavaScript (`tree-sitter-typescript`), and Go (`tree-sitter-go`).
- **Symbol Cache (SQLite WAL)**:
  - Stores indexed symbol trees, class definitions, function boundaries, and import graphs.
  - Keyed by `SHA-256(file_content)` to enable instantaneous cache hits on unchanged files.
  - Re-indexes changed files in `< 50ms`.

```
Source Code ──► Tree-sitter WASM ──► In-Memory AST ──► SQLite WAL Cache
                                           │
                                           ▼
                                 Symbol Hierarchy &
                                Caller Dependency Graph
```

### 2.2 ReAct Autonomous Patching Loop
The remediation engine implements the Reasoning + Acting pattern, querying the codebase through specialized tools before proposing patches.

```
                  ┌──────────────────────┐
                  │ Vulnerability Report │
                  │  (from sectest/DAST) │
                  └──────────┬───────────┘
                             │
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │                   ReAct Agent Cycle                    │
 │                                                        │
 │  1. THOUGHT: Reason about vulnerability sink           │
 │  2. ACTION:  Execute tool (search_code / find_symbol)  │
 │  3. OBSERVE: Analyze symbol definitions & callers      │
 │  4. ACTION:  read_file line ranges                     │
 │  5. ACTION:  edit_file (generate minimal unified diff) │
 └───────────────────────────┬────────────────────────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │ Unified Diff Modal   │
                  │  (HITL Approval)     │
                  └──────────┬───────────┘
                             │
                  [Approved by Operator]
                             │
                             ▼
                  ┌──────────────────────┐
                  │ 3-Way Adversarial    │
                  │ Validation Matrix    │
                  └──────────┬───────────┘
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
       [REMEDIATED]                     [FLAWED_PATCH]
  (Committed to Audit)             (Re-enters Agent Loop)
```

### 2.3 7 Autonomous Tools
1. `search_code(query, file_pattern)`: Structural regex and keyword search across indexed workspace.
2. `find_symbol(name, symbol_type)`: Retrieves declarations, method signatures, and class members.
3. `read_file(path, start_line, end_line)`: AST-guided line inspection.
4. `edit_file(path, old_str, new_str)`: Formats and stages unified diff replacements.
5. `get_dependencies(path)`: Discovers call hierarchies and import references.
6. `run_sectest(module, target_url)`: Dispatches dynamic offensive payloads.
7. `verify_remediation(finding_id, patch_id)`: Executes 3-way adversarial re-testing.

---

## 3. Data Architecture & Security Flow

### 3.1 Entity Relationship Overview
- **User / Tenant**: Manages organizations, API tokens, and authorization scopes.
- **Repository**: Contains synced branches, AST cache references, and file manifests.
- **Scan**: Represents an orchestrated dynamic probe session against target URLs.
- **Finding**: A single vulnerability entry containing severity, payload, reproduction steps, and AST reference.
- **Patch**: Staged and approved unified diffs tied to a Finding ID.
- **Merkle Epoch**: Root hash summarizing all scan findings and patch approvals for a given timeframe.

### 3.2 Merkle Audit Chain & Blockchain Anchoring
To ensure audit non-repudiation:
1. Every scan result and approved patch is canonicalized into a deterministic JSON format.
2. Individual leaves are hashed with SHA-256: `L_i = SHA256(CanonicalJSON(Event_i))`.
3. Merkle tree nodes are calculated: `Node = SHA256(LeftChild || RightChild)`.
4. The Merkle root is committed periodically to the `AuditAnchor.sol` smart contract on Ethereum / EVM-compatible chains.

---

## 4. Security & Safety Principles

1. **Strict Sandboxing**: Dynamic probers run in isolated network namespaces with domain whitelisting.
2. **Deterministic Diff Verification**: The agent can only modify files inside the targeted repository workspace.
3. **No Unsupervised Commits**: Automated push actions require two-factor confirmation or explicit operator sign-off in the UI.
4. **Credential Isolation**: LLM API keys and database credentials are injected via environment variables and never logged or exposed via SSE streams.
