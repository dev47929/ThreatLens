import React, { useState, useEffect } from "react";
import {
  GitCommit,
  ShieldAlert,
  ShieldCheck,
  Search,
  Copy,
  Check,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileCode,
  ArrowUpRight,
  Download,
  Filter,
  Loader2,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { repoApi, severityColor, timeAgo } from "@/lib/api";
import Pagination from "@/components/common/Pagination";

export default function CommitsTab({
  onInspectCommit,
  selectedRepoId: initialRepoId,
  onSelectRepoId,
}) {
  const { token } = useAuth();
  const [repos, setRepos] = useState([]);
  const [selectedRepoId, setSelectedRepoId] = useState(initialRepoId || null);
  const [commits, setCommits] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(() => {
    try {
      const saved = localStorage.getItem("threatlens_commits_limit");
      return saved ? Math.min(100, Math.max(5, parseInt(saved, 10) || 10)) : 10;
    } catch {
      return 10;
    }
  });

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setPage(1);
    try {
      localStorage.setItem("threatlens_commits_limit", String(newLimit));
    } catch {}
  };

  const [loading, setLoading] = useState(true);
  const [loadingCommits, setLoadingCommits] = useState(false);

  // Sync state if initialRepoId prop changes from navigation
  useEffect(() => {
    if (initialRepoId) {
      setSelectedRepoId(initialRepoId);
      setPage(1);
    }
  }, [initialRepoId]);

  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [expandedCommitSha, setExpandedCommitSha] = useState(null);
  const [analyzingSha, setAnalyzingSha] = useState(null);
  const [aiAnalysisResults, setAiAnalysisResults] = useState({});
  const [copiedSha, setCopiedSha] = useState(null);

  // Fetch repos
  useEffect(() => {
    const fetchRepos = async () => {
      if (!token) return;
      try {
        const data = await repoApi.getRepos(token);
        const repoList = Array.isArray(data) ? data : [];
        setRepos(repoList);
        if (repoList.length > 0) {
          setSelectedRepoId((current) => {
            if (initialRepoId && repoList.some((r) => r.id === initialRepoId)) {
              return initialRepoId;
            }
            if (current && repoList.some((r) => r.id === current)) {
              return current;
            }
            return repoList[0].id;
          });
        }
      } catch {
        toast.error("Failed to load repositories");
      } finally {
        setLoading(false);
      }
    };
    fetchRepos();
  }, [token, initialRepoId]);

  // Fetch commits when repo or page changes
  useEffect(() => {
    const fetchCommits = async () => {
      if (!token || !selectedRepoId) return;
      setLoadingCommits(true);
      try {
        const res = await repoApi.getCommits(token, selectedRepoId, page, limit);
        setCommits(res?.data || []);
      } catch {
        toast.error("Failed to load commits");
        setCommits([]);
      } finally {
        setLoadingCommits(false);
      }
    };
    fetchCommits();
  }, [token, selectedRepoId, page, limit]);

  const selectedRepo = repos.find((r) => r.id === selectedRepoId);

  const filteredCommits = commits.filter((c) => {
    const msg = c.commit?.message || "";
    const sha = c.commit?.short_sha || "";
    const author = c.commit?.author_name || "";
    const matchesSearch =
      msg.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sha.toLowerCase().includes(searchQuery.toLowerCase()) ||
      author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity =
      severityFilter === "all" || (c.summary?.risk_level || "").toLowerCase() === severityFilter.toLowerCase();
    return matchesSearch && matchesSeverity;
  });

  // Dynamic total commits calculation:
  // Uses selectedRepo.commit_count if available, or derives from loaded pages.
  const repoCommitCount = selectedRepo?.commit_count || 0;
  const totalCommits =
    repoCommitCount > 0
      ? commits.length < limit && (page - 1) * limit + commits.length < repoCommitCount
        ? (page - 1) * limit + commits.length
        : Math.max(repoCommitCount, (page - 1) * limit + commits.length)
      : commits.length < limit
      ? (page - 1) * limit + commits.length
      : Math.max(page * limit + 1, (page - 1) * limit + commits.length);

  const totalPages = Math.max(1, Math.ceil(totalCommits / limit));

  // Computed KPIs
  const totalFindings = commits.reduce((s, c) => s + (c.summary?.findings || 0), 0);
  const criticalCount = commits.reduce((s, c) => s + (c.summary?.critical || 0), 0);
  const avgRisk = commits.length > 0
    ? Math.round(commits.reduce((s, c) => s + (c.summary?.risk_score || 0), 0) / commits.length)
    : 0;
  const cleanRate = commits.length > 0
    ? Math.round(((commits.filter((c) => (c.summary?.findings || 0) === 0).length) / commits.length) * 100 * 10) / 10
    : 100;

  const handleCopySha = (sha, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(sha);
    setCopiedSha(sha);
    toast.success(`Commit SHA ${sha.slice(0, 7)} copied!`);
    setTimeout(() => setCopiedSha(null), 2000);
  };

  const handleRunAiReview = async (commitData, e) => {
    e.stopPropagation();
    const sha = commitData.commit?.short_sha || commitData.commit?.sha?.slice(0, 7);
    setAnalyzingSha(sha);
    toast.info(`Running ThreatLens AI analysis on commit ${sha}...`);
    try {
      const result = await repoApi.analyzeCommit(selectedRepo?.url || "", {
        commit: commitData.commit,
        summary: commitData.summary,
        findings: commitData.findings,
      });
      setAiAnalysisResults((prev) => ({
        ...prev,
        [sha]: result,
      }));
      toast.success(`AI Security Review generated for ${sha}!`);
    } catch {
      toast.error("Failed to run AI analysis.");
    } finally {
      setAnalyzingSha(null);
    }
  };

  return (
    <div className="space-y-7">
      {/* Top Page Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 pb-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Analyzed Git Commits</h1>
          <p className="text-xs text-[#8a99ad] mt-1">
            {selectedRepo
              ? `GET /repo/${selectedRepo.id}/commits · ${selectedRepo.username}/${selectedRepo.name}`
              : "Select a repository to view commits"}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {/* Repo Selector */}
          {repos.length > 0 && (
            <select
              value={selectedRepoId || ""}
              onChange={(e) => {
                const newId = Number(e.target.value);
                setSelectedRepoId(newId);
                if (onSelectRepoId) onSelectRepoId(newId);
                setPage(1);
              }}
              className="px-3 py-2 bg-[#10151a] border border-[#283747] rounded-lg text-xs text-white focus:border-[#6EA8DA] focus:outline-none font-medium"
            >
              {repos.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.username}/{r.name}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => toast.success("Exported commit risk audit trail (CSV)")}
            className="px-4 py-2 rounded-lg border border-[#2b3947] bg-[#10151a] text-[#d8e2e8] hover:border-white/[0.2] hover:bg-[#141b21] shadow-sm transition-all cursor-pointer flex items-center gap-2 font-medium"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Audit Log</span>
          </button>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5">
        <div className="bg-[#10151a] border border-[#263544] rounded-xl p-4.5 relative overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          <div className="absolute left-0 top-0 bottom-0 w-[3.5px] bg-[#6EA8DA]" />
          <div className="text-[10.5px] uppercase tracking-wider text-[#8a99ad] font-semibold">Analyzed Commits</div>
          <div className="text-xl font-bold mt-1.5 text-white">{loadingCommits ? "…" : totalCommits}</div>
          <div className="text-[11px] text-[#8a99ad] mt-1">page {page} of {totalPages} · {limit}/page</div>
        </div>

        <div className="bg-[#10151a] border border-[#263544] rounded-xl p-4.5 relative overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          <div className="absolute left-0 top-0 bottom-0 w-[3.5px] bg-[#C8A27A]" />
          <div className="text-[10.5px] uppercase tracking-wider text-[#8a99ad] font-semibold">Critical Findings</div>
          <div className="text-xl font-bold mt-1.5 text-[#C8A27A]">{loadingCommits ? "…" : `${criticalCount} Detected`}</div>
          <div className="text-[11px] text-[#8a99ad] mt-1">{totalFindings} total findings</div>
        </div>

        <div className="bg-[#10151a] border border-[#263544] rounded-xl p-4.5 relative overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          <div className="absolute left-0 top-0 bottom-0 w-[3.5px] bg-[#2C6CB0]" />
          <div className="text-[10.5px] uppercase tracking-wider text-[#8a99ad] font-semibold">Clean Rate</div>
          <div className="text-xl font-bold mt-1.5 text-white">{loadingCommits ? "…" : `${cleanRate}%`}</div>
          <div className="text-[11px] text-[#8a99ad] mt-1">Commits with 0 findings</div>
        </div>

        <div className="bg-[#10151a] border border-[#263544] rounded-xl p-4.5 relative overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          <div className="absolute left-0 top-0 bottom-0 w-[3.5px] bg-[#1D3557] border-r border-[#6EA8DA]/40" />
          <div className="text-[10.5px] uppercase tracking-wider text-[#8a99ad] font-semibold">Avg Risk Score</div>
          <div className="text-xl font-bold mt-1.5 text-white">{loadingCommits ? "…" : `${avgRisk} / 100`}</div>
          <div className="text-[11px] text-[#8a99ad] mt-1">Weighted formula</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-[#8a99ad] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search commit message, sha, author..."
              className="w-full pl-10 pr-4 py-2 bg-[#10151a] border border-[#283747] rounded-lg text-xs font-mono text-white placeholder-[#6f8390] focus:border-[#38bdf8] focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Severity Filter Chips */}
        <div className="flex items-center gap-2 text-xs">
          {["all", "critical", "high", "medium", "low"].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold font-sans uppercase transition-all cursor-pointer flex items-center ${
                severityFilter === sev
                  ? "bg-[#2962FF] hover:bg-[#1e4ed8] text-white shadow-[0_0_15px_rgba(41,98,255,0.35)]"
                  : "bg-[#10151a] border border-[#2b3947] text-[#d8e2e8] hover:text-white hover:border-white/[0.2] hover:bg-[#141b21]"
              }`}
            >
              <span>{sev}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Commits Stream List */}
      {loading || loadingCommits ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[#1a2330] rounded-xl h-20 animate-pulse" />
          ))}
        </div>
      ) : commits.length === 0 ? (
        <div className="text-center py-16">
          <WifiOff className="w-8 h-8 mx-auto text-[#8a99ad] mb-3" />
          <p className="font-mono text-sm text-[#8a99ad]">No commit data available</p>
          <p className="font-mono text-xs text-[#6f8390] mt-1">
            {repos.length === 0 ? "No repositories found — scan one with the CLI" : "Run the CLI scanner to analyze commits for this repository"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCommits.map((commitData) => {
            const commit = commitData.commit || {};
            const summary = commitData.summary || {};
            const findings = commitData.findings || [];
            const sha = commit.short_sha || commit.sha?.slice(0, 7) || "?";
            const fullSha = commit.sha || "";
            const isExpanded = expandedCommitSha === sha;
            const color = severityColor(summary.risk_level);
            const aiResult = aiAnalysisResults[sha];

            return (
              <div
                key={sha}
                className={`bg-[#10151a] border rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all ${
                  isExpanded ? "border-[#38bdf8]/60 shadow-[0_0_15px_rgba(56,189,248,0.15)]" : "border-[#263544] hover:border-[#2f4255]"
                }`}
              >
                {/* Commit Summary Row */}
                <div
                  onClick={() => setExpandedCommitSha(isExpanded ? null : sha)}
                  className="p-4.5 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.02] transition-colors select-none"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {/* SHA Badge with 1-click copy */}
                    <button
                      onClick={(e) => handleCopySha(fullSha, e)}
                      className="font-mono text-[#38bdf8] bg-[#38bdf8]/10 hover:bg-[#38bdf8]/20 px-2 py-1 rounded text-xs border border-[#38bdf8]/30 font-semibold shadow-sm flex items-center gap-1.5 transition-colors"
                    >
                      <span>{sha}</span>
                      {copiedSha === fullSha ? (
                        <Check className="w-3 h-3 text-[#38bdf8]" />
                      ) : (
                        <Copy className="w-3 h-3 text-[#8a99ad]" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs font-semibold text-white truncate">{commit.message}</h3>
                      <div className="flex items-center gap-2.5 text-[11px] font-mono text-[#8a99ad] mt-0.5">
                        <span>{commit.author_name}</span>
                        <span>·</span>
                        <span>{timeAgo(commit.authored_at)}</span>
                        <span>·</span>
                        <span>{summary.files_changed || 0} files changed</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Badges & Controls */}
                  <div className="flex items-center gap-3 font-mono">
                    {(summary.findings || 0) > 0 && (
                      <span className="text-[10px] bg-rose-500/15 border border-rose-500/30 text-rose-400 px-2 py-0.5 rounded">
                        {summary.findings} findings
                      </span>
                    )}

                    <span
                      className="text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full border font-bold"
                      style={{
                        color,
                        borderColor: color,
                        backgroundColor: `${color}14`,
                      }}
                    >
                      Risk {summary.risk_score || 0} · {summary.risk_level || "low"}
                    </span>

                    <button className="text-[#8a99ad] hover:text-white p-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Detail Tray */}
                {isExpanded && (
                  <div className="p-5 border-t border-[#253240] bg-[#0c1016] space-y-4">
                    {/* Findings List */}
                    {findings.length > 0 && (
                      <div className="space-y-2">
                        <span className="font-mono text-[10.5px] uppercase tracking-wider text-[#8a99ad] font-semibold">
                          Security Findings
                        </span>
                        {findings.map((f, fi) => (
                          <div key={fi} className="p-3 rounded-lg bg-[#10151a] border border-[#222e3a] space-y-1">
                            <div className="flex items-center gap-2">
                              <span
                                className="font-mono text-[9px] uppercase px-2 py-0.5 rounded-full border font-bold"
                                style={{
                                  color: severityColor(f.severity),
                                  borderColor: severityColor(f.severity),
                                  backgroundColor: `${severityColor(f.severity)}14`,
                                }}
                              >
                                {f.severity}
                              </span>
                              <span className="text-xs text-white font-semibold">{f.title}</span>
                            </div>
                            <p className="text-[11px] text-[#8a99ad] font-mono">{f.description}</p>
                            {f.path && <p className="text-[10px] text-[#6f8390] font-mono">📁 {f.path}</p>}
                            {f.evidence && (
                              <pre className="text-[10px] text-[#38bdf8] font-mono bg-[#07090d] p-2 rounded mt-1 overflow-x-auto">{f.evidence}</pre>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* AI Analysis Action */}
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10.5px] uppercase tracking-wider text-[#8a99ad] font-semibold flex items-center gap-2">
                        <FileCode className="w-3.5 h-3.5 text-[#38bdf8]" />
                        <span>AI Security Analysis</span>
                      </span>
                      <button
                        onClick={(e) => handleRunAiReview(commitData, e)}
                        disabled={analyzingSha === sha}
                        className="px-3.5 py-1.5 rounded-lg font-mono text-xs bg-[#2962FF] hover:bg-[#1e4ed8] text-white font-bold shadow-[0_0_15px_rgba(41,98,255,0.35)] flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer active:scale-95"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{analyzingSha === sha ? "Analyzing..." : "Run AI Review"}</span>
                      </button>
                    </div>

                    {/* AI Analysis Receipt if generated */}
                    {aiResult && (() => {
                      const ai = aiResult.response || aiResult.ai_response || aiResult;
                      const hasContent = ai?.summary || ai?.overview || (Array.isArray(ai?.recommendations) && ai.recommendations.length > 0) || ai?.security_assessment;
                      return (
                        <div className="p-4 rounded-lg bg-[#10151a] border border-[#38bdf8]/40 space-y-3 shadow-[0_0_15px_rgba(56,189,248,0.15)]">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#38bdf8]">
                              <Sparkles className="w-4 h-4" />
                              <span>ThreatLens AI Security Review</span>
                            </div>
                            <span className="text-[10px] font-mono text-[#38bdf8] bg-[#38bdf8]/10 px-2 py-0.5 rounded border border-[#38bdf8]/20">
                              Gemini Intelligence
                            </span>
                          </div>
                          {ai?.summary && (
                            <p className="text-xs text-[#d8e2e8] leading-relaxed font-mono">{ai.summary}</p>
                          )}
                          {ai?.overview && (
                            <p className="text-[11px] text-[#8a99ad] leading-relaxed font-mono">{ai.overview}</p>
                          )}
                          {Array.isArray(ai?.recommendations) && ai.recommendations.length > 0 && (
                            <div className="space-y-1">
                              <span className="font-mono text-[10px] uppercase text-[#38bdf8] font-bold">Recommendations:</span>
                              <ul className="list-disc list-inside text-[11px] text-[#d8e2e8] font-mono space-y-0.5">
                                {ai.recommendations.map((r, ri) => (
                                  <li key={ri}>{typeof r === "string" ? r : JSON.stringify(r)}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {ai?.security_assessment && (
                            <p className="text-xs text-white p-3 rounded-lg bg-[#38bdf8]/10 border border-[#38bdf8]/30 font-mono">
                              {ai.security_assessment}
                            </p>
                          )}
                          {!hasContent && typeof ai === "string" && (
                            <p className="text-xs text-[#d8e2e8] font-mono leading-relaxed">{ai}</p>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            );
          })}

          {/* Pagination */}
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={(newPage) => {
              setPage(newPage);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            limit={limit}
            onLimitChange={handleLimitChange}
            totalItems={totalCommits}
            pageSizeOptions={[5, 10, 20, 50, 100]}
            itemLabel="commits"
          />
        </div>
      )}
    </div>
  );
}
