import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Code,
  Shield,
  Sparkles,
  Loader2,
  Copy,
  Check,
  Hash,
  FolderGit2,
  GitCommit,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { chainApi, repoApi } from "@/lib/api";
import { createNextBlock, POPULAR_ATTACK_TYPES } from "@/lib/chainUtils";

const TEMPLATES = [
  {
    label: "Security Audit",
    type: "audit_checkpoint",
    data: {
      auditor: "Security Operations Center",
      status: "PASSED",
      vulnerabilities_checked: 24,
      severity: "LOW",
    },
  },
  {
    label: "Incident Report",
    type: "incident_containment",
    data: {
      incident_id: "INC-8921",
      threat_vector: "brute_force_ssh",
      mitigation: "IP blacklisted in firewall rule #410",
      contained: true,
    },
  },
  {
    label: "Deploy State",
    type: "deployment_verification",
    data: {
      environment: "production",
      release_tag: "v2.4.1",
      commit_sha: "7f8b92c",
      approved_by: "devops-lead",
    },
  },
];

export default function AppendBlockModal({
  isOpen,
  onClose,
  chainId,
  latestBlock,
  onBlockAppended,
}) {
  const { token } = useAuth();
  const [appendMode, setAppendMode] = useState("custom"); // "custom" | "snapshot"
  const [blockType, setBlockType] = useState("audit_checkpoint");
  const [jsonText, setJsonText] = useState(
    JSON.stringify(
      {
        auditor: "ThreatLens Security Engine",
        status: "VERIFIED",
        findings: 0,
        attestation: "tamper-proof",
      },
      null,
      2
    )
  );

  const [includeUsage, setIncludeUsage] = useState(false);
  const [selectedRepos, setSelectedRepos] = useState([]);
  const [commitsList, setCommitsList] = useState([]);
  const [attacksList, setAttacksList] = useState([]);

  const [availableRepos, setAvailableRepos] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [computedCandidate, setComputedCandidate] = useState(null);
  const [copiedHash, setCopiedHash] = useState(false);

  // Fetch repos if snapshot mode is opened
  useEffect(() => {
    if (isOpen && token) {
      setLoadingRepos(true);
      const fetchRepos = repoApi?.getRepositories || repoApi?.getRepos;
      if (typeof fetchRepos === "function") {
        fetchRepos
          .call(repoApi, token)
          .then((res) => {
            if (Array.isArray(res)) setAvailableRepos(res);
            else if (res && Array.isArray(res.repositories)) setAvailableRepos(res.repositories);
          })
          .catch(() => {
            setAvailableRepos([
              { id: 1, name: "ThreatLens / core-engine" },
              { id: 2, name: "ThreatLens / auth-service" },
            ]);
          })
          .finally(() => setLoadingRepos(false));
      } else {
        setLoadingRepos(false);
      }
    }
  }, [isOpen, token]);

  // Compute live candidate block whenever input changes
  useEffect(() => {
    if (appendMode !== "custom") return;
    let parsedData = {};
    try {
      parsedData = JSON.parse(jsonText);
    } catch {
      setComputedCandidate(null);
      return;
    }

    createNextBlock(latestBlock, blockType, parsedData).then((candidate) => {
      setComputedCandidate(candidate);
    });
  }, [latestBlock, blockType, jsonText, appendMode]);

  if (!isOpen) return null;

  const handleApplyTemplate = (tmpl) => {
    setBlockType(tmpl.type);
    setJsonText(JSON.stringify(tmpl.data, null, 2));
    toast.info(`Loaded template: ${tmpl.label}`);
  };

  const handleCopyHash = (hash) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 1800);
  };

  const handleAddCommit = () => {
    const defaultRepoId = availableRepos[0]?.id || 1;
    setCommitsList((prev) => [...prev, { repo_id: defaultRepoId, limit: 5 }]);
  };

  const handleAddAttack = () => {
    setAttacksList([...attacksList, { type: "ddos", limit: 10 }]);
  };

  const handleAppendSubmit = async (e) => {
    e.preventDefault();

    let customPayload = [];
    if (appendMode === "custom") {
      let parsedData = {};
      try {
        parsedData = JSON.parse(jsonText);
      } catch {
        toast.error("JSON payload contains syntax errors");
        return;
      }
      customPayload = [
        {
          type: blockType.trim() || "custom_event",
          data: parsedData,
        },
      ];
    }

    // Extract clean chain_name if chainId is like audit_1.json or audit_1
    const chainName = chainId ? chainId.replace(/\.json$/, "").replace(/_\d+$/, "") : "";

    const payload = {
      chain_name: chainName || chainId,
      chain_id: chainId,
      usage: appendMode === "snapshot" ? includeUsage : false,
      repos: appendMode === "snapshot" ? selectedRepos.map((id) => ({ repo_id: Number(id) })) : [],
      commits: appendMode === "snapshot" ? commitsList.map((c) => ({ repo_id: Number(c.repo_id), limit: Number(c.limit) })) : [],
      attacks: appendMode === "snapshot" ? attacksList.map((a) => ({ type: a.type, limit: Number(a.limit) })) : [],
      custom: customPayload,
    };

    setIsSubmitting(true);
    const toastId = toast.loading(`Appending block to chain '${chainId}'...`);

    try {
      const res = await chainApi.buildChain(token, payload);
      toast.success(`Block appended to chain '${chainId}' successfully!`, { id: toastId });

      if (onBlockAppended) {
        onBlockAppended(computedCandidate, res);
      }
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to append to chain", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextIndex = latestBlock ? Number(latestBlock.index) + 1 : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto select-none animate-in fade-in duration-150">
      <div className="bg-[#0e131b] border border-[#263544] rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative my-6 font-mono text-xs">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#212d3d]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#38bdf8]/20 border border-[#38bdf8]/40 flex items-center justify-center text-[#38bdf8]">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Append Block to Chain
              </h2>
              <p className="text-[11px] text-[#8a99ad] font-sans">
                Appends next state snapshot via <code className="text-[#38bdf8]">POST /chain/build</code>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#8a99ad] hover:text-white hover:bg-[#1b2533] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chain Target & Height Pill */}
        <div className="grid grid-cols-2 gap-2 my-3 p-2.5 rounded-xl bg-[#090d13] border border-[#1b2533]">
          <div>
            <div className="text-[10px] text-[#8a99ad] uppercase">Parent Head Block</div>
            <div className="text-white font-bold mt-0.5">#{latestBlock?.index ?? 0}</div>
            <div className="text-[10px] text-[#63758b] truncate">
              {latestBlock?.current ? `${latestBlock.current.slice(0, 10)}...` : "Genesis"}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-[#38bdf8] uppercase font-bold flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              <span>Next Block</span>
            </div>
            <div className="text-[#38bdf8] font-bold mt-0.5">#{nextIndex}</div>
            <div className="text-[10px] text-emerald-400 truncate">
              {chainId}
            </div>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1.5 mb-3 p-1 rounded-lg bg-[#090d13] border border-[#1b2533] text-[11px]">
          <button
            type="button"
            onClick={() => setAppendMode("custom")}
            className={`flex-1 py-1.5 rounded-md font-semibold transition-all flex items-center justify-center gap-1.5 ${
              appendMode === "custom"
                ? "bg-[#2962FF] text-white shadow-sm"
                : "text-[#8a99ad] hover:text-white"
            }`}
          >
            <Code className="w-3 h-3" />
            <span>Custom JSON Block</span>
          </button>
          <button
            type="button"
            onClick={() => setAppendMode("snapshot")}
            className={`flex-1 py-1.5 rounded-md font-semibold transition-all flex items-center justify-center gap-1.5 ${
              appendMode === "snapshot"
                ? "bg-[#2962FF] text-white shadow-sm"
                : "text-[#8a99ad] hover:text-white"
            }`}
          >
            <Shield className="w-3 h-3" />
            <span>Telemetry Snapshot</span>
          </button>
        </div>

        <form onSubmit={handleAppendSubmit} className="space-y-3">
          {/* Custom Mode */}
          {appendMode === "custom" && (
            <>
              {/* Quick Template pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <span className="text-[10px] text-[#8a99ad] shrink-0">Templates:</span>
                {TEMPLATES.map((tmpl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleApplyTemplate(tmpl)}
                    className="px-2 py-0.5 rounded bg-[#111722] hover:bg-[#1a2534] border border-[#203043] text-[#7dd3fc] hover:text-white text-[10.5px] shrink-0 transition-colors"
                  >
                    {tmpl.label}
                  </button>
                ))}
              </div>

              {/* Block Type */}
              <div className="space-y-1">
                <label className="text-[10.5px] uppercase font-bold text-[#8a99ad]">
                  Block Type
                </label>
                <input
                  type="text"
                  required
                  value={blockType}
                  onChange={(e) => setBlockType(e.target.value)}
                  placeholder="e.g. audit_checkpoint"
                  className="w-full bg-[#090d13] border border-[#212f3f] rounded-lg px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-[#38bdf8]"
                />
              </div>

              {/* JSON Textarea */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] text-[#8a99ad]">
                  <span className="uppercase font-bold">Data Payload (JSON)</span>
                  <span>Strict JSON syntax</span>
                </div>
                <textarea
                  rows={4}
                  required
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  className="w-full bg-[#090d13] border border-[#212f3f] rounded-lg p-2.5 text-emerald-300 font-mono text-xs focus:outline-none focus:border-[#38bdf8] leading-relaxed"
                />
              </div>

              {/* Predicted SHA-256 Hash Preview */}
              {computedCandidate && (
                <div className="p-2.5 rounded-xl bg-[#090d13] border border-[#1b2533] space-y-1">
                  <div className="flex items-center justify-between text-[9.5px] text-[#8a99ad] uppercase">
                    <span className="flex items-center gap-1 font-bold text-white">
                      <Hash className="w-2.5 h-2.5 text-[#38bdf8]" />
                      <span>Next Block SHA-256 Hash</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyHash(computedCandidate.current)}
                      className="text-[#38bdf8] hover:underline flex items-center gap-1"
                    >
                      {copiedHash ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <span>Copy</span>
                      )}
                    </button>
                  </div>
                  <div className="break-all font-mono text-[10.5px] text-[#38bdf8] bg-[#111722] p-1.5 rounded border border-[#1e2a39]">
                    {computedCandidate.current}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Telemetry Snapshot Mode */}
          {appendMode === "snapshot" && (
            <div className="space-y-3 p-3 rounded-xl bg-[#090d13] border border-[#1b2533] max-h-56 overflow-y-auto">
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#111722] border border-[#202d3c]">
                <div>
                  <div className="font-bold text-white text-xs">Snapshot Account Usage</div>
                  <div className="text-[10px] text-[#8a99ad]">Appends current usage block</div>
                </div>
                <input
                  type="checkbox"
                  checked={includeUsage}
                  onChange={(e) => setIncludeUsage(e.target.checked)}
                  className="rounded text-[#2962FF] w-4 h-4 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-[#8a99ad] flex items-center gap-1">
                  <FolderGit2 className="w-3 h-3 text-[#38bdf8]" />
                  <span>Select Repositories</span>
                </span>
                {availableRepos.map((repo) => {
                  const isChecked = selectedRepos.includes(repo.id);
                  return (
                    <label
                      key={repo.id}
                      className={`flex items-center gap-2 p-1.5 rounded border text-[11px] cursor-pointer ${
                        isChecked
                          ? "bg-[#182637] border-[#38bdf8] text-white"
                          : "bg-[#111722] border-[#223142] text-[#8a99ad] hover:text-white"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedRepos([...selectedRepos, repo.id]);
                          else setSelectedRepos(selectedRepos.filter((id) => id !== repo.id));
                        }}
                        className="rounded text-[#2962FF]"
                      />
                      <span className="truncate">{repo.name || repo.full_name}</span>
                    </label>
                  );
                })}
              </div>

              {/* Commits Option with Limit */}
              <div className="space-y-2 p-2 rounded-lg bg-[#111722] border border-[#202d3c]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-white flex items-center gap-1">
                    <GitCommit className="w-3 h-3 text-[#38bdf8]" />
                    <span>Commits Snapshot & Limit</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleAddCommit}
                    className="text-[10px] text-[#38bdf8] hover:underline cursor-pointer"
                  >
                    + Add Commits
                  </button>
                </div>
                {commitsList.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-[#090d13] p-1.5 rounded border border-[#1e2a38]">
                    <select
                      value={item.repo_id}
                      onChange={(e) => {
                        const updated = [...commitsList];
                        updated[idx].repo_id = Number(e.target.value);
                        setCommitsList(updated);
                      }}
                      className="bg-[#111722] border border-[#26374a] rounded px-2 py-1 text-white text-[11px] flex-1 font-mono"
                    >
                      {availableRepos.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name || r.full_name || `Repo #${r.id}`}
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-[#8a99ad]">Limit:</span>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={item.limit}
                        onChange={(e) => {
                          const updated = [...commitsList];
                          updated[idx].limit = Math.max(1, Number(e.target.value));
                          setCommitsList(updated);
                        }}
                        className="w-12 bg-[#111722] border border-[#26374a] rounded px-1 py-0.5 text-white text-center text-[11px] font-mono"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setCommitsList(commitsList.filter((_, i) => i !== idx))}
                      className="text-rose-400 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-[10px] text-[#8a99ad]">
                  <span className="uppercase font-bold">Attack Telemetry & Limit</span>
                  <button
                    type="button"
                    onClick={handleAddAttack}
                    className="text-[#38bdf8] hover:underline cursor-pointer"
                  >
                    + Add Rule
                  </button>
                </div>
                {attacksList.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-[#111722] p-1.5 rounded border border-[#202d3c]">
                    <select
                      value={item.type}
                      onChange={(e) => {
                        const updated = [...attacksList];
                        updated[idx].type = e.target.value;
                        setAttacksList(updated);
                      }}
                      className="bg-[#090d13] border border-[#26374a] rounded px-2 py-1 text-white text-[11px] flex-1"
                    >
                      {POPULAR_ATTACK_TYPES.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-[#8a99ad]">Limit:</span>
                      <input
                        type="number"
                        min="1"
                        max="200"
                        value={item.limit}
                        onChange={(e) => {
                          const updated = [...attacksList];
                          updated[idx].limit = Math.max(1, Number(e.target.value));
                          setAttacksList(updated);
                        }}
                        className="w-12 bg-[#090d13] border border-[#26374a] rounded px-1 py-0.5 text-white text-center text-[11px] font-mono"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttacksList(attacksList.filter((_, i) => i !== idx))}
                      className="text-rose-400 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-2 border-t border-[#212d3d] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#141b24] hover:bg-[#1a232f] text-[#8a99ad] hover:text-white font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-[#2962FF] hover:bg-[#1e4ed8] text-white font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/20 cursor-pointer transition-all active:scale-95 disabled:opacity-40"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Appending...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Append Block</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
