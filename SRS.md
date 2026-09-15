# ThreatLens — Software Requirements Specification (SRS)
**Document Version:** 1.0.0  
**Standard:** IEEE 830 / ISO/IEC/IEEE 29148 Compliant  
**Status:** Approved  
**Classification:** Enterprise Security Software  

---

## 1. Introduction

### 1.1 Purpose
This Software Requirements Specification (SRS) establishes the complete functional, non-functional, interface, and security requirements for **ThreatLens** — an autonomous offensive security testing, AST-level codebase intelligence, and tamper-proof audit platform.

### 1.2 Scope
ThreatLens bridges dynamic black-box/gray-box application security testing (DAST) with static/abstract syntax tree (AST) source code intelligence and autonomous AI remediation (ReAct agent loop). It autonomously discovers vulnerabilities (SQLi, XSS, IDOR, Secret Leaks, CORS misconfigurations, DDoS resilience), pinpoints vulnerable source nodes in multi-language codebases (Python, JavaScript, TypeScript, Go), drafts unified diff patches, enforces human-in-the-loop approvals, verifies patches via 3-way adversarial validation, and cryptographically commits tamper-proof audit trails with optional Ethereum Merkle root anchoring.

### 1.3 Definitions, Acronyms, and Abbreviations
- **AST:** Abstract Syntax Tree.
- **DAST:** Dynamic Application Security Testing.
- **SAST:** Static Application Security Testing.
- **ReAct:** Reasoning + Acting agent architecture.
- **WAL:** Write-Ahead Logging (SQLite persistence mode).
- **CWE:** Common Weakness Enumeration.
- **CVE:** Common Vulnerabilities and Exposures.
- **SSE:** Server-Sent Events.
- **TUI:** Terminal User Interface (React 18 + Ink 5).
- **HITL:** Human-in-the-Loop.
- **Merkle Root:** Cryptographic hash accumulator representing an audit epoch.

### 1.4 System Overview & Architectural Precedence
The platform comprises five primary subsystems:
1. **ThreatLens Web Dashboard**: React + Vite + Tailwind CSS graphical interface.
2. **ThreatLensGo (TUI)**: Ink 5 / React terminal application for security operators and CLI environments.
3. **Core Enterprise Backend (FastAPI, Port 8000)**: Authentication, RBAC, repository sync, scan orchestration, and Merkle audit tracking.
4. **CLI Agent Engine & AST Service (FastAPI, Port 8001)**: In-memory Tree-sitter WASM parser, SQLite WAL symbol indexer, and 7-tool ReAct agent.
5. **Dynamic Exploit Runner (`sectest`)**: High-throughput fuzzing and exploit payload validation matrix.

---

## 2. Overall Description

### 2.1 Product Perspective
ThreatLens operates as a self-contained DevSecOps and Autonomous SOC remediation suite. It sits between Developer Git Repositories and Production/Staging Web Applications:

```
[Target Web Application] ◄── Dynamic Probers (sectest) ───┐
                                                          │
[Source Code Repositories] ──► AST Parser (Tree-sitter) ──┼──► [ReAct Remediation Engine]
                                                          │        │
[Security Operators] ◄──── TUI & Web Approvals (HITL) ────┘        ▼
                                                              [Verified Diff Patch]
                                                                   │
                                                                   ▼
                                                       [Merkle Audit Blockchain]
```

### 2.2 User Characteristics & Personas
- **AppSec Engineer / Penetration Tester**: Executes targeted vector exploits, reviews agent reasoning traces, inspects AST graphs, and verifies patch validity.
- **DevSecOps Engineer**: Integrates automated repository monitoring, sets up CI/CD webhooks, and monitors posture drift.
- **Software Developer**: Receives syntax-safe pull request patches with explanation breakdowns and reproduces vulnerabilities locally.
- **Compliance / SOC Lead**: Audits cryptographic tamper-proof logs, exports compliance attestations, and validates zero-blind-write integrity.

### 2.3 Operating Environment
- **Server Runtime**: Linux (Ubuntu 22.04+), macOS (ARM64/x86_64), or Windows (PowerShell/WSL2).
- **Python Environment**: Python 3.10, 3.11, or 3.12.
- **Node.js Environment**: Node.js v18.0.0+ LTS, npm 9+.
- **Browser Compatibility**: Chromium 110+, Firefox 110+, Safari 16+, Edge 110+.
- **Database Support**: PostgreSQL 14+ (Production) / SQLite 3.38+ with WAL mode (Local/Edge).

### 2.4 Design and Implementation Constraints
1. **Zero Blind Writes**: The autonomous agent MUST NOT commit code modifications directly without explicit operator approval via Web UI or TUI diff modal.
2. **Deterministic Remediation**: Patches must pass AST validation without syntax regressions.
3. **Low Latency Code Re-indexing**: Incremental symbol cache updates must complete in `< 50ms`.
4. **Adversarial Verification**: Every proposed patch must undergo 3-way adversarial re-testing before being marked `REMEDIATED`.

---

## 3. Specific System Features & Functional Requirements

### 3.1 Dynamic Exploit Probing & Fuzzing (Module: `sectest`)
- **FR-SEC-01**: System shall probe target endpoints for SQL Injection (Error-based, Union-based, Boolean Blind, and Time-based Blind).
- **FR-SEC-02**: System shall probe for Cross-Site Scripting (Reflected, Stored, and DOM-based XSS vectors).
- **FR-SEC-03**: System shall evaluate DDoS resilience (Slowloris attacks, concurrent HTTP floods, payload amplification).
- **FR-SEC-04**: System shall test Rate Limiting boundaries and report token bucket exhaustion thresholds.
- **FR-SEC-05**: System shall output structured `VulnerabilityReport` schemas containing target URL, injection parameter, payload string, HTTP status, and evidence excerpt.

### 3.2 In-Memory AST Codebase Intelligence (Module: `ast-engine`)
- **FR-AST-01**: System shall parse Python, TypeScript, JavaScript, and Go codebases into Abstract Syntax Trees using Tree-sitter WASM bindings.
- **FR-AST-02**: System shall extract symbol hierarchies (functions, classes, route decorators, SQL queries, middleware).
- **FR-AST-03**: System shall maintain a SQLite WAL-backed symbol cache indexed by SHA-256 file hashes.
- **FR-AST-04**: Incremental file modification updates shall invalidate and re-index affected AST branches in `< 50ms`.
- **FR-AST-05**: System shall provide call-graph tracing from public endpoints down to vulnerable data sinks.

### 3.3 Autonomous ReAct Remediation Agent (Module: `agent-engine`)
- **FR-AGT-01**: The agent shall execute an iterative ReAct (Thought → Action → Observation) decision loop.
- **FR-AGT-02**: The agent shall have access to 7 discrete tools:
  1. `search_code`: Search lexical and structural patterns.
  2. `find_symbol`: Retrieve symbols, function declarations, and class signatures.
  3. `read_file`: Inspect targeted line ranges with AST scope context.
  4. `edit_file`: Generate unified diff patches for target files.
  5. `get_dependencies`: Trace symbol imports and caller hierarchies.
  6. `run_sectest`: Run localized dynamic validation vectors.
  7. `verify_remediation`: Execute 3-way adversarial validation suite.
- **FR-AGT-03**: System shall stream thoughts, tool calls, and tool outputs in real-time via Server-Sent Events (SSE).
- **FR-AGT-04**: Agent loop shall terminate upon verification success or after reaching configurable maximum step limits (default: 15 steps).

### 3.4 Human-in-the-Loop Diff Approval Gate (Module: `hitl-gate`)
- **FR-HITL-01**: Proposed file edits shall be rendered in a unified diff format highlighting exact additions and deletions.
- **FR-HITL-02**: Operator shall be presented with `Approve`, `Reject`, and `Modify Request` actions.
- **FR-HITL-03**: Approved diffs shall be applied atomically to disk with rollback backup creation.

### 3.5 3-Way Adversarial Verification (Module: `verifier`)
- **FR-VER-01**: Post-patch validation must execute the original exploit payload.
- **FR-VER-02**: Validation must execute mutated polymorphic payloads to detect superficial regex/sanitization bypasses.
- **FR-VER-03**: System shall execute baseline benign functional tests to ensure zero application regression.
- **FR-VER-04**: Output status must strictly resolve to:
  - `REMEDIATED`: All exploits blocked and benign functionality intact.
  - `FLAWED_PATCH`: Exploit blocked on original vector but bypassed by mutation.
  - `VULNERABLE`: Original exploit continues to succeed.

### 3.6 Cryptographic Audit Chain & Merkle Anchoring (Module: `audit-chain`)
- **FR-AUD-01**: Every scan event, finding, diff approval, and verification result must be hashed into a canonical JSON node.
- **FR-AUD-02**: Nodes shall be structured into a continuous Merkle Tree epoch.
- **FR-AUD-03**: System shall support anchoring Merkle Roots onto Ethereum EVM smart contracts (`AuditAnchor.sol`) for immutable non-repudiation.

---

## 4. External Interface Requirements

### 4.1 User Interfaces
- **Web UI (Port 5173)**:
  - Security posture gauge with real-time risk scoring.
  - Interactive AST dependency graph viewer.
  - Real-time SSE vulnerability streaming and live AI remediation console.
  - Merkle Tree audit trail explorer.
- **ThreatLensGo TUI (Port 8001 Consumer)**:
  - ANSI-color cyber HUD with split-pane agent thought streaming.
  - Interactive keyboard command palette (`/sqli`, `/xss`, `/ddos`, `/git`, `/status`).
  - Terminal-based diff viewer with keybinding approvals (`[Y] Approve`, `[N] Reject`).

### 4.2 Software & API Interfaces
- **FastAPI Core Backend (`:8000`)**: RESTful endpoints for `/auth`, `/repos`, `/scans`, `/analytics`, `/blockchain`.
- **CLI Agent Backend (`:8001`)**: REST & SSE endpoints for `/api/chat`, `/api/agent/stream`, `/api/ast/query`, `/api/diff/approve`.
- **LLM Provider Gateway**: Compatible with OpenRouter, OpenAI (GPT-4o), Anthropic (Claude 3.5 Sonnet), and local Ultron fine-tuned weights.

---

## 5. Non-Functional Requirements (NFR)

### 5.1 Performance Requirements
- **AST Re-index Time**: `< 50ms` for file changes in repositories up to 50,000 LOC.
- **Full Scan-to-Patch Latency**: Dynamic exploit discovery to verified patch generation in `< 60s`.
- **API Response Time**: REST endpoints `< 100ms` (p95), excluding long-running LLM generation.
- **SSE Stream Jitter**: Stream latency `< 20ms` between token generation and client render.

### 5.2 Security Requirements
- **Secret Zeroization**: API keys, credentials, and high-entropy secrets are scrubbed from telemetry logs before persistence.
- **Sandboxed Execution**: Exploit runner payloads must execute against explicitly configured target boundaries with rate-limiting tripwires.
- **JWT Authentication**: Core backend endpoints require RS256/HS256 signed JWT tokens with expiration validation.

### 5.3 Reliability & Fault Tolerance
- **Atomic File Writing**: File patches write to temporary buffers before swapping to prevent partial file corruption.
- **Graceful LLM Fallback**: If primary LLM provider drops or rate-limits, agent gracefully switches to configured backup provider.

---

## 6. Verification & Traceability Matrix

| Requirement ID | Verification Method | Pass Criteria |
|---|---|---|
| FR-SEC-01..05 | Automated Dynamic Test Suite (`sectest/`) | Structured vulnerability JSON with verified exploit proof-of-concept. |
| FR-AST-01..05 | Tree-sitter WASM Unit Tests | Accurate AST node hierarchy and `< 50ms` cache invalidation. |
| FR-AGT-01..04 | Agent Mock Scenarios | ReAct agent selects correct tools and formats valid unified diffs. |
| FR-HITL-01..03 | UI / TUI Approval E2E Tests | Zero writes prior to user approval; immediate disk write on confirmation. |
| FR-VER-01..04 | 3-Way Adversarial Verification Suite | Accurate classification of `REMEDIATED` vs `FLAWED_PATCH`. |
| FR-AUD-01..03 | Cryptographic Hash & Solidity Tests | Merkle root verification matches on-chain storage. |
