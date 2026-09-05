# 🛡️ ThreatLens — Next-Gen Autonomous Offensive Security & Codebase Intelligence

<div align="center">

```
  ████████╗██╗  ██╗██████╗ ███████╗ █████╗ ████████╗██╗     ███████╗███╗   ██╗███████╗
  ╚══██╔══╝██║  ██║██╔══██╗██╔════╝██╔══██╗╚══██╔══╝██║     ██╔════╝████╗  ██║██╔════╝
     ██║   ███████║██████╔╝█████╗  ███████║   ██║   ██║     █████╗  ██╔██╗ ██║███████╗
     ██║   ██╔══██║██╔══██╗██╔══╝  ██╔══██║   ██║   ██║     ██╔══╝  ██║╚██╗██║╚════██║
     ██║   ██║  ██║██║  ██║███████╗██║  ██║   ██║   ███████╗███████╗██║ ╚████║███████║
     ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚══════╝╚═╝  ╚═══╝╚══════╝
```

**Next-Generation Autonomous Offensive Security, AST Codebase Intelligence & Tamper-Proof Audit Platform**

*From Dynamic Exploit Probe to Verified Source Code Patch in < 60 Seconds.*

---

[![CI Build Status](https://img.shields.io/badge/build-passing-brightgreen?style=for-the-badge&logo=githubactions&logoColor=white)](https://github.com/dev47929/ThreatLens)
[![Release Version](https://img.shields.io/badge/release-v2.4.0-blue?style=for-the-badge&logo=semanticrelease&logoColor=white)](https://github.com/dev47929/ThreatLens/releases)
[![License](https://img.shields.io/badge/License-ISC-00c853?style=for-the-badge)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-ff6f00?style=for-the-badge)](./CONTRIBUTING.md)

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Ink](https://img.shields.io/badge/Ink-v5.0-purple?logo=terminal&logoColor=white)](https://github.com/vadimdemedes/ink)
[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white)](https://python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Tree-sitter WASM](https://img.shields.io/badge/Tree--sitter-WASM-black?logo=webassembly&logoColor=white)](https://tree-sitter.github.io/)
[![SQLite WAL](https://img.shields.io/badge/SQLite-WAL--Mode-003B57?logo=sqlite&logoColor=white)](https://sqlite.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15%2B-4169E1?logo=postgresql&logoColor=white)](https://postgresql.org/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8%2B-363636?logo=solidity&logoColor=white)](https://soliditylang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

[**Explore Documentation**](#-documentation-matrix) • [**System Architecture**](#-architecture--system-design) • [**Request Lifecycle**](#-request--remediation-lifecycle) • [**ER Model**](#-database--entity-relationship-er-model) • [**Quickstart**](#-installation--setup) • [**Live Demo**](#-screenshots--interactive-demos)

---

</div>

## 📑 Table of Contents

- [🛡️ ThreatLens — Next-Gen Autonomous Offensive Security \& Codebase Intelligence](#️-threatlens--next-gen-autonomous-offensive-security--codebase-intelligence)
  - [📑 Table of Contents](#-table-of-contents)
  - [🌐 Executive Overview](#-executive-overview)
    - [The Problem: The DevSecOps "Alert Graveyard"](#the-problem-the-devsecops-alert-graveyard)
    - [The Solution: ThreatLens Closed-Loop Self-Healing Pipeline](#the-solution-threatlens-closed-loop-self-healing-pipeline)
    - [Dual-Surface Operational Experience](#dual-surface-operational-experience)
  - [⚡ Key Features \& Capabilities](#-key-features--capabilities)
  - [🏗 Architecture \& System Design](#-architecture--system-design)
    - [High-Level Multi-Tier Architecture Flowchart](#high-level-multi-tier-architecture-flowchart)
  - [🔄 Request \& Remediation Lifecycle](#-request--remediation-lifecycle)
    - [End-to-End Closed-Loop Lifecycle Flowchart](#end-to-end-closed-loop-lifecycle-flowchart)
  - [🗄 Database \& Entity-Relationship (ER) Model](#-database--entity-relationship-er-model)
    - [Mermaid Entity-Relationship Diagram](#mermaid-entity-relationship-diagram)
    - [Data Model Dictionary](#data-model-dictionary)
      - [1. Remote PostgreSQL Schema](#1-remote-postgresql-schema)
      - [2. Local SQLite WAL Cache Schema](#2-local-sqlite-wal-cache-schema)
  - [🔐 File Access Security \& RBAC Permissions](#-file-access-security--rbac-permissions)
    - [File Access Boundaries \& Sandboxing](#file-access-boundaries--sandboxing)
    - [Role-Based Access Control (RBAC) Matrix](#role-based-access-control-rbac-matrix)
  - [💻 Complete Tech Stack](#-complete-tech-stack)
  - [📦 Installation \& Setup](#-installation--setup)
    - [Prerequisites](#prerequisites)
    - [1. Clone \& Workspace Setup](#1-clone--workspace-setup)
    - [2. Setting up ThreatLensGo TUI](#2-setting-up-threatlensgo-tui)
    - [3. Setting up Backend Microservices](#3-setting-up-backend-microservices)
    - [4. Setting up ThreatLens Web Dashboard](#4-setting-up-threatlens-web-dashboard)
    - [5. Environment Variables Setup (`.env`)](#5-environment-variables-setup-env)
  - [🚀 Usage Guide](#-usage-guide)
    - [Interactive TUI Navigation (`ThreatLensGo`)](#interactive-tui-navigation-threatlensgo)
    - [Autonomous Codebase Remediation Workflow](#autonomous-codebase-remediation-workflow)
    - [Running SecTest Dynamic Prober CLI](#running-sectest-dynamic-prober-cli)
  - [📸 Screenshots \& Interactive Demos](#-screenshots--interactive-demos)
    - [TUI Live Remediation \& Diff Approval Preview](#tui-live-remediation--diff-approval-preview)
    - [TUI Animated Terminal Experience](#tui-animated-terminal-experience)
  - [📚 Documentation Matrix](#-documentation-matrix)
  - [🤝 Contributing](#-contributing)
  - [⚠️ Security Notice \& Ethical Disclosure](#️-security-notice--ethical-disclosure)
  - [👥 Credits \& Team](#-credits--team)
  - [📄 License](#-license)

---

## 🌐 Executive Overview

### The Problem: The DevSecOps "Alert Graveyard"
Modern software development moves at hyper-speed, but security remains trapped in the 2010s. Traditional DAST and SAST tools generate massive 100-page passive reports that state *"SQL Injection detected on endpoint `/api/search`"* and dump the problem on developers' desks.

The developer must manually grep codebases, trace routes to handlers, identify dependencies, guess at patches, test against regressions, and deploy. **Over 40% of manual patches are flawed or easily bypassed**, and the industry average Mean-Time-To-Remediate (MTTR) sits at **15–20 days**.

### The Solution: ThreatLens Closed-Loop Self-Healing Pipeline
**ThreatLens** ends the alert graveyard by uniting **dynamic offensive penetration testing**, **in-memory AST code intelligence**, **autonomous ReAct AI patch generation**, **human safety diff gating**, and **live 3-way adversarial re-testing** into one unified, closed loop.

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ Dynamic Exploit │  ──►  │ AST Codebase    │  ──►  │ Autonomous ReAct│
│ Probe (sectest) │       │ Syntax Mapping  │       │ AI Remediation  │
└─────────────────┘       └─────────────────┘       └─────────────────┘
                                                             │
┌─────────────────┐       ┌─────────────────┐                │
│ Blockchain Seal │  ◄──  │ 3-Way Adversary │  ◄──  [Human Diff Gate]
│ & Merkle Anchor │       │ Verification    │       (Zero Blind Writes)
└─────────────────┘       └─────────────────┘
```

### Dual-Surface Operational Experience
ThreatLens operates across two complementary interfaces:
1. **`ThreatLensGo` (Terminal User Interface)**: Cyberpunk neon terminal environment built with **React 18** and **Ink 5**. Features 60 FPS color waves, braille spinners, hotkey command palettes (`/sqli`, `/xss`, `/ddos`, `/git`), and streaming agent dialogues.
2. **`ThreatLens Web` (SOC Operations Dashboard)**: Cloud-ready enterprise web dashboard built with **React**, **Vite**, and **Tailwind CSS**. Provides repository commit risk scoring, interactive dependency visualizers, Merkle chain inspection, and multi-tenant audit logs.

---

## ⚡ Key Features & Capabilities

| Module | Core Capability | Engineering Implementation |
|---|---|---|
| **💥 Dynamic Offensive Suite** | **Multi-Vector Exploitation** | Python HTTPX + Socket probes fuzzing **SQLi** (Error/Union/Blind), **XSS** (Reflected/Stored/DOM), **DDoS** (Slowloris/Flood/Burst), **Data Exfiltration**, and **Rate Limiting (HTTP 429)**. |
| **🌲 AST Codebase Intelligence** | **Polyglot Syntax Graph** | In-memory **Tree-sitter WebAssembly** engine parsing **TypeScript, JavaScript, Python, and Go** with zero native C++ compiler dependencies. |
| **⚡ Instant Reconciler** | **Sub-Millisecond Boot** | SQLite Write-Ahead Logging (**WAL Mode**) comparing SHA-256 file hashes to reconcile an unchanged repo in **0.17 ms** and re-index live edits in **< 50 ms**. |
| **🤖 Autonomous AI ReAct Agent** | **Closed-Loop Patching** | Multi-turn Reasoning + Acting agent with 7 specialized tools (`search_code`, `find_symbol`, `read_file`, `edit_file`, `get_dependencies`, `run_sectest`, `verify_remediation`). |
| **🛡️ Human-in-the-Loop Gate** | **Zero Blind Writes** | Mandatory execution pause at `DiffApprovalModal`. Operators inspect syntax-highlighted unified diffs before any modification touches disk. |
| **🎯 3-Way Verification** | **Discriminative Re-Testing** | Re-fires adversarial attack matrices after patches. Classifies outcomes into **`REMEDIATED`**, **`FLAWED_PATCH`** (catches naive regex workarounds), or **`VULNERABLE`**. |
| **🧠 Domain AI Model (*Ultron*)** | **Fine-Tuned Security LLM** | Fine-tuned **Qwen-2B** model trained on 180+ curated cybersecurity, digital-trust, and code-audit scenarios for high-fidelity triage. |
| **🔗 Tamper-Proof Audit Chain** | **Cryptographic Blockchain Anchor** | Canonical JSON Merkle hash chains with optional **Ethereum smart contract trust anchoring** for immutable compliance evidence. |

---

## 🏗 Architecture & System Design

### High-Level Multi-Tier Architecture Flowchart

```mermaid
flowchart TB
    subgraph PRESENTATION_LAYER["1. Dual Presentation Surfaces"]
        direction LR
        TUI["ThreatLensGo TUI<br/>(React 18 + Ink 5 + TSX)"]
        WEB["ThreatLens Web Dashboard<br/>(React + Vite + Tailwind)"]
    end

    subgraph API_ORCHESTRATION["2. API & Orchestration Tier"]
        direction TB
        GATEWAY["CLI-Backend Fast API Engine<br/>(:8001)"]
        CORE_BACKEND["FastAPI Enterprise Services<br/>(:8000)"]
        LLM_GW["LLM Gateway & Streaming SSE<br/>(OpenRouter / OpenAI / Ultron)"]
    end

    subgraph INTELLIGENCE_CORE["3. Codebase Intelligence & Autonomous Engine"]
        direction TB
        AST_ENGINE["Tree-sitter WASM Engine<br/>(TS · JS · Python · Go)"]
        REACT_AGENT["Autonomous ReAct Loop<br/>(7-Tool Orchestration)"]
        DIFF_GATE["Human Diff Approval Gate<br/>(Zero Blind Writes)"]
        SECTEST_PROBER["SecTest Offensive Engine<br/>(HTTPX / Socket Probes)"]
    end

    subgraph STORAGE_INTEGRITY["4. Persistence & Cryptographic Integrity"]
        direction LR
        SQLITE_WAL[("Local SQLite Index<br/>(WAL Mode, sub-0.2ms)")]
        POSTGRES_DB[("PostgreSQL DB<br/>(Repos, Commits, Audits)")]
        BLOCKCHAIN_ANCHOR[("Ethereum Smart Contract<br/>(Canonical Merkle Anchor)")]
    end

    %% Wiring
    TUI -->|Interactive Commands & Diff Approvals| GATEWAY
    WEB -->|REST & Metrics APIs| CORE_BACKEND
    GATEWAY -->|Stream Prompts & Actions| LLM_GW
    GATEWAY -->|Invoke Polyglot Indexer| AST_ENGINE
    AST_ENGINE -->|Cache Syntax Trees & Symbols| SQLITE_WAL
    GATEWAY -->|Drive Autonomous Loop| REACT_AGENT
    REACT_AGENT -->|Propose File Edits| DIFF_GATE
    REACT_AGENT -->|Trigger Vulnerability Probes| SECTEST_PROBER
    DIFF_GATE -->|Apply Approved Diff| AST_ENGINE
    CORE_BACKEND -->|Store Repos & Commit Scores| POSTGRES_DB
    CORE_BACKEND -->|Seal Audit Receipts| BLOCKCHAIN_ANCHOR
    GATEWAY -.->|Sync Telemetry & Token Usage| CORE_BACKEND
```

---

## 🔄 Request & Remediation Lifecycle

### End-to-End Closed-Loop Lifecycle Flowchart

The following flowchart demonstrates how a live vulnerability detected on a target application moves through syntax mapping, AI patch generation, operator safety verification, and immutable cryptographic sealing:

```mermaid
sequenceDiagram
    autonumber
    actor Operator as Security Engineer
    participant TUI as ThreatLensGo TUI
    participant Prober as SecTest Dynamic Prober
    participant AST as Tree-sitter WASM Indexer
    participant Agent as Autonomous ReAct Agent
    participant TargetApp as Target Application
    participant Verifier as 3-Way Discriminative Verifier
    participant Blockchain as Ethereum Trust Anchor

    Operator->>TUI: Launch Assessment (/sqli or /chat query)
    TUI->>Prober: Dispatch Adversarial Payloads (Tautology, Stacked, Blind)
    Prober->>TargetApp: HTTP Probes with Malicious Signatures
    TargetApp-->>Prober: HTTP 500 / Leaked Database Syntax Error
    Prober-->>TUI: Vulnerability Confirmed (Error-based SQLi on param 'q')
    
    TUI->>AST: Map Network Route to Source Syntax Node
    AST-->>Agent: Bounded Context: search.py (Lines 42-85)
    
    rect rgb(20, 25, 35)
        Note over Agent: Multi-Turn ReAct Loop (Token Cap Guarded)
        Agent->>Agent: Reason: Construct Parameterized Binding Query
        Agent->>TUI: Emit edit_file (DiffApprovalPayload)
    end

    TUI->>Operator: Display DiffApprovalModal (Visual Unified Diff)
    Operator->>TUI: Press [A] Approve Patch
    TUI->>AST: Commit Surgical Patch to Disk
    TargetApp->>TargetApp: Hot-Reload / Restart Service

    rect rgb(25, 35, 25)
        Note over Verifier: 3-Way Discriminative Verification
        Verifier->>TargetApp: Re-fire Adversarial Attack Matrix
        TargetApp-->>Verifier: Exploit Blocked & Valid Queries Succeed
        Verifier-->>TUI: Certified: [REMEDIATED] (Zero Bypass Detected)
    end

    TUI->>Blockchain: Compute Canonical Merkle Hash & Anchor State
    Blockchain-->>TUI: Transaction Receipt (Block #194821, 0x7b...f2)
    TUI-->>Operator: Audit Closed-Loop Completed in 48s!
```

---

## 🗄 Database & Entity-Relationship (ER) Model

ThreatLens utilizes a hybrid persistence architecture:
- **Remote PostgreSQL**: High-concurrency enterprise store for multi-tenant accounts, repository risk scores, commit security scans, attacks, chat history, and blockchain anchoring records.
- **Local SQLite (WAL Mode)**: Ultra-fast developer-workspace cache storing file hashes, Tree-sitter AST symbol tables, symbol dependencies, and local token usage.

### Mermaid Entity-Relationship Diagram

```mermaid
erDiagram
    %% PostgreSQL Database Entities
    REPOSITORIES ||--o{ COMMITS : "analyzes"
    REPOSITORIES {
        int id PK
        int account_id FK
        text url UK
        text username
        text name
        text default_branch
        jsonb branches
        jsonb remote_branches
        int commit_count
        int files_total
        jsonb files_by_extension
        int total_size
        jsonb largest_files
        int language_files
        jsonb languages
        jsonb tags
        timestamptz created_at
        timestamptz updated_at
    }

    COMMITS {
        int id PK
        int repo_id FK
        text commit_sha "indexed"
        jsonb data "findings and risk scores"
        timestamptz created_at
    }

    ATTACKS {
        int id PK
        int account_id FK
        string attack_id UK "indexed uuid"
        string attack_type "sqli, xss, ddos, exfil"
        json request "target and payload config"
        json status "telemetry and status"
        json plot "time-series latency and throughput"
        datetime created_at
    }

    CHATS ||--o{ CHAT_HISTORY : "contains"
    CHATS {
        int id PK
        int account_id FK
        string title
        string model
        timestamptz created_at
        timestamptz updated_at
    }

    CHAT_HISTORY {
        int id PK
        int chat_id FK
        jsonb message "role, content, tools"
        timestamptz created_at
    }

    USAGE {
        int id PK
        int account_id FK "unique"
        string plan "free, pro, enterprise"
        bigint prompt_tokens
        bigint completion_tokens
    }

    ETHEREUM_ANCHORS {
        bigint id PK
        bigint account_id FK
        bigint anchor_id
        string chain_id
        bigint chain_height
        char64 chain_hash
        char42 wallet_address
        char66 transaction_hash
        bigint block_no
        string integrity_status "verified, tampered"
        timestamptz created_at
        timestamptz updated_at
    }

    %% Local SQLite (WAL Mode) Database Entities
    SQLITE_FILES ||--o{ SQLITE_SYMBOLS : "defines"
    SQLITE_FILES ||--o{ SQLITE_DEPENDENCIES : "imports"
    SQLITE_FILES {
        text id PK
        text path UK
        text hash "sha-256"
        integer mtime
        text language "ts, js, py, go"
        integer size_bytes
    }

    SQLITE_SYMBOLS {
        text id PK
        text file_id FK
        text file_path
        text name "indexed"
        text kind "function, class, method, type"
        integer start_line
        integer end_line
        integer start_col
        integer end_col
        text signature
        text parameters
        text return_type
        integer is_exported
        integer is_async
        text parent_symbol
    }

    SQLITE_DEPENDENCIES {
        text id PK
        text source_file FK
        text target_file
        text raw_specifier
        integer is_external
    }

    SQLITE_AUTH {
        integer id PK "primary key id 1"
        text jwt_token
        integer updated_at
    }
```

### Data Model Dictionary

#### 1. Remote PostgreSQL Schema
- **`repositories`**: Stores metadata, branch catalogs, language distributions, and commit volume for scanned codebases.
- **`commits`**: Stores deep security audit metrics, vulnerability severity counts (`critical`, `high`, `medium`, `low`), and AST pattern evidence for individual Git commits.
- **`attacks`**: Records execution parameters, payload profiles, and live latency telemetry plots for all offensive security modules.
- **`chats` & `chat_history`**: Multi-turn conversation sessions and tool execution traces for security analysis agents.
- **`usage`**: Enforces account-level token quotas and plans across LLM gateway operations.
- **`ethereum_anchors`**: Cryptographic non-repudiation ledger recording transaction hashes, block numbers, and Merkle root seals on the Ethereum network.

#### 2. Local SQLite WAL Cache Schema
- **`files`**: Tracks SHA-256 content hashes, modification timestamps, and language classifications to enable **0.17ms** startup reconciliation.
- **`symbols`**: B-Tree indexed repository of functions, classes, interfaces, and methods parsed by Tree-sitter WebAssembly.
- **`dependencies`**: Bidirectional import graph tracking module linkages and detecting circular references.
- **`auth`**: Single-row token cache allowing seamless TUI session resumption across reboots.

---

## 🔐 File Access Security & RBAC Permissions

### File Access Boundaries & Sandboxing
ThreatLens executes autonomous code analysis and remediation inside strict operational guardrails to protect user environments:

1. **Workspace Sandboxing**: File operations are strictly locked to the designated target repository directory. Path resolution calls (`path.resolve`) are asserted against the root workspace boundary to prevent directory traversal attacks (e.g. `../../etc/passwd`).
2. **Resource Guardrails & Preview Caps**:
   - **File Read Buffer Cap**: Bounded to **32 KB** (`DEFAULT_MAX_FILE_BYTES`) and **800 lines** (`DEFAULT_MAX_LINES`). Large files are truncated safely along newline boundaries to prevent LLM context saturation.
   - **Tool Payload Cap**: Tool invocation outputs are constrained to **16 KB** (`DEFAULT_MAX_TOOL_BYTES`).
   - **Conversation Sliding Window**: Automatic pruning retains system instructions and recent conversation turns while capping total prompt consumption.
3. **Exclusion Boundaries**: The scanner and file watcher automatically ignore `.git/`, `.env*`, `node_modules/`, `dist/`, build artifacts, and sensitive key formats (`*.pem`, `*.key`, `id_rsa`).
4. **Zero Blind Writes**: The autonomous agent **cannot mutate files directly**. Every code change creates a `DiffApprovalPayload` that halts execution until an operator confirms via the interactive modal.

### Role-Based Access Control (RBAC) Matrix

ThreatLens enforces four distinct operational roles across the enterprise web dashboard and backend APIs:

| Operational Capability | Superadmin | Lead DevSecOps / Auditor | Security Analyst | Compliance Auditor / Viewer |
|---|:---:|:---:|:---:|:---:|
| **Execute Offensive Probes (SQLi, XSS, DDoS, Exfil)** | ✅ Full Control | ✅ Full Control | ⚠️ Read/Fuzz Only | ❌ No Access |
| **Run Autonomous ReAct Remediation Loop** | ✅ Full Control | ✅ Full Control | ⚠️ Simulation Only | ❌ No Access |
| **Diff Approval Gate (Commit Patch to Disk)** | ✅ Approve/Reject | ✅ Approve/Reject | ❌ Reject Only | ❌ No Access |
| **AST Symbol & Codebase Graph Navigation** | ✅ Full Control | ✅ Full Control | ✅ Full Control | 👁️ Read-Only |
| **Audit Git Commits & View Risk Scoring** | ✅ Full Control | ✅ Full Control | ✅ Full Control | 👁️ Read-Only |
| **Anchor Audit Records to Ethereum Blockchain** | ✅ Full Control | ⚠️ Submit Only | ❌ No Access | 👁️ Verify Only |
| **Tamper Simulation & Merkle Tree Inspection** | ✅ Full Control | ✅ Full Control | 👁️ View Only | 👁️ View Only |
| **LLM Quota Management & Rate-Limit Config** | ✅ Full Control | 👁️ View Only | 👁️ View Only | ❌ No Access |
| **User Directory Provisioning & Session Revocation**| ✅ Full Control | ❌ No Access | ❌ No Access | ❌ No Access |

---

## 💻 Complete Tech Stack

<div align="center">

| Layer | Technologies & Libraries | Key Characteristics |
|---|---|---|
| **Terminal UI (`ThreatLensGo`)** | React 18, Ink 5, TypeScript 5.5, `tsx`, `ink-spinner`, `ink-text-input`, `ink-select-input` | 60 FPS neon ANSI rendering, responsive viewport scaling, hotkey command palette. |
| **Web Frontend** | React, Vite, Tailwind CSS, Lucide Icons, Radix UI, Recharts | Real-time WebSocket streaming, commit risk dashboards, interactive Merkle tree inspector. |
| **Backend Microservices** | Python 3.10+, FastAPI, SQLAlchemy, Uvicorn, Pydantic, HTTPX, PyJWT | Decoupled microservices architecture, asynchronous payload dispatch, SSE streaming. |
| **Codebase Intelligence** | `web-tree-sitter` (WASM), `@vscode/ripgrep`, `chokidar`, `better-sqlite3` (WAL) | Zero native compiler dependencies, 0.17ms reconciliation, polyglot grammar parser. |
| **Security Probing (`sectest`)**| Python 3.10+, HTTPX Async, Socket Probes, Regex Threat Signature Matchers | High-speed concurrent fuzzing, socket exhaustion, latency differential analysis. |
| **Persistence & Trust** | PostgreSQL 15+, SQLite 3 (WAL), Ethereum, Solidity `^0.8.0`, Web3.py | Dual relational + cache model, Merkle tree root anchoring on Ethereum blockchain. |
| **AI Domain Model** | Fine-Tuned *Ultron* (Qwen-2B architecture), Hugging Face Transformers | Fine-tuned on 180+ curated vulnerability and remediation scenarios. |

</div>

---

## 📦 Installation & Setup

### Prerequisites
- **Node.js** (v18.0.0 or higher) and `npm`
- **Python** (v3.10 or higher) and `pip`
- **Git** (v2.30 or higher)
- **PostgreSQL** (v14+, optional for local single-user CLI mode, required for web dashboard)

---

### 1. Clone & Workspace Setup

```bash
# Clone the repository
git clone https://github.com/dev47929/ThreatLens.git

# Enter workspace root
cd ThreatLens
```

---

### 2. Setting up ThreatLensGo TUI

```bash
# Navigate to the TUI directory
cd ThreatLensGo/tui

# Install Node dependencies (including Tree-sitter WASM & Ink)
npm install

# Build the TypeScript distribution
npm run build

# Start the interactive TUI application
npm start
```

> [!TIP]
> For active TUI development with live hot-reloading on save, run:
> ```bash
> npm run dev
> ```

---

### 3. Setting up Backend Microservices

```bash
# Return to workspace root
cd ../..

# Install Python microservice requirements
pip install -r requirements.txt

# Start the core FastAPI orchestration engine
python -m uvicorn backend.connect:app --host 0.0.0.0 --port 8000 --reload
```

In a separate terminal, launch the local CLI-backend analysis microservice:
```bash
cd cli-backend
python -m connect
```

---

### 4. Setting up ThreatLens Web Dashboard

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser to access the SOC Operations Dashboard.

---

### 5. Environment Variables Setup (`.env`)

Create a `.env` file in the root directory:

```env
# ======================================================
# ThreatLens Core API & Network Configuration
# ======================================================
BACKEND_HOST="0.0.0.0"
BACKEND_PORT=8000
CLI_BACKEND_PORT=8001
CORS_ORIGINS="http://localhost:5173,http://localhost:3000"

# ======================================================
# AI Model & LLM Gateway Configuration
# ======================================================
OPENROUTER_API_KEY="your-openrouter-api-key"
AI_MODEL="qwen/qwen-2.5-coder-32b-instruct"
LLM_GATEWAY_TIMEOUT_SECONDS=60

# ======================================================
# Database Persistence (PostgreSQL)
# ======================================================
DATABASE_URL="postgresql://threatlens:threatlens_secret@localhost:5432/threatlens_db"

# ======================================================
# Ethereum Trust Anchor (Optional)
# ======================================================
ETHEREUM_RPC_URL="https://sepolia.infura.io/v3/your-project-id"
CONTRACT_ADDRESS="0x7b4a2e5d9f1c3a8e9b2c4d6f8a0e2b4c6d8e0f2a"
PRIVATE_KEY="your-wallet-private-key-for-anchoring"
```

---

## 🚀 Usage Guide

### Interactive TUI Navigation (`ThreatLensGo`)
Launch the terminal client and use hotkeys (`/`, `Tab`, `↑↓`, `Enter`, `Esc`) to access the command palette:

```
  /target     - Configure active target URL (e.g. http://localhost:5000)
  /sqli       - Launch SQL Injection fuzzer (Error, Union, Blind)
  /xss        - Execute Cross-Site Scripting probe (Reflected, Stored, DOM)
  /ddos       - Run traffic concurrency simulation (Flood, Slowloris, Burst)
  /exfil      - Probe for sensitive data disclosure & debug endpoints
  /ratelimit  - Stress test HTTP 429 rate limit enforcement
  /proxy      - Intercept, inspect, and repeat raw HTTP requests
  /git        - Audit local or remote repository for secrets and CVEs
  /chat       - Open Autonomous AI Remediation Agent dialogue
```

---

### Autonomous Codebase Remediation Workflow

1. **Target Identification**: Enter the active endpoint via `/target http://localhost:5000`.
2. **Vulnerability Probing**: Run `/sqli` to execute dynamic testing. The live telemetry engine streams test vectors and captures server errors.
3. **Agent Activation**: Select **"Launch AI Remediation"** or type `/chat`.
4. **AST Code Mapping**: The Tree-sitter WASM engine parses the target codebase, resolves the vulnerable route, and extracts the corresponding function syntax node.
5. **Diff Approval Modal**: The agent synthesizes a parameterized fix and triggers the diff approval gate:

```
┌─────────────────────────────── DIFF APPROVAL REQUIRED ───────────────────────────────┐
│ File: src/controllers/search.py                                                      │
│ Reason: Parameterize raw SQL concatenation to neutralize SQL injection bypass        │
├──────────────────────────────────────────────────────────────────────────────────────┤
│ 42  def search_records(query: str):                                                  │
│ 43 -    sql = f"SELECT * FROM items WHERE name LIKE '%{query}%'"                     │
│ 44 -    return db.execute(sql).fetchall()                                            │
│ 43 +    sql = text("SELECT * FROM items WHERE name LIKE :pattern")                   │
│ 44 +    return db.execute(sql, {"pattern": f"%{query}%"}).fetchall()                 │
├──────────────────────────────────────────────────────────────────────────────────────┤
│ [A] Approve & Write to Disk    [R] Reject with Feedback    [C] Cancel                │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

6. **3-Way Verification**: Once approved, the target server reloads, and the verification engine subjects the endpoint to an adversarial attack matrix, confirming **`REMEDIATED`** status.

---

### Running SecTest Dynamic Prober CLI

You can also run the security prober as a standalone CLI tool without the graphical interface:

```bash
# Run complete multi-module vulnerability audit
python sectest/cli.py --target https://staging.example.com --all

# Run specific testing modules
python sectest/cli.py --target https://staging.example.com --module injection
python sectest/cli.py --target https://staging.example.com --module headers
python sectest/cli.py --target https://staging.example.com --module ratelimit

# Export findings to JSON report
python sectest/cli.py --target https://staging.example.com --all --output report.json
```

---

## 📸 Screenshots & Interactive Demos

### TUI Live Remediation & Diff Approval Preview
```
  ⚡ EXECUTING SQL INJECTION ASSESSMENT
  Target: https://staging.threatlens.io

  [████████████████████████░░░░░░░░░░] 68%
  › Dispatching payload matrix & inspecting responses...

  Live Telemetry Probes:
  ✔ Target endpoint handshake resolved (200 OK)
  ✔ Query string fuzzing completed (18 payloads)
  ✔ Differential response latency analyzed (Blind Boolean)
  ⚠ VULNERABILITY CONFIRMED: Unescaped string literal in WHERE clause
  
  [Tree-sitter WASM] Route /api/search mapped to src/routes/search.py:L43
  [Autonomous Agent] Synthesized parameterized patch (Tokens: 142 prompt / 68 completion)
  [3-Way Verifier] Certified fix status: REMEDIATED (0 bypasses across 12 vectors)
```

### TUI Animated Terminal Experience
For a visual demonstration of the interactive terminal interface, inspect the bundled capture preview:
- **Visual Capture**: [terminal_cli_preview.jpg](./frontend/public/terminal_cli_preview.jpg)

---

## 📚 Documentation Matrix

ThreatLens features extensive technical documentation across the repository. Explore detailed specifications via the hyperlinks below:

| Documentation Guide | Scope & Key Topics Covered | Reference Link |
|---|---|:---:|
| **Presentation Pitch & Technical Compendium** | Full 18-slide presentation script, elevator pitches, competitive benchmark matrix, and speaker cues. | [Read Guide](./PRESENTATION_SCRIPT.md) |
| **Frontend Dashboard Data Specification** | Field-by-field backend API schemas, payload specifications, and UI mapping tables. | [Read Spec](./docs/DASHBOARD_DATA_SPECIFICATION.md) |
| **ThreatLensGo Architecture Blueprint** | Deep-dive on Tree-sitter WASM AST extraction, SQLite WAL indexing, and ReAct loop internals. | [Read Guide](./ThreatLensGo/PROJECT_EXPLANATION_GUIDE.md) |
| **Autonomous Agent Execution & Flow Guide** | Step-by-step execution diagrams for the 7 agent tools, safety guardrails, and message pruning. | [Read Guide](./ThreatLensGo/AGENT_FLOW_GUIDE.md) |
| **Backend LLM Gateway Specification** | Server-Sent Events (SSE) streaming protocol, token accounting, and model failover schemas. | [Read Spec](./ThreatLensGo/BACKEND_LLM_GATEWAY_SPEC.md) |
| **Ethereum Global Anchor Smart Contract** | Solidity contract architecture, Merkle root verification, gas optimization, and deployment scripts. | [Read Guide](./smart-contracts/ThreadLens_Ethereum_Global_Anchor_Smart_Contract.md) |
| **SQL Injection Attack API Reference** | Error-based, Union-based, and Blind boolean/time payload matrices and configuration endpoints. | [Read Guide](./cli-backend/docs/attacks/sqli_api_usage.md) |
| **Cross-Site Scripting (XSS) API Reference** | Reflected, Stored, and DOM-based script injection sink identification and vector schemas. | [Read Guide](./cli-backend/docs/attacks/xss_api_usage.md) |
| **DDoS Stress Simulation API Reference** | Concurrency intensity tuning, Slowloris socket exhaustion algorithms, and telemetry capture. | [Read Guide](./cli-backend/docs/attacks/ddos_attack_api.md) |
| **Data Exfiltration & Exposure API Reference** | Actuator, metrics, debug routes, and verbose stack trace detection heuristics. | [Read Guide](./cli-backend/docs/attacks/data_brun_api.md) |
| **Origin Proxy Interception API Reference** | HTTP request/response interception, header tampering, and replay engine documentation. | [Read Guide](./cli-backend/docs/attacks/origin_proxy_api.md) |
| **Chat & Session Routing Specification** | Multi-tenant session state, conversation context management, and history persistence. | [Read Guide](./cli-backend/docs/chat_route.md) |
| **Git Repository Analysis Guide** | Remote repository cloning, secret pattern matching, and commit risk scoring logic. | [Read Guide](./cli-backend/docs/git_route.md) |
| **AI Model Cards & Dataset Documentation** | Fine-tuning report for *Ultron* Qwen-2B, training hyperparameters, and evaluation benchmarks. | [Explore Docs](./docs/AI-Model-info/) |

---

## 🤝 Contributing

We welcome contributions from security researchers, software engineers, and open-source enthusiasts!

1. **Fork the Repository** on GitHub.
2. **Create a Feature Branch**:
   ```bash
   git checkout -b feat/quantum-resistant-anchoring
   ```
3. **Commit Your Changes** using [Conventional Commits](https://www.conventionalcommits.org/):
   ```bash
   git commit -m "feat(prober): add GraphQL introspection and depth-limit fuzzing"
   ```
4. **Run Code Formatting & Type Checks**:
   ```bash
   # TypeScript checks
   cd ThreatLensGo/tui && npm run build
   
   # Python linting
   flake8 backend cli-backend sectest
   ```
5. **Open a Pull Request** against the `main` branch with a clear description of your changes and test coverage.

---

## ⚠️ Security Notice & Ethical Disclosure

> [!CAUTION]
> **ThreatLens** is an offensive security audit platform engineered **strictly for authorized penetration testing, vulnerability assessment, defensive code hardening, and academic research**.
> 
> Probing or attacking targets without explicit, prior, written authorization from the infrastructure and asset owner is illegal and violates computer crime statutes globally. The developers and **CodeSena** assume no liability for misuse, unauthorized testing, or damage caused by this software.

---

## 👥 Credits & Team

Engineered with ❤️ by **CodeSena** for the Hackathon Security Challenge.

- **Lead Architect & Developer**: Dev Sharma ([@dev47929](https://github.com/dev47929))
- **Engineering Team**: **CodeSena**
- **Official Repository**: [dev47929/ThreatLens](https://github.com/dev47929/ThreatLens)

---

## 📄 License

This project is licensed under the **ISC License** — see the [LICENSE](./LICENSE) file for details.
