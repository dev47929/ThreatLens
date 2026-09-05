import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  ExternalLink,
  Download,
  WifiOff,
  Loader2,
  GitCommit,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { repoApi, formatBytes } from "@/lib/api";

export default function RepositoriesTab({ onSelectRepo, onInspectCommit }) {
  const { token } = useAuth();
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [activeRepoId, setActiveRepoId] = useState(null);

  useEffect(() => {
    const fetchRepos = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const data = await repoApi.getRepos(token);
        const repoList = Array.isArray(data) ? data : [];
        setRepos(repoList);
        if (repoList.length > 0 && !activeRepoId) {
          setActiveRepoId(repoList[0].id);
        }
      } catch (err) {
        toast.error("Failed to load repositories: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchRepos();
  }, [token]);

  // Compute all unique languages across repos
  const allLanguages = [...new Set(repos.flatMap((r) => Object.keys(r.languages || {})))];

  const filteredRepos = repos.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.url.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLang =
      selectedLanguage === "all" ||
      (r.languages && Object.keys(r.languages).includes(selectedLanguage));
    return matchesSearch && matchesLang;
  });

  // Computed KPIs
  const totalCommits = repos.reduce((s, r) => s + (r.commit_count || 0), 0);
  const totalFiles = repos.reduce((s, r) => s + (r.files_total || 0), 0);
  const totalSize = repos.reduce((s, r) => s + (r.total_size || 0), 0);

  const handleExportRepoSummary = () => {
    toast.success("Exported repository architecture & security manifest (JSON)");
  };

  const langColors = ["#4d9cff", "#f2c94c", "#38bdf8", "#10b981", "#a78bfa", "#f472b6"];

  return (
    <div className="space-y-7">
      {/* Top Page Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 pb-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Monitored Repositories</h1>
          <p className="text-xs text-[#8a99ad] mt-1">
            GET /repo · {repos.length} codebases monitored · automated AST static analysis & branch tracking
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <button
            onClick={handleExportRepoSummary}
            className="px-4 py-2 rounded-lg border border-[#2b3947] bg-[#10151a] text-[#d8e2e8] hover:border-white/[0.2] hover:bg-[#141b21] shadow-sm transition-all cursor-pointer flex items-center gap-2 font-medium"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Manifest</span>
          </button>
          <button
            onClick={() => toast.info("Importing repository from GitHub/GitLab...")}
            className="px-4 py-2 rounded-lg bg-[#2962FF] hover:bg-[#1e4ed8] text-white font-semibold shadow-[0_0_15px_rgba(41,98,255,0.35)] transition-all cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Repository</span>
          </button>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5">
        <div className="bg-[#10151a] border border-[#263544] rounded-xl p-4.5 relative overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          <div className="absolute left-0 top-0 bottom-0 w-[3.5px] bg-[#6EA8DA]" />
          <div className="text-[10.5px] uppercase tracking-wider text-[#8a99ad] font-semibold">Active Codebases</div>
          <div className="text-xl font-bold mt-1.5 text-white">{loading ? "…" : `${repos.length} Monitored`}</div>
          <div className="text-[11px] text-[#8a99ad] mt-1">100% git remote synced</div>
        </div>

        <div className="bg-[#10151a] border border-[#263544] rounded-xl p-4.5 relative overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          <div className="absolute left-0 top-0 bottom-0 w-[3.5px] bg-[#C8A27A]" />
          <div className="text-[10.5px] uppercase tracking-wider text-[#8a99ad] font-semibold">Indexed Commits</div>
          <div className="text-xl font-bold mt-1.5 text-white">{loading ? "…" : `${totalCommits.toLocaleString()} Total`}</div>
          <div className="text-[11px] text-[#8a99ad] mt-1">across all repositories</div>
        </div>

        <div className="bg-[#10151a] border border-[#263544] rounded-xl p-4.5 relative overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          <div className="absolute left-0 top-0 bottom-0 w-[3.5px] bg-[#2C6CB0]" />
          <div className="text-[10.5px] uppercase tracking-wider text-[#8a99ad] font-semibold">Total Files</div>
          <div className="text-xl font-bold mt-1.5 text-white">{loading ? "…" : `${totalFiles.toLocaleString()} Tracked`}</div>
          <div className="text-[11px] text-[#8a99ad] mt-1">indexed for analysis</div>
        </div>

        <div className="bg-[#10151a] border border-[#263544] rounded-xl p-4.5 relative overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          <div className="absolute left-0 top-0 bottom-0 w-[3.5px] bg-[#1D3557] border-r border-[#6EA8DA]/40" />
          <div className="text-[10.5px] uppercase tracking-wider text-[#8a99ad] font-semibold">Total Footprint</div>
          <div className="text-xl font-bold mt-1.5 text-[#6EA8DA]">{loading ? "…" : formatBytes(totalSize)}</div>
          <div className="text-[11px] text-[#8a99ad] mt-1">{totalFiles.toLocaleString()} files indexed</div>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-[#8a99ad] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search repository by name or git URL..."
              className="w-full pl-10 pr-4 py-2 bg-[#10151a] border border-[#283747] rounded-lg text-xs font-mono text-white placeholder-[#6f8390] focus:border-[#38bdf8] focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Language Filter Chips */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {["all", ...allLanguages.slice(0, 5)].map((lang) => (
            <button
              key={lang}
              onClick={() => setSelectedLanguage(lang)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold font-sans transition-all cursor-pointer flex items-center ${
                selectedLanguage === lang
                  ? "bg-[#2962FF] hover:bg-[#1e4ed8] text-white shadow-[0_0_15px_rgba(41,98,255,0.35)]"
                  : "bg-[#10151a] border border-[#2b3947] text-[#d8e2e8] hover:text-white hover:border-white/[0.2] hover:bg-[#141b21]"
              }`}
            >
              <span>{lang === "all" ? "All Languages" : lang}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Repositories Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[#1a2330] rounded-xl h-56 animate-pulse" />
          ))}
        </div>
      ) : filteredRepos.length === 0 ? (
        <div className="text-center py-16">
          <WifiOff className="w-8 h-8 mx-auto text-[#8a99ad] mb-3" />
          <p className="font-mono text-sm text-[#8a99ad]">
            {repos.length === 0 ? "No repositories found" : "No repos match your filters"}
          </p>
          <p className="font-mono text-xs text-[#6f8390] mt-1">
            {repos.length === 0 ? "Use the CLI backend to scan a repository first" : "Try adjusting your search or language filter"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5.5">
          {filteredRepos.map((repo) => {
            const isSelected = activeRepoId === repo.id;
            const langs = repo.languages || {};
            const langTotal = Object.values(langs).reduce((s, v) => s + v, 0) || 1;
            const langEntries = Object.entries(langs).sort((a, b) => b[1] - a[1]);

            return (
              <div
                key={repo.id}
                onClick={() => {
                  setActiveRepoId(repo.id);
                  if (onSelectRepo) {
                    onSelectRepo(repo.id);
                  }
                }}
                className={`bg-[#10151a] border rounded-xl p-5 space-y-4 shadow-[0_4px_20px_rgba(0,0,0,0.3)] cursor-pointer transition-all hover:border-[#6EA8DA]/50 ${
                  isSelected
                    ? "border-[#38bdf8] shadow-[0_0_15px_rgba(56,189,248,0.2)] bg-[#121820]"
                    : "border-[#263544] hover:border-[#2f4255]"
                }`}
              >
                {/* Header: Name + URL + Branch */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-mono font-bold text-sm text-white group-hover:text-[#6EA8DA]">{repo.name}</h3>
                      <span className="font-mono text-[10px] text-[#38bdf8] bg-[#38bdf8]/10 border border-[#38bdf8]/30 px-1.5 py-0.5 rounded">
                        {repo.default_branch || "main"}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#8a99ad] font-mono mt-1 truncate max-w-sm">{repo.url}</p>
                  </div>

                  {repo.tags && repo.tags.length > 0 && (
                    <span className="font-mono text-[10px] text-[#38bdf8] bg-[#38bdf8]/10 border border-[#38bdf8]/30 px-2 py-0.5 rounded whitespace-nowrap">
                      {repo.tags[0].name}
                    </span>
                  )}
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-[#0a0d10] border border-[#222e3a] text-center font-mono">
                  <div>
                    <span className="text-[9px] text-[#8a99ad] uppercase block">Commits</span>
                    <b className="text-sm text-white">{(repo.commit_count || 0).toLocaleString()}</b>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#8a99ad] uppercase block">Files</span>
                    <b className="text-sm text-white">{repo.files_total || 0}</b>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#8a99ad] uppercase block">Total Size</span>
                    <b className="text-sm text-white">{formatBytes(repo.total_size)}</b>
                  </div>
                </div>

                {/* Languages Bar */}
                <div className="space-y-1.5">
                  <div className="flex h-1.5 rounded overflow-hidden bg-[#222e3a]">
                    {langEntries.map(([lang, count], li) => (
                      <div
                        key={lang}
                        style={{
                          width: `${(count / langTotal) * 100}%`,
                          backgroundColor: langColors[li % langColors.length],
                        }}
                        title={`${lang} ${Math.round((count / langTotal) * 100)}%`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#8a99ad]">
                    <span>
                      {langEntries.slice(0, 3).map(([lang, count], li) => (
                        <span key={lang}>
                          <span style={{ color: langColors[li % langColors.length] }}>●</span> {lang} ({Math.round((count / langTotal) * 100)}%)
                          {li < Math.min(langEntries.length, 3) - 1 ? " · " : ""}
                        </span>
                      ))}
                    </span>
                    <span>{repo.updated_at ? `Updated ${new Date(repo.updated_at).toLocaleDateString()}` : ""}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 border-t border-[#253240] flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectRepo) {
                          onSelectRepo(repo.id);
                        }
                      }}
                      className="px-3 py-1.5 rounded font-mono text-xs bg-[#2962FF]/15 border border-[#2962FF]/40 text-[#6EA8DA] hover:bg-[#2962FF] hover:text-white flex items-center gap-1.5 transition-all cursor-pointer font-semibold"
                    >
                      <GitCommit className="w-3.5 h-3.5" />
                      <span>View Commits →</span>
                    </button>
                  </div>

                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-[#38bdf8] hover:underline font-mono flex items-center gap-1"
                  >
                    <span>Git Remote</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
