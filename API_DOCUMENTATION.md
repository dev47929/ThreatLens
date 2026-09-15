# ThreatLens — API Specification & Interface Reference
**API Version:** 1.0.0  
**Base Protocols:** HTTP/1.1, HTTP/2, WebSockets, Server-Sent Events (SSE)  

---

## 1. Core Enterprise Backend (`http://localhost:8000`)

### 1.1 Authentication & User Management
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new security operator account | No |
| `POST` | `/api/auth/login` | Authenticate with username/password, return JWT token | No |
| `GET` | `/api/auth/me` | Fetch current authenticated user profile & tenant roles | Yes (Bearer) |
| `POST` | `/api/auth/refresh` | Refresh expired access token | Yes (Bearer) |

### 1.2 Repository & Workspace Management
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/repo` | List all tracked Git repositories and indexing statuses | Yes (Bearer) |
| `POST` | `/api/repo` | Connect a new local or remote Git repository for AST tracking | Yes (Bearer) |
| `GET` | `/api/repo/{id}` | Get repository details, commit history, and AST node stats | Yes (Bearer) |
| `DELETE` | `/api/repo/{id}` | Disconnect a repository and purge AST index cache | Yes (Bearer) |
| `POST` | `/api/repo/{id}/sync` | Trigger incremental git pull and AST re-indexing | Yes (Bearer) |

### 1.3 Security Scans & Dynamic Probes
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/scans/launch` | Launch a dynamic offensive vulnerability probe | Yes (Bearer) |
| `GET` | `/api/scans` | List historical security scans with filtering & pagination | Yes (Bearer) |
| `GET` | `/api/scans/{id}` | Get detailed report, findings, and probe evidence | Yes (Bearer) |
| `GET` | `/api/scans/{id}/stream` | SSE stream of live scan progress and vector responses | Yes (Bearer) |

### 1.4 Blockchain & Audit Trail
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/audit/merkle-root` | Retrieve latest canonical Merkle root for current epoch | Yes (Bearer) |
| `POST` | `/api/audit/anchor` | Submit Merkle root anchor transaction to Ethereum smart contract | Yes (Bearer) |
| `GET` | `/api/audit/verify/{id}` | Cryptographically verify finding authenticity against Merkle root | Yes (Bearer) |

---

## 2. CLI Agent Engine & AST Intelligence Service (`http://localhost:8001`)

### 2.1 ReAct Agent Loop & Remediation
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/agent/remediate` | Initiate an autonomous ReAct loop for a target finding |
| `GET` | `/api/agent/stream/{session_id}` | SSE stream emitting `Thought`, `Action`, `Observation`, and `Diff` events |
| `POST` | `/api/agent/diff/approve` | Confirm and atomically apply a proposed unified diff patch |
| `POST` | `/api/agent/diff/reject` | Reject a proposed patch and provide feedback to re-prompt agent |

### 2.2 In-Memory AST Queries
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/ast/index` | Index or re-index target workspace path into Tree-sitter AST |
| `POST` | `/api/ast/search` | Execute structural AST pattern search across repository |
| `POST` | `/api/ast/symbols` | Query symbol table for classes, functions, handlers, and types |
| `POST` | `/api/ast/dependencies` | Extract call graph and dependency paths for a given source node |

### 2.3 Dynamic Fuzzing Daemon
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/sectest/health` | Check local exploit runner daemon health status (`:8765`) |
| `POST` | `/api/sectest/probe` | Execute specified attack module against target URL |
| `POST` | `/api/sectest/verify` | Execute 3-way adversarial verification on patched endpoint |

---

## 3. Server-Sent Events (SSE) Event Schemas

### Agent Remediation Stream (`/api/agent/stream/{session_id}`)
```json
// Event: thought
{
  "type": "thought",
  "content": "Analyzing user authentication route for SQL concatenation sinks in auth.py..."
}

// Event: action
{
  "type": "action",
  "tool": "read_file",
  "input": { "path": "backend/auth.py", "start_line": 40, "end_line": 65 }
}

// Event: observation
{
  "type": "observation",
  "output": "Found raw string query: f'SELECT * FROM users WHERE username = \"{user}\"'"
}

// Event: diff_proposal (Triggers HITL Modal)
{
  "type": "diff_proposal",
  "file_path": "backend/auth.py",
  "diff": "--- a/backend/auth.py\n+++ b/backend/auth.py\n@@ -52,1 +52,1 @@\n- cursor.execute(f'SELECT * FROM users WHERE username = \"{user}\"')\n+ cursor.execute('SELECT * FROM users WHERE username = %s', (user,))"
}

// Event: verification_result
{
  "type": "verification_result",
  "status": "REMEDIATED",
  "original_exploit_blocked": true,
  "mutated_exploit_blocked": true,
  "benign_baseline_passed": true
}
```
