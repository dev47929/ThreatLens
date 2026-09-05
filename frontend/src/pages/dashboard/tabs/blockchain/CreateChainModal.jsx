import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Trash2,
  Database,
  Shield,
  GitCommit,
  FolderGit2,
  Sparkles,
  Loader2,
  Check,
  Sliders,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { chainApi, repoApi } from "@/lib/api";
import { POPULAR_ATTACK_TYPES } from "@/lib/chainUtils";

export default function CreateChainModal({ isOpen, onClose, onChainCreated }) {
  const { token, user } = useAuth();

  // Extract accountId strictly
  const accountId = Number(user?.account_id || user?.account?.id || user?.id || 1);

  // Strictly lowercase letters [a-z]+
  const [chainName, setChainName] = useState("audit");
  const [includeUsage, setIncludeUsage] = useState(true);
  const [selectedRepos, setSelectedRepos] = useState([]);
  
  // Commits option with repo_id and limit
  const [commitsList, setCommitsList] = useState([
    { repo_id: 1, limit: 5 },
  ]);

  // Attacks option with type and limit
  const [attacksList, setAttacksList] = useState([]);

  const [availableRepos, setAvailableRepos] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Strictly formatted chain_id: {chain_name}_{account_id}
  const cleanName = chainName.trim().toLowerCase().replace(/[^a-z]/g, "") || "audit";
  const computedChainId = `${cleanName}_${accountId}`;

  useEffect(() => {
    if (isOpen && token) {
      setLoadingRepos(true);
      const fetchRepos = repoApi?.getRepositories || repoApi?.getRepos;
      if (typeof fetchRepos === "function") {
        fetchRepos
          .call(repoApi, token)
          .then((res) => {
            let repos = [];
            if (Array.isArray(res)) {
              repos = res;
            } else if (res && Array.isArray(res.repositories)) {
              repos = res.repositories;
            }
            setAvailableRepos(repos);
            if (repos.length > 0) {
              setSelectedRepos([repos[0].id]);
              setCommitsList([{ repo_id: repos[0].id, limit: 5 }]);
            }
          })
          .catch(() => {
            const fallback = [
              { id: 1, name: "ThreatLens / core-engine", full_name: "ThreatLens / core-engine" },
              { id: 2, name: "ThreatLens / auth-service", full_name: "ThreatLens / auth-service" },
            ];
            setAvailableRepos(fallback);
            setSelectedRepos([1]);
            setCommitsList([{ repo_id: 1, limit: 5 }]);
          })
          .finally(() => setLoadingRepos(false));
      } else {
        setLoadingRepos(false);
      }
    }
  }, [isOpen, token]);

  if (!isOpen) return null;

  // Add commit analysis rule with repo and limit
  const handleAddCommit = () => {
    const defaultRepoId = availableRepos[0]?.id || 1;
    setCommitsList((prev) => [...prev, { repo_id: defaultRepoId, limit: 5 }]);
  };

  // Add attack rule with type and limit
  const handleAddAttack = () => {
    setAttacksList((prev) => [...prev, { type: "ddos", limit: 10 }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!cleanName || !/^[a-z]+$/.test(cleanName)) {
      toast.error("Chain Name must contain small English letters (a-z) only");
      return;
    }

    // Genesis is always made internally by backend, no manual genesis payload needed!
    const payload = {
      chain_name: cleanName,
      chain_id: computedChainId,
      usage: includeUsage,
      repos: selectedRepos.map((rId) => ({ repo_id: Number(rId) })),
      commits: commitsList.map((c) => ({
        repo_id: Number(c.repo_id),
        limit: Math.max(1, Number(c.limit) || 5),
      })),
      attacks: attacksList.map((a) => ({
        type: a.type,
        limit: Math.max(1, Number(a.limit) || 10),
      })),
    };

    setIsSubmitting(true);
    const toastId = toast.loading(`Building internal chain '${computedChainId}'...`);

    try {
      const res = await chainApi.buildChain(token, payload);
      const createdId = res?.chain_id || computedChainId;
      toast.success(`Internal Chain '${createdId}' created successfully!`, { id: toastId });
      if (onChainCreated) {
        onChainCreated(createdId);
      }
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to build chain", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto select-none animate-in fade-in duration-150">
      <div className="bg-[#0e131b] border border-[#263544] rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl relative my-6 font-mono text-xs">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#212d3d]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2C6CB0]/20 border border-[#2C6CB0]/40 flex items-center justify-center text-[#6EA8DA]">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Create Internal Chain
              </h2>
              <p className="text-[11px] text-[#8a99ad] font-sans">
                Initial genesis block is generated internally by the system
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#8a99ad] hover:text-white hover:bg-[#1b2533] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Chain Name & Live Chain ID Preview */}
          <div className="p-3.5 rounded-xl bg-[#090d13] border border-[#1d2938] space-y-2.5">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-white uppercase tracking-wide flex items-center gap-1.5">
                  <span>Chain Name</span>
                  <span className="text-[10px] text-amber-400 font-normal lowercase">
                    (only small chars a-z)
                  </span>
                </label>
                <span className="text-[10px] text-[#8a99ad] font-mono">account_id: {accountId}</span>
              </div>
              <input
                type="text"
                required
                value={chainName}
                onChange={(e) => {
                  const sanitized = e.target.value.toLowerCase().replace(/[^a-z]/g, "");
                  setChainName(sanitized);
                }}
                placeholder="e.g. audit, security, telemetry"
                className="w-full bg-[#111722] border border-[#26374a] rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#38bdf8]"
                autoFocus
              />
            </div>

            {/* Generated Chain ID Indicator: {chain_name}_{account_id} */}
            <div className="p-2 rounded-lg bg-[#111822] border border-[#1f2c3d] flex flex-wrap items-center justify-between gap-2">
              <span className="text-[10px] uppercase text-[#8a99ad] font-semibold">
                Resulting Chain ID:
              </span>
              <span className="font-mono text-xs font-bold text-emerald-400 bg-[#080d14] px-2.5 py-1 rounded border border-emerald-500/30">
                {computedChainId}
              </span>
            </div>
            <p className="text-[10px] text-[#6f8398] font-sans leading-tight">
              Chain schema strictly adheres to <code className="text-[#38bdf8]">{`{chain_name}_{account_id}`}</code>.
            </p>
          </div>

          {/* Configuration Options: Commits, Repos, Attacks, Usage */}
          <div className="space-y-3 p-3.5 rounded-xl bg-[#090d13] border border-[#1c2635] max-h-80 overflow-y-auto">
            {/* 1. Account Usage Snapshot Toggle */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#111722] border border-[#212d3d]">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="font-bold text-white text-xs">Include Account Usage Block</div>
                  <div className="text-[10.5px] text-[#8a99ad] font-sans">
                    Inserts account metric snapshot block
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={includeUsage}
                onChange={(e) => setIncludeUsage(e.target.checked)}
                className="w-4 h-4 rounded text-[#2962FF] cursor-pointer"
              />
            </div>

            {/* 2. Commits Snapshot Option with Limit */}
            <div className="space-y-2 p-2.5 rounded-lg bg-[#111722] border border-[#212d3d]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                  <GitCommit className="w-3.5 h-3.5 text-[#38bdf8]" />
                  <span>Commits Snapshot & Limit</span>
                </div>
                <button
                  type="button"
                  onClick={handleAddCommit}
                  className="text-[10.5px] text-[#38bdf8] hover:text-[#7dd3fc] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Commits Rule</span>
                </button>
              </div>
              <p className="text-[10px] text-[#8a99ad] font-sans">
                Snapshot recent repository commit logs with a configurable fetch limit
              </p>

              {commitsList.length === 0 ? (
                <div className="text-[11px] text-[#6f8398] italic py-1">
                  No commit snapshots configured. Click "Add Commits Rule" to include git commits.
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  {commitsList.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex flex-wrap items-center gap-2 bg-[#090d13] p-2 rounded-lg border border-[#1b2533]"
                    >
                      <div className="flex-1 min-w-[140px]">
                        <span className="text-[9px] uppercase text-[#8a99ad] block mb-0.5">Repo</span>
                        <select
                          value={item.repo_id}
                          onChange={(e) => {
                            const updated = [...commitsList];
                            updated[idx].repo_id = Number(e.target.value);
                            setCommitsList(updated);
                          }}
                          className="w-full bg-[#111722] border border-[#26374a] rounded px-2 py-1 text-white text-[11px] font-mono focus:outline-none"
                        >
                          {availableRepos.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name || r.full_name || `Repo #${r.id}`}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-24">
                        <span className="text-[9px] uppercase text-[#8a99ad] block mb-0.5">Limit</span>
                        <div className="flex items-center gap-1">
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
                            className="w-full bg-[#111722] border border-[#26374a] rounded px-2 py-1 text-white text-center text-[11px] font-mono focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="pt-3">
                        <button
                          type="button"
                          onClick={() => setCommitsList(commitsList.filter((_, i) => i !== idx))}
                          className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Remove commit rule"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Monitored Repositories */}
            <div className="space-y-1.5 p-2.5 rounded-lg bg-[#111722] border border-[#212d3d]">
              <span className="text-[10.5px] font-bold text-[#8a99ad] uppercase flex items-center gap-1.5">
                <FolderGit2 className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span>Repository Metadata Blocks</span>
              </span>
              {loadingRepos ? (
                <div className="text-[#8a99ad] text-xs py-1 flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Loading repos...</span>
                </div>
              ) : availableRepos.length === 0 ? (
                <div className="text-[11px] text-[#8a99ad]">No repos detected.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                  {availableRepos.map((repo) => {
                    const isChecked = selectedRepos.includes(repo.id);
                    return (
                      <label
                        key={repo.id}
                        className={`flex items-center gap-2 p-2 rounded-md border text-[11px] cursor-pointer transition-colors ${
                          isChecked
                            ? "bg-[#182637] border-[#38bdf8] text-white"
                            : "bg-[#090d13] border-[#223142] text-[#8a99ad] hover:text-white"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRepos([...selectedRepos, repo.id]);
                            } else {
                              setSelectedRepos(selectedRepos.filter((id) => id !== repo.id));
                            }
                          }}
                          className="rounded text-[#2962FF]"
                        />
                        <span className="truncate">{repo.name || repo.full_name || `Repo #${repo.id}`}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 4. Attack Logs Option with Limit */}
            <div className="space-y-2 p-2.5 rounded-lg bg-[#111722] border border-[#212d3d]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>Attack Log Blocks & Limit</span>
                </div>
                <button
                  type="button"
                  onClick={handleAddAttack}
                  className="text-[10.5px] text-[#38bdf8] hover:text-[#7dd3fc] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Attack Rule</span>
                </button>
              </div>

              {attacksList.length === 0 ? (
                <div className="text-[11px] text-[#6f8398] italic py-1">
                  No attack telemetry configured (optional).
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  {attacksList.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex flex-wrap items-center gap-2 bg-[#090d13] p-2 rounded-lg border border-[#1b2533]"
                    >
                      <div className="flex-1 min-w-[140px]">
                        <span className="text-[9px] uppercase text-[#8a99ad] block mb-0.5">Attack Type</span>
                        <select
                          value={item.type}
                          onChange={(e) => {
                            const updated = [...attacksList];
                            updated[idx].type = e.target.value;
                            setAttacksList(updated);
                          }}
                          className="w-full bg-[#111722] border border-[#26374a] rounded px-2 py-1 text-white text-[11px]"
                        >
                          {POPULAR_ATTACK_TYPES.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-24">
                        <span className="text-[9px] uppercase text-[#8a99ad] block mb-0.5">Limit</span>
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
                          className="w-full bg-[#111722] border border-[#26374a] rounded px-2 py-1 text-white text-center text-[11px] font-mono focus:outline-none"
                        />
                      </div>

                      <div className="pt-3">
                        <button
                          type="button"
                          onClick={() => setAttacksList(attacksList.filter((_, i) => i !== idx))}
                          className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Remove attack rule"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-[#212d3d] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#141b24] hover:bg-[#1a232f] text-[#8a99ad] hover:text-white font-semibold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !chainName.trim()}
              className="px-5 py-2 rounded-lg bg-[#2962FF] hover:bg-[#1e4ed8] text-white font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/20 cursor-pointer transition-all active:scale-95 disabled:opacity-40"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Building Chain...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Build Chain ({computedChainId})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
