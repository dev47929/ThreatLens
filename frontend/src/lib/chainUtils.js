/**
 * ThreatLens Internal Blockchain Utilities
 * Hashing, block generation, verification modes & attack types
 */

import { formatBytes32Hash } from "./ethereum";
import { timeAgo } from "./api";

/**
 * Computes a SHA-256 hex string using browser Web Crypto API
 */
export async function computeSha256(data) {
  const text = typeof data === "string" ? data : JSON.stringify(data);
  const cryptoObj = typeof window !== "undefined" ? window.crypto : globalThis.crypto;
  if (cryptoObj?.subtle) {
    const msgBuffer = new TextEncoder().encode(text);
    const hashBuffer = await cryptoObj.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  return "0000000000000000000000000000000000000000000000000000000000000000";
}

/**
 * Computes the deterministic SHA-256 hash for a block
 */
export async function computeBlockHash(block) {
  // Canonical representation of the block data for SHA-256 calculation
  const canonicalPayload = JSON.stringify({
    index: block.index,
    type: block.type,
    data: block.data,
    created_at: block.created_at,
    prev: block.prev || null,
  });
  return await computeSha256(canonicalPayload);
}

/**
 * Constructs a valid next block ready to be appended to a chain
 */
export async function createNextBlock(prevBlock, type, data) {
  const index = prevBlock ? Number(prevBlock.index) + 1 : 0;
  const prev = prevBlock ? (prevBlock.current || null) : null;
  const created_at = new Date().toISOString();

  const blockCandidate = {
    index,
    type: type || "custom_state",
    data: data || {},
    created_at,
    prev,
  };

  const current = await computeBlockHash(blockCandidate);

  return {
    ...blockCandidate,
    current,
  };
}

/**
 * Verification modes supported by FastAPI @router.get("/{chain_id}/verify")
 */
export const VERIFY_MODES = [
  { id: "last", label: "Last N Blocks", description: "Verify from the tail backwards by N blocks" },
  { id: "full", label: "Full Chain Audit", description: "Audit from genesis block (0) to latest block" },
  { id: "latest", label: "Latest Block Only", description: "Verify cryptographic link of the head block" },
  { id: "single", label: "Single Specific Block", description: "Verify specific block target index" },
  { id: "from", label: "From Target to Head", description: "Verify starting from target index up to head" },
  { id: "till", label: "Genesis Till Target", description: "Verify from genesis index 0 up to target" },
];

/**
 * Predefined attack types specified by backend schema:
 * ddos, data_burning, xss, sqli, proxy_origin
 */
export const ATTACK_TYPES = [
  { id: "ddos", label: "DDoS", description: "Distributed Denial of Service attack telemetry" },
  { id: "data_burning", label: "Data Burning", description: "Data depletion / exfiltration telemetry" },
  { id: "xss", label: "XSS", description: "Cross-Site Scripting detection payload" },
  { id: "sqli", label: "SQLi", description: "SQL Injection query attempt snapshot" },
  { id: "proxy_origin", label: "Proxy Origin", description: "Proxy origin header spoofing telemetry" },
];

export const POPULAR_ATTACK_TYPES = ATTACK_TYPES;

export { formatBytes32Hash, timeAgo };
