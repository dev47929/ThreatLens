# ThreatLens Blockchain & Ethereum Attestation Architecture

Complete technical specification, smart contract documentation, API reference, cryptographic algorithms, UI/UX component architecture, and operational workflows for the ThreatLens Blockchain tab.

---

## 1. System Overview & Dual-Tier Architecture

ThreatLens implements a **Dual-Tier Blockchain & Cryptographic Attestation Architecture** engineered for high-throughput security event logging, tamper-evident audit trails, and decentralized trust verification.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             ThreatLens Blockchain Engine                         │
└──────────────────────────────────────────────────────────────────────────────────┘
                                      │
       ┌──────────────────────────────┴──────────────────────────────┐
       ▼                                                             ▼
┌──────────────────────────────────────────────┐   ┌──────────────────────────────────────────────┐
│  Tier 1: Internal SHA-256 Blockchain (L1)    │   │  Tier 2: Public Ethereum Sepolia Anchor (L2) │
│  - Off-chain high-performance chain          │   │  - Decentralized smart contract attestation  │
│  - Fast block appending & verification       │   │  - Immutable root of trust                   │
│  - FastAPI REST backend storage              │   │  - Contract: 0x441675fDbe15C92...59c1       │
│  - Naming: {chain_name}_{account_id}         │   │  - EIP-1193 MetaMask transaction signing     │
└──────────────────────────────────────────────┘   └──────────────────────────────────────────────┘
```

### Core Architectural Rules
1. **Chain Naming Convention:**
   All internal chain IDs strictly follow `{chain_name}_{account_id}` (e.g., `audit_1`, `ddos_1`, `telemetry_1`). The `chain_name` portion must consist strictly of lowercase English letters (`[a-z]+`), and `account_id` is derived from the authenticated user context.
2. **Deterministic Cryptographic Hashing:**
   Every block derives its `current` hash via canonical SHA-256 over:
   `{ index, type, data, created_at, prev }`
3. **Bytes32 Ethereum Compatibility:**
   All block hashes anchored to Ethereum or sent to `/eth` endpoints are formatted as `0x`-prefixed 64-character hexadecimal `bytes32` strings (`0x` + 64 hex chars).
4. **Minimalist UI Footprint:**
   The horizontal visualizer provides an uncluttered chain rail with compact block cards, coupled with an ultra-compact payload bar (~38px) featuring on-demand **View JSON** expansion and **Copy JSON** integration.

---

## 2. Ethereum Sepolia Smart Contract Specification

### Network Configuration
- **Network Name:** Ethereum Sepolia Testnet
- **Chain ID (Decimal):** `11155111`
- **Chain ID (Hex):** `0xaa36a7`
- **Currency Symbol:** `SepoliaETH`
- **RPC Endpoints:**
  - Primary: `https://ethereum-sepolia-rpc.publicnode.com`
  - Fallback: `https://rpc.sepolia.org`
- **Block Explorer:** `https://sepolia.etherscan.io`
- **Contract Address:** `0x441675fDbe15C92f07dBDc2B645dba50E0B659c1`
- **Contract Explorer URL:** [https://sepolia.etherscan.io/address/0x441675fDbe15C92f07dBDc2B645dba50E0B659c1](https://sepolia.etherscan.io/address/0x441675fDbe15C92f07dBDc2B645dba50E0B659c1)

---

### Smart Contract Source Interface (`ThreadLensAnchor.sol`)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ThreadLensAnchor
 * @notice Anchors off-chain ThreatLens internal blockchain state onto Ethereum Sepolia.
 */
contract ThreadLensAnchor {
    struct ChainAnchor {
        uint256 id;
        string chainId;
        uint256 chainHeight;
        bytes32 chainHash;
        uint256 timestamp;
    }

    // Incremental anchor ID counter
    uint256 public anchorCount;

    // anchorId => ChainAnchor
    mapping(uint256 => ChainAnchor) public anchorsById;

    // keccak256(abi.encodePacked(chainId, chainHeight)) => anchorId
    mapping(bytes32 => uint256) public anchorByChainAndHeight;

    // chainId => latest anchorId
    mapping(string => uint256) public latestAnchorByChain;

    event ChainAnchored(
        uint256 indexed id,
        string indexed chainId,
        uint256 chainHeight,
        bytes32 chainHash,
        uint256 timestamp
    );

    /**
     * @notice Anchor a block state from an internal chain.
     * @param chainId Internal chain identifier (e.g. "audit_1")
     * @param chainHeight Height/index of the block anchored
     * @param chainHash 32-byte SHA-256 hash of the block (prefixed with 0x)
     */
    function anchorChain(
        string calldata chainId,
        uint256 chainHeight,
        bytes32 chainHash
    ) external returns (uint256 id);

    /**
     * @notice Fetch anchor by global ID
     */
    function getAnchorById(uint256 id) external view returns (ChainAnchor memory);

    /**
     * @notice Fetch anchor by chain ID and height
     */
    function getAnchorByHeight(
        string calldata chainId,
        uint256 chainHeight
    ) external view returns (ChainAnchor memory);

    /**
     * @notice Fetch latest anchor for a given chain ID
     */
    function getLatestAnchor(string calldata chainId) external view returns (ChainAnchor memory);

    /**
     * @notice Get latest anchored block height for a given chain ID
     */
    function getLatestChainHeight(string calldata chainId) external view returns (uint256);

    /**
     * @notice Total number of anchors committed to this contract
     */
    function getAnchorCount() external view returns (uint256);

    /**
     * @notice Check whether a given chain ID and height have been anchored
     */
    function isAnchored(string calldata chainId, uint256 chainHeight) external view returns (bool);
}
```

---

### Complete Application Binary Interface (ABI)

```json
[
  {
    "inputs": [
      { "internalType": "string", "name": "chainId", "type": "string" },
      { "internalType": "uint256", "name": "chainHeight", "type": "uint256" },
      { "internalType": "bytes32", "name": "chainHash", "type": "bytes32" }
    ],
    "name": "anchorChain",
    "outputs": [{ "internalType": "uint256", "name": "id", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "id", "type": "uint256" },
      { "indexed": true, "internalType": "string", "name": "chainId", "type": "string" },
      { "indexed": false, "internalType": "uint256", "name": "chainHeight", "type": "uint256" },
      { "indexed": false, "internalType": "bytes32", "name": "chainHash", "type": "bytes32" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "ChainAnchored",
    "type": "event"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "chainId", "type": "string" },
      { "internalType": "uint256", "name": "chainHeight", "type": "uint256" }
    ],
    "name": "getAnchorByHeight",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "id", "type": "uint256" },
          { "internalType": "string", "name": "chainId", "type": "string" },
          { "internalType": "uint256", "name": "chainHeight", "type": "uint256" },
          { "internalType": "bytes32", "name": "chainHash", "type": "bytes32" },
          { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
        ],
        "internalType": "struct ThreadLensAnchor.ChainAnchor",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "id", "type": "uint256" }],
    "name": "getAnchorById",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "id", "type": "uint256" },
          { "internalType": "string", "name": "chainId", "type": "string" },
          { "internalType": "uint256", "name": "chainHeight", "type": "uint256" },
          { "internalType": "bytes32", "name": "chainHash", "type": "bytes32" },
          { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
        ],
        "internalType": "struct ThreadLensAnchor.ChainAnchor",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAnchorCount",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "string", "name": "chainId", "type": "string" }],
    "name": "getLatestAnchor",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "id", "type": "uint256" },
          { "internalType": "string", "name": "chainId", "type": "string" },
          { "internalType": "uint256", "name": "chainHeight", "type": "uint256" },
          { "internalType": "bytes32", "name": "chainHash", "type": "bytes32" },
          { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
        ],
        "internalType": "struct ThreadLensAnchor.ChainAnchor",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "string", "name": "chainId", "type": "string" }],
    "name": "getLatestChainHeight",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "chainId", "type": "string" },
      { "internalType": "uint256", "name": "chainHeight", "type": "uint256" }
    ],
    "name": "isAnchored",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  }
]
```

---

## 3. Complete REST API Specifications

The system communicates with two dedicated API routers in the FastAPI backend:
1. `chainApi`: Internal blockchain management (`/chain/*`)
2. `ethApi`: Ethereum anchor record synchronization (`/eth/*`)

### Authentication
All requests must supply the standard Bearer token header:
`Authorization: Bearer <jwt_access_token>`

---

### 3.1 Internal Blockchain APIs (`chainApi`)

#### 1. List User Chains
- **Method & Route:** `GET /chain`
- **Headers:** `Authorization: Bearer <token>`
- **Description:** Retrieves all available chain IDs associated with the caller's account.
- **Response (200 OK):**
```json
{
  "chains": [
    "audit_1",
    "security_1",
    "telemetry_1"
  ]
}
```

---

#### 2. Get Paginated Chain Blocks
- **Method & Route:** `GET /chain/{chain_id}?page={page}&limit={limit}`
- **Parameters:**
  - `chain_id` (path, string): e.g. `audit_1`
  - `page` (query, int): Default `1`
  - `limit` (query, int): Default `10`
- **Response (200 OK):**
```json
[
  {
    "index": 0,
    "type": "genesis",
    "data": {
      "account_id": 1,
      "name": "ThreatLens Genesis Snapshot"
    },
    "created_at": "2026-09-01T10:00:00Z",
    "prev": null,
    "current": "0000000000000000000000000000000000000000000000000000000000000000"
  },
  {
    "index": 1,
    "type": "repo",
    "data": {
      "repo_id": 1,
      "name": "ThreatLens/core-engine",
      "branch": "main",
      "integrity": "clean"
    },
    "created_at": "2026-09-02T12:00:00Z",
    "prev": "0000000000000000000000000000000000000000000000000000000000000000",
    "current": "53d199b44e9bab7b021c2cc1c185c90eff583f982f287bcd7c393fe51bbebd94"
  }
]
```

---

#### 3. Get Latest (Head) Block
- **Method & Route:** `GET /chain/{chain_id}/latest`
- **Parameters:** `chain_id` (path, string)
- **Response (200 OK):**
```json
{
  "index": 12,
  "type": "audit_checkpoint",
  "data": {
    "auditor": "SOC Tier-1",
    "status": "VERIFIED",
    "findings": 0
  },
  "created_at": "2026-09-05T03:19:34Z",
  "prev": "53d199b44e9bab7b021c2cc1c185c90eff583f982f287bcd7c393fe51bbebd94",
  "current": "d897ac0a3f617b1e73091137280abd06a464ffa7fe2efba73e64b5700c186be7"
}
```

---

#### 4. Cryptographic Chain Verification
- **Method & Route:** `GET /chain/{chain_id}/verify?mode={mode}&target={target}`
- **Parameters:**
  - `chain_id` (path, string): e.g. `audit_1`
  - `mode` (query, enum):
    - `last`: Verify backwards from head by N blocks
    - `full`: Complete audit from Genesis (0) to Head
    - `latest`: Verify head block link only
    - `single`: Verify single target block
    - `from`: Verify starting from target index up to head
    - `till`: Verify from Genesis index 0 up to target index
  - `target` (query, int): Target block index or block count window (e.g. `10`)
- **Response (200 OK - Successful):**
```json
{
  "status": true,
  "mode": "full",
  "target": 12,
  "message": "Validation successful: all predecessor hash links match SHA-256 state tree.",
  "verified_count": 13
}
```
- **Response (200 OK - Discrepancy Found):**
```json
{
  "status": false,
  "mode": "full",
  "target": 12,
  "block_index": 4,
  "message": "Cryptographic hash mismatch: block.prev does not match parent.current"
}
```

---

#### 5. Build New Internal Chain
- **Method & Route:** `POST /chain/build`
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "chain_name": "audit",
  "chain_id": "audit_1",
  "usage": true,
  "repos": [
    { "repo_id": 1 }
  ],
  "commits": [
    { "repo_id": 1, "limit": 5 }
  ],
  "attacks": [
    { "type": "ddos", "limit": 10 }
  ]
}
```
- **Response (200 OK):**
```json
{
  "status": "success",
  "chain_id": "audit_1",
  "block_count": 8,
  "genesis_hash": "0000000000000000000000000000000000000000000000000000000000000000",
  "head_hash": "d897ac0a3f617b1e73091137280abd06a464ffa7fe2efba73e64b5700c186be7"
}
```

---

#### 6. Validate Chain In-Memory
- **Method & Route:** `POST /chain/validate`
- **Request Body:** Array of block objects (`[ { index, type, data, created_at, prev, current }, ... ]`)
- **Response (200 OK):**
```json
{
  "valid": true,
  "total_blocks": 14,
  "genesis_valid": true
}
```

---

#### 7. Replace / Commit Chain State
- **Method & Route:** `POST /chain/{chain_id}/replace`
- **Request Body:** Full array of replacement blocks
- **Response (200 OK):**
```json
{
  "status": "replaced",
  "chain_id": "audit_1",
  "new_height": 13
}
```

---

#### 8. Destroy Internal Chain
- **Method & Route:** `DELETE /chain/{chain_id}`
- **Response (200 OK):**
```json
{
  "status": "destroyed",
  "chain_id": "audit_1"
}
```

---

### 3.2 Ethereum Anchor Record APIs (`ethApi`)

#### 1. Store Anchor Receipt
- **Method & Route:** `POST /eth`
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "account_id": 1,
  "anchor_id": 18,
  "chain_id": "audit_1",
  "chain_height": 12,
  "chain_hash": "0xd897ac0a3f617b1e73091137280abd06a464ffa7fe2efba73e64b5700c186be7",
  "wallet_address": "0x441675fDbe15C92f07dBDc2B645dba50E0B659c1",
  "transaction_hash": "0x98f828a2b531bc7d9a8c7e6b528a4cf8a72b6d19a2e3f4b8c9d0e1f2a3b4c5d6",
  "block_no": 9234150
}
```
- **Response (200 OK):**
```json
{
  "id": 4,
  "account_id": 1,
  "anchor_id": 18,
  "chain_id": "audit_1",
  "chain_height": 12,
  "chain_hash": "0xd897ac0a3f617b1e73091137280abd06a464ffa7fe2efba73e64b5700c186be7",
  "wallet_address": "0x441675fDbe15C92f07dBDc2B645dba50E0B659c1",
  "transaction_hash": "0x98f828a2b531bc7d9a8c7e6b528a4cf8a72b6d19a2e3f4b8c9d0e1f2a3b4c5d6",
  "block_no": 9234150,
  "integrity_status": "verified",
  "created_at": "2026-09-05T03:20:00Z"
}
```

---

#### 2. Query Stored Anchors
- **Method & Route:** `GET /eth?field={field}&value={value}`
- **Parameters:**
  - `field`: `chain_id` | `account_id` | `anchor_id`
  - `value`: Filter value (e.g. `audit_1` or `1`)
- **Response (200 OK):**
```json
[
  {
    "id": 1,
    "account_id": 1,
    "anchor_id": 18,
    "chain_id": "audit_1",
    "chain_height": 12,
    "chain_hash": "0xd897ac0a3f617b1e73091137280abd06a464ffa7fe2efba73e64b5700c186be7",
    "wallet_address": "0x441675fDbe15C92f07dBDc2B645dba50E0B659c1",
    "transaction_hash": "0x98f828a2b531bc7d9a8c7e6b528a4cf8a72b6d19a2e3f4b8c9d0e1f2a3b4c5d6",
    "block_no": 9234150,
    "integrity_status": "verified",
    "created_at": "2026-09-05T03:20:00Z"
  }
]
```

---

#### 3. Update Anchor Integrity Status
- **Method & Route:** `PATCH /eth/{anchor_id}/integrity`
- **Parameters:** `anchor_id` (path, int)
- **Request Body:**
```json
{
  "integrity_status": "verified"
}
```
- **Response (200 OK):**
```json
{
  "id": 1,
  "anchor_id": 18,
  "integrity_status": "verified",
  "verified_at": "2026-09-05T07:15:22Z"
}
```

---

## 4. Cryptographic Algorithms & Hashing Standard

All block hashing is deterministic and executes in the client browser using the native **Web Crypto API** (`crypto.subtle.digest`):

```javascript
/**
 * Computes canonical SHA-256 hex string
 */
export async function computeSha256(data) {
  const text = typeof data === "string" ? data : JSON.stringify(data);
  const msgBuffer = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Computes canonical block hash
 */
export async function computeBlockHash(block) {
  const canonicalPayload = JSON.stringify({
    index: block.index,
    type: block.type,
    data: block.data,
    created_at: block.created_at,
    prev: block.prev || null,
  });
  return await computeSha256(canonicalPayload);
}
```

### Bytes32 Normalization Helper
Smart contracts expect exactly 32 bytes in hexadecimal notation. `formatBytes32Hash` guarantees proper padding and `0x` formatting:

```javascript
export function formatBytes32Hash(hash) {
  if (!hash) return "0x" + "0".repeat(64);
  let clean = String(hash).trim();
  if (clean.startsWith("0x") || clean.startsWith("0X")) {
    clean = clean.slice(2);
  }
  if (clean.length < 64) {
    clean = clean.padStart(64, "0");
  } else if (clean.length > 64) {
    clean = clean.slice(0, 64);
  }
  return `0x${clean.toLowerCase()}`;
}
```

---

## 5. UI Architecture & Component Hierarchy

The blockchain interface is modularized across 5 high-craft components:

```
src/
├── pages/dashboard/tabs/security/
│   └── BlockchainTab.jsx               <-- Main view controller & Web3 lifecycle
├── components/blockchain/
│   ├── BlockchainVisualizer.jsx        <-- Horizontal interactive chain & compact inspector
│   ├── CreateChainModal.jsx            <-- Build chain from usage, repos, commits, attacks
│   ├── AppendBlockModal.jsx            <-- Append custom state or system snapshot block
│   ├── DeleteChainModal.jsx            <-- Safe deletion modal requiring name confirmation
│   └── WalletDetailsModal.jsx          <-- MetaMask account, Sepolia network & balance
└── lib/
    ├── ethereum.js                     <-- ethers.js provider, wallet methods & contract calls
    ├── chainUtils.js                   <-- SHA-256 hashing, verification modes & attack types
    └── api.js                          <-- chainApi & ethApi REST endpoints
```

---

### 5.1 Visual Style Guide & CSS Tokens

The visual design language strictly avoids generic clichés in favor of a dense, high-contrast, military-grade cybersecurity terminal:

| Style Attribute | Value / CSS Class | Description |
|---|---|---|
| **Background Primary** | `#06090e` | Deep obsidian backdrop |
| **Container / Card Background** | `#0a0f16` / `#0e131b` | Subtle elevated panels (≤ 7% brightness delta) |
| **Borders** | `#172332` / `#1f2d3d` | Low-saturation cool slate boundary lines |
| **Primary Accent** | `#38bdf8` (`text-[#38bdf8]`) | Vibrant Sky Blue for cryptographic indexes & triggers |
| **Attested / Success** | `#34d399` (`text-emerald-400`) | Emerald green for verified SHA-256 links & anchor checks |
| **Threat / Destructive** | `#f87171` (`text-rose-400`) | Rose red for attacks, errors, or chain destruction |
| **Typography (Data)** | `font-mono` | Strict monospace for hashes, timestamps, IDs, and payload |
| **Typography (UI)** | `font-sans` | High-legibility sans-serif for modal titles and body text |

---

### 5.2 Key Component Walkthroughs

#### 1. `BlockchainTab.jsx`
- **View Switcher:** Switches between **Chain Explorer** (horizontal visual rail, block inspector, append modal trigger, verification panel) and **Attestation & Anchors** (Sepolia contract verification table, stored receipts, on-chain state queries).
- **Web3 Integration:** Automatically detects MetaMask, monitors `accountsChanged` and `chainChanged`, prompts network switch to Sepolia (`11155111`), and coordinates transaction execution.
- **Verification Engine:** Triggers the 6 FastAPI verification modes (`last`, `full`, `latest`, `single`, `from`, `till`) and renders status badges.

#### 2. `BlockchainVisualizer.jsx`
- **Horizontal Rail:** Displays blocks horizontally connected by cryptographic arrow links (`Parent Hash` → `Current Hash`). Supports mousewheel horizontal scrolling, drag panning, and previous/next scroll buttons.
- **Search & Sort:** Quick search by Block Number, Hash, or Type name; toggle sorting order between Genesis First (`asc`) and Head First (`desc`).
- **Compact Block Cards:** Displays only essential information: Index badge `#<n>`, Block Type badge, Head/Genesis indicator, truncated SHA-256 hash, creation timestamp, and inspection trigger.
- **Compact Payload Data Bar:**
  - Measures only **~38px** in height.
  - Displays summary chips (e.g. `type: ddos`, `status: completed`, `id: 6`).
  - Contains an interactive **View JSON** / **Hide JSON** toggle.
  - Contains a 1-click **Copy JSON** button with toast confirmation.
  - When expanded, shows full syntax-highlighted raw JSON in a max-height scrollable container.

#### 3. `CreateChainModal.jsx`
- Enforces lowercase English letters (`[a-z]+`) for `chain_name`.
- Computes `chain_id` dynamically as `${cleanName}_${accountId}`.
- Allows configuring genesis options:
  - System usage metrics toggle
  - Monitored repositories selection
  - Commit analysis depth per repository (`repo_id`, `limit`)
  - Attack telemetry inclusion (`type` from `ddos`, `data_burning`, `xss`, `sqli`, `proxy_origin`, with `limit`)

#### 4. `AppendBlockModal.jsx`
- Supports two modes:
  - **Custom State:** Direct JSON payload editor with preloaded security audit and deployment templates.
  - **Telemetry Snapshot:** Pulls repository, commit, or attack telemetry into the new block.
- Precomputes the candidate SHA-256 hash in real time using the current head block's hash as `prev`.

#### 5. `DeleteChainModal.jsx`
- Prevents accidental chain destruction by requiring the operator to type the exact chain ID (e.g. `audit_1`) before enabling the confirmation action.

#### 6. `WalletDetailsModal.jsx`
- Displays the active wallet address, current network, Sepolia contract link, and disconnect/reconnect controls.

---

## 6. End-to-End Operational Workflows

### Workflow 1: Inspecting Blocks & Viewing Raw JSON
1. Navigate to **Blockchain** tab in the ThreatLens dashboard.
2. Select desired chain from the chain dropdown (e.g. `audit_1`).
3. Scroll through the horizontal rail or use the search bar to locate a block.
4. Click on the block card. The **Block Details Inspector** opens below the rail.
5. In the **Payload Data** bar:
   - Read the summary chips directly.
   - Click **View JSON** to expand the full formatted raw JSON payload.
   - Click **Copy JSON** to place the raw payload on the clipboard.
   - Click **Hide JSON** to return to the ultra-compact bar.

### Workflow 2: Creating a New Internal Chain
1. Click **Create Chain** in the header.
2. Enter a chain name (e.g. `incident`). The modal automatically shows the resulting ID: `incident_1`.
3. Select whether to include usage telemetry, select repositories, and add attack filters if needed.
4. Click **Create Chain**. The backend calls `POST /chain/build`, synthesizes the genesis block, and selects the new chain in the UI.

### Workflow 3: Appending a Block
1. Click **Append Block**.
2. Choose **Custom State** or **System Snapshot**.
3. Select a template (e.g. *Security Audit Checkpoint*) or paste custom JSON.
4. Review the computed candidate hash.
5. Click **Append Block to Chain**. The client validates the chain and invokes `POST /chain/{chain_id}/replace`.

### Workflow 4: Auditing Chain Integrity
1. Click **Verify Integrity**.
2. Select one of the 6 verification algorithms:
   - `last`: Verify tail by N blocks
   - `full`: Audit every block from genesis to head
   - `latest`: Check head block cryptographic link
   - `single`: Verify single target block index
   - `from`: Verify from target index up to head
   - `till`: Verify from genesis index 0 up to target index
3. Click **Run Verification**. The backend performs SHA-256 integrity traversal and returns a cryptographic report.

### Workflow 5: Anchoring a Block to Sepolia via MetaMask
1. In the Block Details Inspector (or horizontal card), click **Anchor to Sepolia**.
2. If MetaMask is disconnected, click **Connect MetaMask**.
3. If MetaMask is on another chain, click **Switch to Sepolia Testnet**.
4. MetaMask opens a transaction prompt calling:
   `anchorChain(string chainId, uint256 chainHeight, bytes32 chainHash)`
5. Confirm the transaction. Once mined:
   - ThreatLens parses the `ChainAnchored` event receipt.
   - ThreatLens submits receipt metadata to `POST /eth`.
   - The block displays the on-chain verified badge and Etherscan transaction link.

---

## 7. Supported Attack Types & Telemetry Models

The system natively formats telemetry blocks according to the predefined ThreatLens attack engine specifications:

| Attack ID | Display Label | Telemetry Description |
|---|---|---|
| `ddos` | **DDoS** | Distributed Denial of Service attack volume, requests/sec, target endpoint |
| `data_burning` | **Data Burning** | Data exfiltration / memory depletion attack metrics |
| `xss` | **XSS** | Cross-Site Scripting payload detection & WAF interception snapshot |
| `sqli` | **SQLi** | SQL Injection query pattern & database sanitization telemetry |
| `proxy_origin` | **Proxy Origin** | Proxy origin header spoofing & gateway header anomaly records |

---

*ThreatLens Cryptographic Attestation Subsystem · Built for Enterprise Security & Decentralized Provenance.*
