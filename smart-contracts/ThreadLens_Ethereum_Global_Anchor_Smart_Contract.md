# ThreadLens Ethereum Global Anchor Smart Contract

## 1. Purpose

The ThreadLens Ethereum Smart Contract provides a **global, public,
tamper-evident anchoring layer** for the ThreadLens internal blockchain.

The internal ThreadLens blockchain remains the source of detailed
application data. Ethereum stores only compact cryptographic checkpoints
that prove that a particular ThreadLens chain reached a particular
height with a particular hash.

The contract is designed for **on-demand anchoring**. ThreadLens does
not need to submit every internal block to Ethereum.

------------------------------------------------------------------------

## 2. Canonical Anchor Structure

Every Ethereum anchor represents the following logical record:

``` json
{
  "id": 1,
  "chain_id": "atharv_123",
  "chain_height": 1842,
  "chain_hash": "a81c...",
  "timestamp": "2026-09-03T06:00:00Z"
}
```

### Field definitions

  -----------------------------------------------------------------------
  Field                   Solidity type           Description
  ----------------------- ----------------------- -----------------------
  `id`                    `uint256`               Global
                                                  auto-incrementing
                                                  anchor identifier

  `chainId`               `string`                ThreadLens chain
                                                  identifier,
                                                  e.g. `atharv_123`

  `chainHeight`           `uint256`               Internal ThreadLens
                                                  blockchain height being
                                                  anchored

  `chainHash`             `bytes32`               SHA-256-derived 32-byte
                                                  hash of the ThreadLens
                                                  chain state/block

  `timestamp`             `uint256`               Ethereum-side timestamp
                                                  generated with
                                                  `block.timestamp`
  -----------------------------------------------------------------------

> `chain_id` is an application-level identifier. It is intentionally
> human-readable and is **not** the same thing as the Ethereum network
> chain ID.

------------------------------------------------------------------------

# 3. High-Level Architecture

``` mermaid
flowchart TB
    A[ThreadLens Application] --> B[Internal Blockchain Module]
    B --> C[ThreadLens Block]
    C --> D[SHA-256 Hash]
    D --> E{Anchor requested?}

    E -- No --> B
    E -- Yes --> F[Ethereum Anchor Service]
    F --> G[ThreadLensAnchor Smart Contract]
    G --> H[Ethereum Network]

    H --> I[Immutable Public Anchor]
    I --> J[Verification / Audit]
```

### Architecture explanation

1.  ThreadLens creates and maintains its normal internal blockchain.
2.  Each internal block contains fields such as `index`, `type`, `data`,
    `created_at`, `prev`, and `current`.
3.  ThreadLens computes the internal SHA-256 hash.
4.  When an administrator/system requests an anchor, ThreadLens submits
    the selected chain height and hash to Ethereum.
5.  The smart contract validates the anchor and assigns a global `id`.
6.  Ethereum records the anchor permanently as on-chain state.
7.  Anyone with access to the contract can retrieve the anchor and
    compare it with the original ThreadLens chain.

------------------------------------------------------------------------

# 4. Internal ThreadLens Block vs Ethereum Anchor

A ThreadLens internal block can look like:

``` json
{
  "index": 4,
  "type": "commit_analysis",
  "data": {
    "commit": {
      "sha": "5815acb641944075a1737506825e71687203dcdd",
      "message": "merge: resolve remote changes"
    },
    "summary": {
      "risk_level": "low",
      "risk_score": 2
    }
  },
  "created_at": "2026-09-03T05:23:54Z",
  "prev": "f6c6125abcd361ad09eacadbe108b00fd4a1a8446882e4b739522723695a317e",
  "current": "53d199b44e9bab7b021c2cc1c185c90eff583f982f287bcd7c393fe51bbebd94"
}
```

The Ethereum layer does **not** store the complete block.

Instead, it stores the checkpoint:

``` json
{
  "id": 1,
  "chain_id": "atharv_123",
  "chain_height": 4,
  "chain_hash": "53d199b44e9bab7b021c2cc1c185c90eff583f982f287bcd7c393fe51bbebd94",
  "timestamp": "ethereum_block_timestamp"
}
```

### Data reduction

``` mermaid
flowchart LR
    A[Large ThreadLens Block] --> B[Canonical Block Representation]
    B --> C[SHA-256]
    C --> D[32-byte chainHash]
    D --> E[Ethereum Anchor]

    A -.-> F[Detailed data remains off-chain]
    E --> G[Public immutable checkpoint]
```

This keeps Ethereum storage small while preserving the cryptographic
reference needed for verification.

------------------------------------------------------------------------

# 5. On-Demand Anchoring

Anchoring is deliberately **not continuous** and does not require every
internal block to become an Ethereum transaction.

Example:

``` mermaid
flowchart LR
    B1[Height 1] --> B2[Height 2]
    B2 --> B3[Height 3]
    B3 --> B100[Height 100]
    B100 --> B101[Height 101]
    B101 --> B500[Height 500]
    B500 --> B501[Height 501]
    B501 --> B1842[Height 1842]
    B1842 --> B2500[Height 2500]

    B100 -. Anchor .-> E1[ETH Anchor #1]
    B500 -. Anchor .-> E2[ETH Anchor #2]
    B1842 -. Anchor .-> E3[ETH Anchor #3]
    B2500 -. Anchor .-> E4[ETH Anchor #4]
```

Valid anchor sequence:

``` text
100 → 500 → 1842 → 2500
```

The contract does **not** require:

``` text
100 → 101 → 102 → 103 → ...
```

It only requires the newly anchored height to be greater than the
previously anchored height for the same `chain_id`.

------------------------------------------------------------------------

# 6. Smart Contract

``` solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ThreadLensAnchor {

    struct ChainAnchor {
        uint256 id;
        string chainId;
        uint256 chainHeight;
        bytes32 chainHash;
        uint256 timestamp;
    }

    uint256 private _nextId = 1;

    // Global anchor storage
    mapping(uint256 => ChainAnchor) private _anchors;

    // chain_id => latest anchor ID
    mapping(string => uint256) private _latestAnchorId;

    // chain_id => latest anchored height
    mapping(string => uint256) private _latestChainHeight;

    // chain_id => chain_height => anchor ID
    mapping(string => mapping(uint256 => uint256)) private _anchorByHeight;

    event ChainAnchored(
        uint256 indexed id,
        string indexed chainId,
        uint256 chainHeight,
        bytes32 chainHash,
        uint256 timestamp
    );

    /**
     * @notice Create an on-demand anchor for a ThreadLens chain.
     *
     * The chain height must be greater than the previously
     * anchored height for the same chain.
     */
    function anchorChain(
        string calldata chainId,
        uint256 chainHeight,
        bytes32 chainHash
    ) external returns (uint256 id) {

        require(bytes(chainId).length > 0, "Invalid chain ID");
        require(chainHash != bytes32(0), "Invalid chain hash");

        uint256 latestHeight = _latestChainHeight[chainId];

        require(
            chainHeight > latestHeight,
            "Chain height must increase"
        );

        require(
            _anchorByHeight[chainId][chainHeight] == 0,
            "Height already anchored"
        );

        id = _nextId++;

        uint256 timestamp = block.timestamp;

        _anchors[id] = ChainAnchor({
            id: id,
            chainId: chainId,
            chainHeight: chainHeight,
            chainHash: chainHash,
            timestamp: timestamp
        });

        _latestAnchorId[chainId] = id;
        _latestChainHeight[chainId] = chainHeight;
        _anchorByHeight[chainId][chainHeight] = id;

        emit ChainAnchored(
            id,
            chainId,
            chainHeight,
            chainHash,
            timestamp
        );
    }

    /**
     * @notice Fetch an anchor using its global ID.
     */
    function getAnchorById(
        uint256 id
    ) external view returns (ChainAnchor memory) {

        require(
            id > 0 && id < _nextId,
            "Anchor does not exist"
        );

        return _anchors[id];
    }

    /**
     * @notice Fetch the latest anchor for a chain.
     */
    function getLatestAnchor(
        string calldata chainId
    ) external view returns (ChainAnchor memory) {

        uint256 id = _latestAnchorId[chainId];

        require(
            id != 0,
            "Chain has no anchors"
        );

        return _anchors[id];
    }

    /**
     * @notice Fetch an anchor using chain ID and chain height.
     */
    function getAnchorByHeight(
        string calldata chainId,
        uint256 chainHeight
    ) external view returns (ChainAnchor memory) {

        uint256 id = _anchorByHeight[chainId][chainHeight];

        require(
            id != 0,
            "Anchor does not exist"
        );

        return _anchors[id];
    }

    /**
     * @notice Get the latest anchored height of a chain.
     */
    function getLatestChainHeight(
        string calldata chainId
    ) external view returns (uint256) {

        return _latestChainHeight[chainId];
    }

    /**
     * @notice Get the total number of anchors created.
     */
    function getAnchorCount()
        external
        view
        returns (uint256)
    {
        return _nextId - 1;
    }

    /**
     * @notice Check whether a specific chain height has been anchored.
     */
    function isAnchored(
        string calldata chainId,
        uint256 chainHeight
    ) external view returns (bool) {

        return _anchorByHeight[chainId][chainHeight] != 0;
    }
}
```

------------------------------------------------------------------------

# 7. Contract Storage Model

``` mermaid
erDiagram
    CHAIN {
        string chain_id PK
        uint256 latest_anchor_id
        uint256 latest_chain_height
    }

    ANCHOR {
        uint256 id PK
        string chain_id FK
        uint256 chain_height
        bytes32 chain_hash
        uint256 timestamp
    }

    CHAIN ||--o{ ANCHOR : contains
```

### Conceptual relationship

``` text
                     CHAIN
              ┌──────────────────┐
              │ chain_id         │
              │ latest_anchor_id │
              │ latest_height    │
              └────────┬─────────┘
                       │
                       │ 1 : many
                       ▼
              ┌──────────────────┐
              │     ANCHOR       │
              ├──────────────────┤
              │ id               │
              │ chain_id         │
              │ chain_height     │
              │ chain_hash       │
              │ timestamp        │
              └──────────────────┘
```

The Solidity implementation uses mappings rather than relational
database tables. The diagram describes the logical entity relationship.

------------------------------------------------------------------------

# 8. Mapping Relationships

The contract maintains four important indexes.

``` text
_anchors
    anchor ID
        ↓
    ChainAnchor

_latestAnchorId
    chain_id
        ↓
    latest anchor ID

_latestChainHeight
    chain_id
        ↓
    latest height

_anchorByHeight
    chain_id + height
        ↓
    anchor ID
```

### Indexing graph

``` mermaid
flowchart TB
    A[anchor id] --> B[_anchors]
    C[chain_id] --> D[_latestAnchorId]
    C --> E[_latestChainHeight]
    C --> F[_anchorByHeight]
    G[chain_id + height] --> F

    B --> H[ChainAnchor]
    D --> H
    F --> H
```

------------------------------------------------------------------------

# 9. Anchor Creation Flow

``` mermaid
sequenceDiagram
    participant T as ThreadLens
    participant S as Anchor Service
    participant C as Smart Contract
    participant E as Ethereum

    T->>S: Request anchor
    S->>S: Read chain_id, height, current hash
    S->>C: anchorChain(chainId, height, hash)
    C->>C: Validate chain ID
    C->>C: Validate non-zero hash
    C->>C: Check height progression
    C->>C: Assign next global ID
    C->>C: Set block.timestamp
    C->>C: Store anchor
    C->>C: Emit ChainAnchored
    C->>E: Transaction included in block
    E-->>S: Transaction receipt
    S-->>T: Anchor ID + transaction information
```

------------------------------------------------------------------------

# 10. Validation Rules

The contract currently enforces the following:

### Rule 1 --- Chain ID must exist

``` solidity
require(bytes(chainId).length > 0, "Invalid chain ID");
```

Invalid:

``` text
""
```

Valid:

``` text
"atharv_123"
```

### Rule 2 --- Chain hash cannot be zero

``` solidity
require(chainHash != bytes32(0), "Invalid chain hash");
```

### Rule 3 --- Chain height must increase

``` solidity
require(
    chainHeight > latestHeight,
    "Chain height must increase"
);
```

For example:

``` text
Current anchored height = 100

100  → rejected
99   → rejected
101  → accepted
500  → accepted
```

### Rule 4 --- A chain height cannot be anchored twice

``` solidity
require(
    _anchorByHeight[chainId][chainHeight] == 0,
    "Height already anchored"
);
```

------------------------------------------------------------------------

# 11. Global Anchor ID

The contract generates the global ID automatically.

``` text
_nextId = 1
```

First anchor:

``` text
id = 1
_nextId = 2
```

Second anchor:

``` text
id = 2
_nextId = 3
```

Third anchor:

``` text
id = 3
_nextId = 4
```

### ID flow

``` mermaid
flowchart LR
    A[_nextId = 1] --> B[Create Anchor]
    B --> C[Anchor ID = 1]
    C --> D[_nextId = 2]
    D --> E[Create Next Anchor]
    E --> F[Anchor ID = 2]
    F --> G[_nextId = 3]
```

The `id` is therefore a **global sequential index across all ThreadLens
chains**.

------------------------------------------------------------------------

# 12. Multiple ThreadLens Chains

The contract supports multiple independent ThreadLens chains.

``` text
atharv_123
    ├── height 100 → anchor #1
    ├── height 500 → anchor #3
    └── height 1842 → anchor #5

atharv_456
    ├── height 50 → anchor #2
    ├── height 200 → anchor #4
    └── height 900 → anchor #6
```

### Multi-chain visualization

``` mermaid
flowchart TB
    A[ThreadLens Ethereum Anchor Contract]

    A --> B[chain_id: atharv_123]
    A --> C[chain_id: atharv_456]

    B --> B1[Anchor #1 - Height 100]
    B --> B2[Anchor #3 - Height 500]
    B --> B3[Anchor #5 - Height 1842]

    C --> C1[Anchor #2 - Height 50]
    C --> C2[Anchor #4 - Height 200]
    C --> C3[Anchor #6 - Height 900]
```

The height progression is enforced **independently for each
`chain_id`**.

------------------------------------------------------------------------

# 13. Fetch Operations

## 13.1 Fetch by global ID

``` solidity
getAnchorById(1)
```

Returns:

``` json
{
  "id": 1,
  "chainId": "atharv_123",
  "chainHeight": 1842,
  "chainHash": "0x...",
  "timestamp": 1756879234
}
```

Use this when the global anchor ID is known.

------------------------------------------------------------------------

## 13.2 Fetch latest anchor by chain ID

``` solidity
getLatestAnchor("atharv_123")
```

Returns the most recent Ethereum anchor for that chain.

------------------------------------------------------------------------

## 13.3 Fetch by chain ID and height

``` solidity
getAnchorByHeight(
    "atharv_123",
    1842
)
```

This provides direct lookup using the ThreadLens chain identifier and
internal chain height.

------------------------------------------------------------------------

## 13.4 Get latest anchored height

``` solidity
getLatestChainHeight("atharv_123")
```

Example result:

``` text
1842
```

------------------------------------------------------------------------

## 13.5 Check whether a height is anchored

``` solidity
isAnchored(
    "atharv_123",
    1842
)
```

Returns:

``` text
true
```

------------------------------------------------------------------------

# 14. Complete Retrieval Model

``` mermaid
flowchart LR
    A[User / Frontend]

    A --> B{Known identifier?}

    B -- Global ID --> C[getAnchorById]
    B -- Chain ID --> D[getLatestAnchor]
    B -- Chain ID + Height --> E[getAnchorByHeight]

    C --> F[ChainAnchor]
    D --> F
    E --> F

    F --> G[id]
    F --> H[chainId]
    F --> I[chainHeight]
    F --> J[chainHash]
    F --> K[timestamp]
```

------------------------------------------------------------------------

# 15. Verification Concept

The Ethereum contract does not store the complete ThreadLens block.

Instead:

``` mermaid
flowchart TB
    A[Original ThreadLens Block]
    A --> B[Canonical Serialization]
    B --> C[SHA-256]
    C --> D[Calculated Hash]

    E[Ethereum Anchor]
    E --> F[Stored chainHash]

    D --> G{Hashes Match?}
    F --> G

    G -- Yes --> H[Hash matches Ethereum checkpoint]
    G -- No --> I[Hash does not match checkpoint]
```

If the independently calculated ThreadLens hash equals the Ethereum
anchor's `chainHash`, the supplied block/state matches the hash that was
previously committed to Ethereum.

This is a **cryptographic commitment**, not a claim that Ethereum
understands or validates the contents of the ThreadLens block.

------------------------------------------------------------------------

# 16. Timestamp Model

The contract deliberately does not accept a timestamp from ThreadLens.

During anchoring:

``` solidity
uint256 timestamp = block.timestamp;
```

Therefore:

``` text
ThreadLens timestamp
        │
        │ not used as Ethereum anchor timestamp
        ▼
Ethereum transaction
        │
        ▼
block.timestamp
        │
        ▼
ChainAnchor.timestamp
```

This gives the global anchor an Ethereum-side timestamp.

The ThreadLens block may retain its own `created_at` separately.

------------------------------------------------------------------------

# 17. What Is Stored On-Chain vs Off-Chain

  Data                       ThreadLens           Ethereum
  ----------------------- ------------- ------------------
  Complete block                    Yes                 No
  Commit metadata                   Yes                 No
  Findings                          Yes                 No
  Previous hash                     Yes                 No
  Current hash                      Yes                Yes
  Chain ID                          Yes                Yes
  Chain height                      Yes                Yes
  Anchor ID                 No/internal                Yes
  Ethereum timestamp                 No                Yes
  Transaction hash                   No   Ethereum network
  Ethereum block number              No   Ethereum network

### Separation

``` mermaid
flowchart TB
    subgraph TL[ThreadLens Internal System]
        A[Complete Blocks]
        B[Application Data]
        C[Findings]
        D[prev/current Hash Chain]
    end

    subgraph ETH[Ethereum]
        E[Anchor ID]
        F[chain_id]
        G[chain_height]
        H[chain_hash]
        I[block.timestamp]
    end

    D --> H
    A -. remains off-chain .-> TL
```

------------------------------------------------------------------------

# 18. Example End-to-End Scenario

ThreadLens currently has:

``` text
chain_id = atharv_123
current height = 1842
current hash = 53d199...
```

An anchor is requested.

### Step 1 --- ThreadLens prepares the anchor

``` json
{
  "chain_id": "atharv_123",
  "chain_height": 1842,
  "chain_hash": "53d199..."
}
```

### Step 2 --- ThreadLens calls Ethereum

``` solidity
anchorChain(
    "atharv_123",
    1842,
    0x53d199...
)
```

### Step 3 --- Contract assigns ID

``` text
id = 1
```

### Step 4 --- Contract assigns timestamp

``` text
timestamp = block.timestamp
```

### Step 5 --- Ethereum stores

``` json
{
  "id": 1,
  "chain_id": "atharv_123",
  "chain_height": 1842,
  "chain_hash": "53d199...",
  "timestamp": "Ethereum block timestamp"
}
```

### Step 6 --- Later retrieval

``` solidity
getAnchorById(1)
```

or:

``` solidity
getLatestAnchor("atharv_123")
```

or:

``` solidity
getAnchorByHeight("atharv_123", 1842)
```

------------------------------------------------------------------------

# 19. Important Architectural Boundaries

## ThreadLens Internal Blockchain

Responsible for:

-   Full block contents
-   Application-specific data
-   SHA-256 chain construction
-   `prev` references
-   `current` hashes
-   Internal chain integrity

## Ethereum Anchor Contract

Responsible for:

-   Public checkpoint storage
-   Global anchor IDs
-   Chain-specific height ordering
-   Duplicate-height prevention
-   On-chain timestamping
-   Public retrieval
-   Events

## Ethereum Network

Responsible for:

-   Transaction ordering
-   Consensus
-   Distributed state
-   Public availability
-   Tamper resistance of the contract state

------------------------------------------------------------------------

# 20. Contract State Model

``` mermaid
stateDiagram-v2
    [*] --> NoAnchors

    NoAnchors --> Anchored: anchorChain()

    Anchored --> Anchored: anchorChain(higher height)

    Anchored --> Anchored: getAnchorById()
    Anchored --> Anchored: getLatestAnchor()
    Anchored --> Anchored: getAnchorByHeight()
    Anchored --> Anchored: isAnchored()

    Anchored --> Rejected: invalid height
    Anchored --> Rejected: duplicate height
    Anchored --> Rejected: invalid hash

    Rejected --> Anchored: valid new anchor
```

------------------------------------------------------------------------

# 21. Security Properties of the Current Design

The current contract provides:

-   Sequential global anchor IDs.
-   Independent chain namespaces through `chain_id`.
-   Strictly increasing anchored heights per chain.
-   Duplicate height prevention.
-   Non-zero hash validation.
-   Ethereum-generated anchor timestamps.
-   Direct lookup by global ID.
-   Direct lookup by chain ID + height.
-   Latest-anchor lookup.
-   Event emission for external indexers.

It intentionally does **not** currently provide:

-   Role-based authorization.
-   Multi-signature authorization.
-   Upgradeability.
-   Contract ownership.
-   Emergency pause.
-   On-chain validation of the underlying ThreadLens block.
-   Storage of complete ThreadLens block data.

Those features should only be added if the ThreadLens deployment
architecture requires them.

------------------------------------------------------------------------

# 22. Core Contract API

  Function                   Purpose                              State-changing
  -------------------------- ---------------------------------- ----------------
  `anchorChain()`            Create an on-demand anchor                      Yes
  `getAnchorById()`          Retrieve by global ID                            No
  `getLatestAnchor()`        Retrieve latest anchor for chain                 No
  `getAnchorByHeight()`      Retrieve by chain + height                       No
  `getLatestChainHeight()`   Get latest anchored height                       No
  `getAnchorCount()`         Get total anchors                                No
  `isAnchored()`             Check whether height is anchored                 No

------------------------------------------------------------------------

# 23. Event Model

Every successful anchor emits:

``` solidity
event ChainAnchored(
    uint256 indexed id,
    string indexed chainId,
    uint256 chainHeight,
    bytes32 chainHash,
    uint256 timestamp
);
```

This allows backend services and blockchain indexers to discover new
anchors without repeatedly scanning contract storage.

``` mermaid
flowchart LR
    A[anchorChain] --> B[Contract Storage]
    A --> C[ChainAnchored Event]
    C --> D[Blockchain Indexer]
    D --> E[ThreadLens Backend]
    D --> F[Frontend / Explorer]
```

------------------------------------------------------------------------

# 24. Design Principle

The complete trust chain is:

``` text
ThreadLens Block
       ↓
Internal SHA-256 Hash Chain
       ↓
Selected Chain Height + Hash
       ↓
On-Demand Ethereum Anchor
       ↓
Ethereum Consensus
       ↓
Public Cryptographic Checkpoint
```

Ethereum is therefore used as the **global trust anchor**, while
ThreadLens remains responsible for its detailed internal blockchain.

------------------------------------------------------------------------

# 25. Final Canonical Model

The canonical ThreadLens → Ethereum anchor record is fixed as:

``` json
{
  "id": 1,
  "chain_id": "atharv_123",
  "chain_height": 1842,
  "chain_hash": "a81c...",
  "timestamp": "2026-09-03T06:00:00Z"
}
```

The Solidity representation is:

``` solidity
struct ChainAnchor {
    uint256 id;
    string chainId;
    uint256 chainHeight;
    bytes32 chainHash;
    uint256 timestamp;
}
```

The contract supports **on-demand anchoring**, permits gaps between
anchored heights, maintains independent ordering for each `chain_id`,
and provides direct retrieval by both **global `id`** and **`chain_id` +
`chain_height`**.
