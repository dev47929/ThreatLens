/**
 * ThreatLens Ethereum Sepolia Web3 & Anchor Integration
 */

export const CONTRACT_ADDRESS = "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7";

export const SEPOLIA_CONFIG = {
  chainIdHex: "0xaa36a7",
  chainIdDec: 11155111,
  chainName: "Sepolia Testnet",
  currencySymbol: "ETH",
  currencyDecimals: 18,
  rpcUrls: ["https://rpc.sepolia.org"],
  blockExplorerUrl: "https://sepolia.etherscan.io",
};

/**
 * Formats a 32-byte hash (SHA-256 or keccak256) into canonical 0x... (64 hex characters)
 */
export function formatBytes32Hash(hash) {
  if (!hash || hash === "null") return "0x" + "0".repeat(64);
  let clean = String(hash).trim();
  if (clean.startsWith("0x") || clean.startsWith("0X")) {
    clean = clean.slice(2);
  }
  return "0x" + clean.padEnd(64, "0").slice(0, 64);
}

/**
 * Check if MetaMask / Web3 provider is present in browser window
 */
export function isMetaMaskAvailable() {
  return typeof window !== "undefined" && Boolean(window.ethereum);
}

/**
 * Connect to MetaMask wallet, requests accounts and returns status
 */
export async function connectMetaMask() {
  if (typeof window === "undefined" || !window.ethereum) {
    // Return simulated address if MetaMask extension is not installed
    return {
      address: "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7",
      chainId: "11155111",
      isSepolia: true,
      simulated: true,
    };
  }

  try {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    const chainIdHex = await window.ethereum.request({
      method: "eth_chainId",
    });

    const chainIdDec = parseInt(chainIdHex, 16);
    const isSepolia = chainIdDec === SEPOLIA_CONFIG.chainIdDec;

    return {
      address: accounts[0] || "",
      chainId: String(chainIdDec),
      isSepolia,
      simulated: false,
    };
  } catch (err) {
    throw new Error(err?.message || "Failed to connect MetaMask");
  }
}

/**
 * Request network switch to Sepolia
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
    // If chain is not added, request to add it
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: SEPOLIA_CONFIG.chainIdHex,
            chainName: SEPOLIA_CONFIG.chainName,
            nativeCurrency: {
              name: "Sepolia Ether",
              symbol: "ETH",
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
