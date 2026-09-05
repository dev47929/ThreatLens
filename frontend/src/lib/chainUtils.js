/**
 * ThreatLens Blockchain Utilities
 * Provides canonical SHA-256 block hashing and chain presets matching ThreatLens backend spec.
 */

export const POPULAR_ATTACK_TYPES = [
  { id: "ddos", label: "DDoS Attack (Distributed Denial of Service)" },
  { id: "data_burning", label: "Data Burning Attack" },
  { id: "sqli", label: "SQL Injection (SQLi)" },
  { id: "xss", label: "Cross-Site Scripting (XSS)" },
  { id: "origin_proxy", label: "Origin Proxy Exhaustion" },
  { id: "credential_stuffing", label: "Credential Stuffing" },
];

/**
 * Deterministic JSON stringifier with key sorting and strict separators (',', ':'),
 * matching Python json.dumps(..., sort_keys=True, separators=(',', ':'), ensure_ascii=False).
 */
export function canonicalStringify(obj) {
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return "[" + obj.map(canonicalStringify).join(",") + "]";
  }
  const sortedKeys = Object.keys(obj).sort();
  const pairs = sortedKeys.map(
    (key) => `${JSON.stringify(key)}:${canonicalStringify(obj[key])}`
  );
  return "{" + pairs.join(",") + "}";
}

/**
 * Compute SHA-256 hex digest of a string using Web Crypto API.
 */
export async function sha256Hex(str) {
  const cryptoObj = typeof window !== "undefined" ? window.crypto : globalThis.crypto;
  if (cryptoObj?.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await cryptoObj.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  return "0000000000000000000000000000000000000000000000000000000000000000";
}

/**
 * Compute candidate next block with canonical SHA-256 current hash
 */
export async function createNextBlock(latestBlock, blockType, data = {}) {
  const nextIndex = latestBlock ? Number(latestBlock.index) + 1 : 0;
  const prevHash = latestBlock ? latestBlock.current : null;
  const createdAt = new Date().toISOString();

  const blockWithoutCurrent = {
    index: nextIndex,
    type: blockType || "custom_event",
    data: data,
    created_at: createdAt,
    prev: prevHash,
  };

  const canonical = canonicalStringify(blockWithoutCurrent);
  const current = await sha256Hex(canonical);

  return {
    ...blockWithoutCurrent,
    current,
  };
}
