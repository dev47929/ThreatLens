# AGENTS.md — ThreatLens Project Context & AI Agent Guidelines

> **Next-Generation Autonomous Offensive Security, AST Codebase Intelligence & Tamper-Proof Audit Platform**
> *From Dynamic Exploit Probe to Verified Source Code Patch in < 60 Seconds.*

---

## 1. Project Overview & Architecture

ThreatLens combines dynamic penetration testing, in-memory Abstract Syntax Tree (AST) code intelligence, autonomous ReAct AI patch generation, human-in-the-loop diff approvals, and 3-way adversarial re-testing into a closed-loop security remediation workflow.

### Dual Presentation Surfaces
1. **ThreatLensGo (TUI)**: Terminal user interface built with **React 18 + Ink 5 + TypeScript**. Real-time SSE streaming, hotkey command palettes (`/sqli`, `/xss`, `/ddos`, `/git`), interactive diff approvals, and terminal dashboards.
2. **ThreatLens Web Dashboard**: Modern enterprise web app built with **React, Vite, and Tailwind CSS**. Features risk scoring, interactive dependency visualization, Merkle audit chain verification, and SOC team reports.

### Multi-Tier System Topology
```
┌────────────────────────────────────────────────────────┐
│               PRESENTATION / CLIENT TIER                │
│  - ThreatLensGo TUI (React 18 + Ink 5 in TypeScript)   │
│  - ThreatLens Web (React + Vite + Tailwind CSS)        │
└───────────────┬────────────────────────┬───────────────┘
                │                        │
                ▼                        ▼
┌───────────────────────────┐  ┌─────────────────────────┐
│     CLI BACKEND (FastAPI) │  │  ENTERPRISE BACKEND     │
│       Port: :8001         │  │       Port: :8000       │
│  - AST Code Indexing      │  │  - Auth (OAuth / JWT)   │
│  - ReAct Autonomous Agent │  │  - Git Repository Sync  │
│  - Dynamic Probers        │  │  - Site Management     │
│  - SQLite WAL Cache Engine│  │  - Blockchain Audits    │
└───────────────┬───────────┘  └─────────────┬───────────┘
                │                            │
                ▼                            ▼
┌───────────────────────────┐  ┌─────────────────────────┐
│  EXTERNAL SERVICES & LLM  │  │ DATA & AUDIT STORE      │
│  - LLM Gateway (OpenRouter│  │ - PostgreSQL (Primary)  │
│    / OpenAI / Anthropic / │  │ - SQLite WAL (AST cache)│
│    Ultron Fine-Tuned LLM) │  │ - Ethereum Smart Contract│
│  - Dynamic Fuzzing Probers│  │   (Merkle Root Anchor)  │
└───────────────────────────┘  └─────────────────────────┘
```

---

## 2. Directory Structure & Key Modules

| Path | Purpose & Tech Stack |
|---|---|
| `d:/dev/ThreatLens/frontend/` | React (Vite, Tailwind CSS, Lucide icons, Recharts) web dashboard for security monitoring and audit visualizations. |
| `d:/dev/ThreatLens/backend/` | Primary FastAPI backend service (port `8000`). Manages auth, site scans, git repos, security chat, and blockchain audit logs. |
| `d:/dev/ThreatLens/cli-backend/` or `ThreatLensGo/cli-backend/` | FastAPI autonomous orchestration backend (port `8001`). Houses the AST parser (Tree-sitter WASM), SQLite WAL cache, ReAct Agent engine, and dynamic exploit runners. |
| `d:/dev/ThreatLens/ThreatLensGo/tui/` | Ink/React terminal application providing cyber-themed terminal control, live tool executions, and interactive diff approvals. |
| `d:/dev/ThreatLens/sectest/` | Dynamic offensive test suite and probers (SQLi, XSS, DDoS, Rate Limiting, Data Exfil). |
| `d:/dev/ThreatLens/smart-contracts/` | Solidity smart contracts for decentralized tamper-proof security audit anchoring. |
| `d:/dev/ThreatLens/docs/` | System specifications, flow diagrams, API specs, and presentations. |

---

## 3. Core Capabilities & Workflows

### A. Dynamic Exploit Probe (`sectest`)
- Probes target endpoints with real HTTP/socket vectors: SQLi (Error/Union/Blind), XSS (Reflected/Stored/DOM), DDoS (Slowloris/Flood), and Rate Limit validation.
- Emits structured vulnerability telemetry (`VulnerabilityReport`: payload, target URL, parameter, evidence, severity).

### B. AST Codebase Intelligence
- Uses **Tree-sitter WebAssembly** bindings to parse TypeScript, JavaScript, Python, and Go codebases in-memory.
- SQLite with **WAL (Write-Ahead Logging)** mode stores file hash manifests and symbol tables, enabling re-indexing in `< 50ms`.

### C. ReAct Autonomous Patching Agent
- Uses iterative Reasoning + Acting loops with 7 core tools:
  1. `search_code`: Search code patterns across the indexed workspace.
  2. `find_symbol`: Look up classes, functions, handlers, and types.
  3. `read_file`: Inspect target file lines with AST awareness.
  4. `edit_file`: Stage targeted, syntax-valid source code patches.
  5. `get_dependencies`: Trace imported symbols and internal call graphs.
  6. `run_sectest`: Execute dynamic validation against local endpoints.
  7. `verify_remediation`: Run 3-way adversarial verification.

### D. Human-in-the-Loop Diff Approval Gate
- **Zero blind writes**: Before any edit is applied to disk, the agent yields a unified diff modal.
- The operator reviews additions/deletions and explicitly approves or rejects the change in TUI or Web.

### E. 3-Way Adversarial Re-Testing
- After patch application, re-runs original and mutated exploit matrices to classify:
  - `REMEDIATED`: Exploit blocked, functional baseline preserved.
  - `FLAWED_PATCH`: Superficial regex or partial patch bypassed by polymorphic payload.
  - `VULNERABLE`: Attack still succeeds.

### F. Tamper-Proof Audit Chain & Blockchain Anchoring
- Canonical JSON Merkle root computation over vulnerability logs and approved patches.
- Optional anchoring on Ethereum smart contracts (`AuditAnchor.sol`) for non-repudiation.

---

## 4. Development & Running Guidelines

### Environment Requirements
- **Node.js**: v18+ / npm
- **Python**: 3.10+ / `uv` or `pip` / `virtualenv`
- **Go**: (Optional if building Go AST/services)

### Standard Ports & Endpoints
- **Web Frontend**: `http://localhost:5173` (or Vite default)
- **Core Backend**: `http://localhost:8000` (FastAPI)
- **CLI Backend / Agent Engine**: `http://localhost:8001` (FastAPI)

### Common Commands
- **Frontend**:
  ```bash
  cd frontend
  npm install
  npm run dev
  ```
- **ThreatLensGo TUI**:
  ```bash
  cd ThreatLensGo/tui
  npm install
  npm run dev
  ```
- **CLI Backend (Agent & AST Engine)**:
  ```bash
  cd ThreatLensGo/cli-backend
  python -m venv venv
  .\venv\Scripts\activate  # Windows
  pip install -r requirements.txt
  uvicorn api.main:app --port 8001 --reload
  ```
- **Core Backend**:
  ```bash
  cd backend
  python -m venv venv
  .\venv\Scripts\activate  # Windows
  pip install -r requirements.txt
  python run.py
  ```

---

## 5. Instructions for AI Coding Agents

1. **Safety & Diff Integrity**:
   - Never write unchecked code directly when acting as a remediation engine. Always format patches cleanly and ensure unified diff compatibility.
   - Avoid destructive file modifications outside specified target repositories.
2. **Codebase Conventions**:
   - Python code uses **FastAPI**, **Pydantic v2**, **HTTPX**, and **SQLAlchemy/Aiosqlite**.
   - Frontend and TUI use **TypeScript**, **React 18**, functional components, and strict typing.
   - Follow clean architecture: separate API routers, services, schemas, and database adapters.
3. **Environment Variables**:
   - Refer to `.env.example` across `backend/`, `cli-backend/`, and `ThreatLensGo/cli-backend/` when introducing new configuration flags or API keys (e.g., `OPENROUTER_API_KEY`, `OPENAI_API_KEY`, `ULTRON_MODEL_PATH`).
