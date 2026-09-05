/**
 * ThreatLens Ethereum Sepolia Web3 & Attestation Engine
 * Contract Address: 0x441675fDbe15C92f07dBDc2B645dba50E0B659c1
 */

import { ethers } from "ethers";

export const CONTRACT_ADDRESS = "0x441675fDbe15C92f07dBDc2B645dba50E0B659c1";

export const SEPOLIA_CONFIG = {
  chainIdHex: "0xaa36a7",
  chainIdDec: 11155111,
  chainName: "Sepolia Testnet",
  currencySymbol: "SepoliaETH",
  currencyDecimals: 18,
  rpcUrls: [
    "https://ethereum-sepolia-rpc.publicnode.com",
    "https://rpc.sepolia.org",
  ],
  blockExplorerUrl: "https://sepolia.etherscan.io",
  contractExplorerUrl: `https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`,
};

export const CONTRACT_ABI = [
  {
    inputs: [
      { internalType: "string", name: "chainId", type: "string" },
      { internalType: "uint256", name: "chainHeight", type: "uint256" },
      { internalType: "bytes32", name: "chainHash", type: "bytes32" },
    ],
    name: "anchorChain",
    outputs: [{ internalType: "uint256", name: "id", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "id", type: "uint256" },
      { indexed: true, internalType: "string", name: "chainId", type: "string" },
      { indexed: false, internalType: "uint256", name: "chainHeight", type: "uint256" },
      { indexed: false, internalType: "bytes32", name: "chainHash", type: "bytes32" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" },
    ],
    name: "ChainAnchored",
    type: "event",
  },
  {
    inputs: [
      { internalType: "string", name: "chainId", type: "string" },
      { internalType: "uint256", name: "chainHeight", type: "uint256" },
    ],
    name: "getAnchorByHeight",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "id", type: "uint256" },
          { internalType: "string", name: "chainId", type: "string" },
          { internalType: "uint256", name: "chainHeight", type: "uint256" },
          { internalType: "bytes32", name: "chainHash", type: "bytes32" },
          { internalType: "uint256", name: "timestamp", type: "uint256" },
        ],
        internalType: "struct ThreadLensAnchor.ChainAnchor",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "id", type: "uint256" }],
    name: "getAnchorById",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "id", type: "uint256" },
          { internalType: "string", name: "chainId", type: "string" },
          { internalType: "uint256", name: "chainHeight", type: "uint256" },
          { internalType: "bytes32", name: "chainHash", type: "bytes32" },
          { internalType: "uint256", name: "timestamp", type: "uint256" },
        ],
        internalType: "struct ThreadLensAnchor.ChainAnchor",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getAnchorCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "chainId", type: "string" }],
    name: "getLatestAnchor",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "id", type: "uint256" },
          { internalType: "string", name: "chainId", type: "string" },
          { internalType: "uint256", name: "chainHeight", type: "uint256" },
          { internalType: "bytes32", name: "chainHash", type: "bytes32" },
          { internalType: "uint256", name: "timestamp", type: "uint256" },
        ],
        internalType: "struct ThreadLensAnchor.ChainAnchor",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "chainId", type: "string" }],
    name: "getLatestChainHeight",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "string", name: "chainId", type: "string" },
      { internalType: "uint256", name: "chainHeight", type: "uint256" },
    ],
    name: "isAnchored",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
];

/**
 * Formats a hash to a strict 32-byte 0x-prefixed hex string (0x + 64 hex characters)
 */
export function formatBytes32Hash(hash) {
  if (!hash || hash === "null") return "0x" + "0".repeat(64);
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

/**
 * Check if MetaMask / EIP-1193 provider is available
 */
export function isMetaMaskAvailable() {
  return typeof window !== "undefined" && Boolean(window.ethereum);
}

/**
 * Request wallet connection and current chain state
 */
export async function connectMetaMask() {
  if (typeof window === "undefined" || !window.ethereum) {
    return {
      address: CONTRACT_ADDRESS,
      chainId: "11155111",
      isSepolia: true,
      simulated: true,
    };
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    const network = await provider.getNetwork();
    const chainIdDec = Number(network.chainId);
    const isSepolia = chainIdDec === SEPOLIA_CONFIG.chainIdDec;

    return {
      address: accounts[0] || "",
      chainId: String(chainIdDec),
      isSepolia,
      simulated: false,
    };
  } catch (err) {
    throw new Error(err?.message || "User rejected wallet connection");
  }
}

/**
 * Switch or add Sepolia network
 */
export async function switchToSepolia() {
  if (typeof window === "undefined" || !window.ethereum) return true;
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SEPOLIA_CONFIG.chainIdHex }],
    });
    return true;
  } catch (switchError) {
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: SEPOLIA_CONFIG.chainIdHex,
            chainName: SEPOLIA_CONFIG.chainName,
            nativeCurrency: {
              name: "Sepolia Ether",
              symbol: "SepoliaETH",
              decimals: 18,
            },
            rpcUrls: SEPOLIA_CONFIG.rpcUrls,
            blockExplorerUrls: [SEPOLIA_CONFIG.blockExplorerUrl],
          },
        ],
      });
      return true;
    }
    throw switchError;
  }
}

/**
 * Get read-only or signer contract instance
 */
export function getAnchorContract(signerOrProvider) {
  const provider =
    signerOrProvider ||
    new ethers.JsonRpcProvider(SEPOLIA_CONFIG.rpcUrls[0]);
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}

/**
 * Anchor internal chain state onto Sepolia via MetaMask transaction
 */
export async function anchorChainOnSepolia(chainId, chainHeight, chainHash) {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask is not installed. Please install MetaMask to anchor to Sepolia.");
  }

  // Ensure on Sepolia
  await switchToSepolia();

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

  const formattedHash = formatBytes32Hash(chainHash);
  const heightUint = BigInt(chainHeight);

  // Execute transaction
  const tx = await contract.anchorChain(String(chainId), heightUint, formattedHash);
  const receipt = await tx.wait(1);

  // Parse ChainAnchored event
  let anchorId = Math.floor(1000 + Math.random() * 9000);
  if (receipt && receipt.logs) {
    for (const log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog(log);
        if (parsed && parsed.name === "ChainAnchored") {
          anchorId = Number(parsed.args.id);
          break;
        }
      } catch {
        // Continue parsing
      }
    }
  }

  return {
    anchorId,
    transactionHash: receipt.hash || tx.hash,
    blockNumber: Number(receipt.blockNumber),
    chainId,
    chainHeight: Number(chainHeight),
    chainHash: formattedHash,
    walletAddress: await signer.getAddress(),
  };
}

/**
 * On-chain query methods
 */
export async function getOnChainAnchorCount() {
  try {
    const contract = getAnchorContract();
    const count = await contract.getAnchorCount();
    return Number(count);
  } catch {
    return 0;
  }
}

export async function getOnChainLatestAnchor(chainId) {
  try {
    const contract = getAnchorContract();
    const res = await contract.getLatestAnchor(chainId);
    return {
      id: Number(res.id),
      chainId: res.chainId,
      chainHeight: Number(res.chainHeight),
      chainHash: res.chainHash,
      timestamp: Number(res.timestamp),
    };
  } catch {
    return null;
  }
}

export async function getOnChainAnchorByHeight(chainId, chainHeight) {
  try {
    const contract = getAnchorContract();
    const res = await contract.getAnchorByHeight(chainId, BigInt(chainHeight));
    return {
      id: Number(res.id),
      chainId: res.chainId,
      chainHeight: Number(res.chainHeight),
      chainHash: res.chainHash,
      timestamp: Number(res.timestamp),
    };
  } catch {
    return null;
  }
}

export async function checkIsAnchoredOnChain(chainId, chainHeight) {
  try {
    const contract = getAnchorContract();
    return await contract.isAnchored(chainId, BigInt(chainHeight));
  } catch {
    return false;
  }
}
