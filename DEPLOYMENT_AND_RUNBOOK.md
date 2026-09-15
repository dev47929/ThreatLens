# ThreatLens — Deployment, Configuration & Operations Runbook
**Document Version:** 1.0.0  
**Target:** DevOps, Site Reliability Engineers (SRE), and Security Operators  

---

## 1. Quickstart Guide (Local Development)

### Prerequisites
- **Node.js**: v18.0.0+ LTS (`node -v`)
- **Python**: 3.10, 3.11, or 3.12 (`python --version`)
- **Git**: 2.30+

### Service Launch Order
```
1. Core Backend (:8000) ──► 2. CLI Agent Backend (:8001) ──► 3. Web Frontend (:5173) / TUI
```

---

## 2. Step-by-Step Setup

### 2.1 Core Backend (Enterprise API — Port 8000)
```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate
# Linux/macOS
source venv/bin/activate

pip install -r requirements.txt
python run.py
```
*Health check:* `curl http://localhost:8000/docs`

### 2.2 CLI Agent Backend & AST Engine (Port 8001)
```bash
cd ThreatLensGo/cli-backend
python -m venv venv

# Windows
.\venv\Scripts\activate
# Linux/macOS
source venv/bin/activate

pip install -r requirements.txt
uvicorn api.main:app --port 8001 --reload
```
*Health check:* `curl http://localhost:8001/docs`

### 2.3 Web Dashboard (React + Vite — Port 5173)
```bash
cd frontend
npm install
npm run dev
```
*Access Web UI:* `http://localhost:5173`

### 2.4 ThreatLensGo TUI (Terminal UI)
```bash
cd ThreatLensGo/tui
npm install
npm run dev
```

---

## 3. Environment Variables Reference

| Variable | Default | Description |
|---|---|---|
| `PORT` | `8000` / `8001` | HTTP listening port |
| `SECRET_KEY` | *(required)* | Secret string for signing JWT tokens |
| `DATABASE_URL` | `sqlite:///./threatlens.db` | PostgreSQL connection string or SQLite path |
| `OPENROUTER_API_KEY` | *(optional)* | OpenRouter API Key for multi-model LLM access |
| `OPENAI_API_KEY` | *(optional)* | OpenAI API Key for GPT-4o / fine-tuned remediation models |
| `ANTHROPIC_API_KEY` | *(optional)* | Anthropic API Key for Claude 3.5 Sonnet |
| `ETHEREUM_RPC_URL` | `http://localhost:8545` | EVM RPC endpoint for on-chain Merkle root anchor |
| `AUDIT_CONTRACT_ADDRESS` | `0x0...` | Deployed `AuditAnchor.sol` contract address |

---

## 4. Production Hardening & Security Best Practices

1. **Database Persistence**: Use managed PostgreSQL with TLS in production.
2. **Reverse Proxy & SSL**: Terminate TLS at NGINX / Cloudflare, routing `/api` requests to backend instances.
3. **CORS Configuration**: Restrict allowed origins to your production dashboard domain.
4. **LLM Key Rotation**: Store API keys in HashiCorp Vault or AWS Secrets Manager.
5. **Rate Limiting**: Enable rate limiting on dynamic probe runners to prevent unintended self-DDoS.
