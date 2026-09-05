import React, { useState, useMemo } from "react";
import {
  Search,
  Plus,
  Briefcase,
  MoreVertical,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Copy,
  Trash2,
  Edit3,
  X,
  Terminal,
} from "lucide-react";
import { toast } from "sonner";
import GradientWaves from "@/animations/GradientWaves";

const INITIAL_PROMPTS = [
  {
    id: "p-1",
    name: "[SHOWCASE] Outbound Medical Records Prompt",
    version: "v1",
    description: "Outbound medical records retrieval",
    toolsCount: 3,
    agentsCount: 1,
    lastModified: "8/26/26, 10:39 AM GMT+5:30",
    authorEmail: "tejalmishra1@gmail.com",
    promptText:
      "Analyze medical records and cross-reference ICD-10 codes for automated authorization workflows.",
  },
  {
    id: "p-2",
    name: "[SHOWCASE] Outbound Appointment Reminder Prompt",
    version: "v1",
    description: "Outbound appointment reminders",
    toolsCount: 4,
    agentsCount: 1,
    lastModified: "8/26/26, 10:39 AM GMT+5:30",
    authorEmail: "tejalmishra1@gmail.com",
    promptText:
      "Generate patient appointment reminders, parse confirmation responses, and route rescheduling intents.",
  },
  {
    id: "p-3",
    name: "[SHOWCASE] Insurance Claims Prompt",
    version: "v1",
    description: "Auto and home insurance claims",
    toolsCount: 4,
    agentsCount: 1,
    lastModified: "8/26/26, 10:39 AM GMT+5:30",
    authorEmail: "tejalmishra1@gmail.com",
    promptText:
      "Validate insurance policy numbers, extract incident damage photos, and calculate claim deductibles.",
  },
  {
    id: "p-4",
    name: "[SHOWCASE] Home Services Prompt",
    version: "v1",
    description: "Home services routing",
    toolsCount: 4,
    agentsCount: 1,
    lastModified: "8/26/26, 10:39 AM GMT+5:30",
    authorEmail: "tejalmishra1@gmail.com",
    promptText:
      "Triage HVAC and plumbing maintenance requests, check technician availability, and dispatch dispatch alerts.",
  },
  {
    id: "p-5",
    name: "[SHOWCASE] Healthcare Receptionist Prompt",
    version: "v1",
    description: "Patient scheduling & intake",
    toolsCount: 3,
    agentsCount: 2,
    lastModified: "8/26/26, 10:39 AM GMT+5:30",
    authorEmail: "tejalmishra1@gmail.com",
    promptText:
      "Handle front-desk patient intake, collect insurance documentation, and manage waiting room queues.",
  },
  {
    id: "p-6",
    name: "[SHOWCASE] Cloud Infrastructure Security Audit",
    version: "v2",
    description: "AWS IAM & Terraform posture review",
    toolsCount: 5,
    agentsCount: 2,
    lastModified: "8/26/26, 10:39 AM GMT+5:30",
    authorEmail: "tejalmishra1@gmail.com",
    promptText:
      "Scan Terraform modules for open S3 buckets, excessive IAM wildcards, and unencrypted RDS instances.",
  },
];

export default function PromptHistoryTab({ user }) {
  const [prompts, setPrompts] = useState(INITIAL_PROMPTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [rowsPerPage] = useState(25);
  const [currentPage] = useState(1);

  // Prompt Modal States
  const [isNewPromptOpen, setIsNewPromptOpen] = useState(false);
  const [newPromptName, setNewPromptName] = useState("");
  const [newPromptDesc, setNewPromptDesc] = useState("");
  const [newPromptContent, setNewPromptContent] = useState("");
  const [selectedPrompt, setSelectedPrompt] = useState(null);

  const currentUserEmail = user?.email || "tejalmishra1@gmail.com";

  // Filtered prompts
  const filteredPrompts = useMemo(() => {
    return prompts.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.authorEmail.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [prompts, searchQuery]);

  // Handle Create Prompt
  const handleCreatePrompt = (e) => {
    e.preventDefault();
    if (!newPromptName.trim()) {
      toast.error("Please provide a prompt name");
      return;
    }

    const now = new Date();
    const formattedDate = `${now.getMonth() + 1}/${now.getDate()}/${now
      .getFullYear()
      .toString()
      .slice(-2)}, ${now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })} GMT+5:30`;

    const newPrompt = {
      id: `p-${Date.now()}`,
      name: newPromptName.trim(),
      version: "v1",
      description: newPromptDesc.trim() || "Custom security prompt",
      toolsCount: 3,
      agentsCount: 1,
      lastModified: formattedDate,
      authorEmail: currentUserEmail,
      promptText:
        newPromptContent.trim() || "Custom automated prompt execution sequence.",
    };

    setPrompts([newPrompt, ...prompts]);
    setIsNewPromptOpen(false);
    setNewPromptName("");
    setNewPromptDesc("");
    setNewPromptContent("");
    toast.success(`Prompt "${newPrompt.name}" created!`);
  };

  const handleDeletePrompt = (id, name) => {
    setPrompts((prev) => prev.filter((p) => p.id !== id));
    setActiveMenuId(null);
    toast.success(`Deleted prompt "${name}"`);
  };

  const handleCopyText = (text, label = "Content") => {
    navigator.clipboard.writeText(text);
    setActiveMenuId(null);
    toast.success(`${label} copied to clipboard!`);
  };

  return (
    <div className="relative w-full flex flex-col pb-24">
      {/* Background Gradient Waves Animation */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40 overflow-hidden">
        <GradientWaves
          horizonColor="#010114"
          waveColor="#6f6e9d"
          crestColor="#292596"
          speed={0.35}
          amplitude={2.2}
          waveScale={0.6}
          waveRatio={0.9}
          swell={35}
          turbulence={20}
          tilt={1.11}
        />
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 p-8 lg:p-10 space-y-6 max-w-[1600px] w-full">
        {/* Top Header & Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-1">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <span>TUI Prompt History</span>
              <span className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-[#60a5fa] text-[11px] font-mono font-medium">
                {prompts.length} templates
              </span>
            </h1>
            <p className="text-xs text-[#8a99ad] mt-0.5">
              View and manage saved prompt templates and system directives
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Action Button */}
            <button
              onClick={() => setIsNewPromptOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#1e5adb] hover:bg-[#1849b8] text-white font-semibold text-xs shadow-[0_0_16px_rgba(30,90,219,0.35)] transition-all cursor-pointer flex items-center gap-2 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>New prompt</span>
            </button>
          </div>
        </div>

        {/* Card Container */}
        <div className="bg-[#121924]/90 backdrop-blur-md border border-[#1e2c3e] rounded-2xl p-6 shadow-2xl space-y-6">
          {/* Toolbar: Search & Info */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 text-[#8a99ad] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search prompt name, description, author..."
                className="w-full pl-10 pr-4 py-2 bg-[#0c121a] border border-[#223145] rounded-xl text-xs text-white placeholder-[#8a99ad] focus:border-[#38bdf8] focus:outline-none transition-colors"
              />
            </div>

            <div className="text-xs text-[#8a99ad] font-mono">
              Showing {filteredPrompts.length} prompt templates
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PROMPT HISTORY TABLE                                                      */}
          {/* ========================================================================= */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1b2636] text-[12px] font-semibold text-[#8a99ad]">
                  <th className="pb-3.5 font-medium">Name</th>
                  <th className="pb-3.5 font-medium">Tools</th>
                  <th className="pb-3.5 font-medium cursor-pointer flex items-center gap-1">
                    <span>Last modified</span>
                    <ArrowDown className="w-3.5 h-3.5" />
                  </th>
                  <th className="pb-3.5 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#182332]">
                {filteredPrompts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-xs text-[#8a99ad]">
                      No prompts found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredPrompts.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedPrompt(p)}
                      className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                    >
                      {/* Name & Version */}
                      <td className="py-4 pr-4 align-middle">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold text-white group-hover:text-[#60a5fa] transition-colors">
                            {p.name}
                          </span>
                          <span className="bg-[#1f2937] text-[#9ca3af] text-[10.5px] font-mono px-1.5 py-0.5 rounded font-medium">
                            {p.version}
                          </span>
                        </div>
                        <div className="text-xs text-[#8a99ad] mt-0.5 font-normal">
                          {p.description}
                        </div>
                      </td>

                      {/* Tools */}
                      <td className="py-4 px-4 align-middle whitespace-nowrap">
                        <div className="flex items-center gap-2 text-xs text-[#d8e2e8]">
                          <Briefcase className="w-3.5 h-3.5 text-[#8a99ad]" />
                          <span>{p.toolsCount} tools</span>
                        </div>
                      </td>

                      {/* Last Modified */}
                      <td className="py-4 px-4 align-middle whitespace-nowrap">
                        <div className="text-xs text-[#e2e8f0] font-normal">
                          {p.lastModified}
                        </div>
                        <div className="text-[11px] text-[#8a99ad] mt-0.5">
                          {p.authorEmail}
                        </div>
                      </td>

                      {/* Menu Actions */}
                      <td className="py-4 pl-2 pr-1 text-right align-middle relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === p.id ? null : p.id);
                          }}
                          className="p-1.5 rounded-lg text-[#8a99ad] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu */}
                        {activeMenuId === p.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-12 w-44 rounded-xl bg-[#0e1620] border border-[#233348] shadow-2xl p-1.5 z-50 select-none text-left"
                          >
                            <button
                              onClick={() => handleCopyText(p.promptText, "Prompt payload")}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-[#d8e2e8] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5 text-[#8a99ad]" />
                              <span>Copy prompt</span>
                            </button>

                            <button
                              onClick={() => {
                                setSelectedPrompt(p);
                                setActiveMenuId(null);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-[#d8e2e8] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-[#8a99ad]" />
                              <span>Inspect details</span>
                            </button>

                            <button
                              onClick={() => handleDeletePrompt(p.id, p.name)}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer / Pagination */}
          <div className="flex flex-wrap items-center justify-end gap-6 pt-4 border-t border-[#1b2636] text-xs text-[#8a99ad] select-none">
            <div className="flex items-center gap-2">
              <span>Rows</span>
              <button
                onClick={() => toast.info("Rows per page: 25")}
                className="flex items-center gap-1.5 px-2 py-1 bg-[#0e1620] border border-[#23344b] rounded text-white text-xs cursor-pointer"
              >
                <span>{rowsPerPage}</span>
                <ChevronDown className="w-3 h-3 text-[#8a99ad]" />
              </button>
            </div>

            <div>
              1-{filteredPrompts.length} of {filteredPrompts.length}
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                className="p-1 rounded text-[#8a99ad] hover:text-white hover:bg-white/[0.06] disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={true}
                className="p-1 rounded text-[#8a99ad] hover:text-white hover:bg-white/[0.06] disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: NEW PROMPT CREATION                                              */}
      {/* ========================================================================= */}
      {isNewPromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none">
          <div className="w-full max-w-lg bg-[#0e1622] border border-[#23344b] rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e2a3b]">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-[#38bdf8]" />
                <h2 className="text-base font-bold text-white">Create New Prompt</h2>
              </div>
              <button
                onClick={() => setIsNewPromptOpen(false)}
                className="p-1.5 text-[#8a99ad] hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePrompt} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#8a99ad]">Prompt Title</label>
                <input
                  type="text"
                  required
                  value={newPromptName}
                  onChange={(e) => setNewPromptName(e.target.value)}
                  placeholder="e.g. [SHOWCASE] API Security Vulnerability Triage"
                  className="w-full px-3.5 py-2.5 bg-[#080d14] border border-[#202e40] rounded-xl text-xs text-white placeholder-[#5d7185] focus:border-[#38bdf8] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#8a99ad]">Description / Use Case</label>
                <input
                  type="text"
                  value={newPromptDesc}
                  onChange={(e) => setNewPromptDesc(e.target.value)}
                  placeholder="e.g. Automated OWASP Top 10 remediation and validation"
                  className="w-full px-3.5 py-2.5 bg-[#080d14] border border-[#202e40] rounded-xl text-xs text-white placeholder-[#5d7185] focus:border-[#38bdf8] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#8a99ad]">Prompt System Instructions</label>
                <textarea
                  rows={4}
                  value={newPromptContent}
                  onChange={(e) => setNewPromptContent(e.target.value)}
                  placeholder="Enter specific instructions, tools constraints, and response formatting rules..."
                  className="w-full px-3.5 py-2.5 bg-[#080d14] border border-[#202e40] rounded-xl text-xs text-white placeholder-[#5d7185] focus:border-[#38bdf8] focus:outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1e2a3b]">
                <button
                  type="button"
                  onClick={() => setIsNewPromptOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-[#8a99ad] hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4.5 py-2 rounded-lg bg-[#1e5adb] hover:bg-[#1849b8] text-white font-semibold text-xs shadow-[0_0_15px_rgba(30,90,219,0.35)] transition-all cursor-pointer"
                >
                  Save Prompt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: PROMPT DETAIL MODAL                                              */}
      {/* ========================================================================= */}
      {selectedPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none">
          <div className="w-full max-w-xl bg-[#0e1622] border border-[#23344b] rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-[#1e2a3b]">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white">{selectedPrompt.name}</h2>
                  <span className="bg-[#1f2937] text-[#9ca3af] text-[10.5px] font-mono px-1.5 py-0.5 rounded font-medium">
                    {selectedPrompt.version}
                  </span>
                </div>
                <p className="text-xs text-[#8a99ad] mt-0.5">{selectedPrompt.description}</p>
              </div>
              <button
                onClick={() => setSelectedPrompt(null)}
                className="p-1.5 text-[#8a99ad] hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#080d14] border border-[#1e2a3b] rounded-xl p-3">
                  <div className="text-[10px] text-[#8a99ad] uppercase font-semibold">Configured Tools</div>
                  <div className="text-sm font-bold text-white mt-1">
                    {selectedPrompt.toolsCount} Active Integrations
                  </div>
                </div>

                <div className="bg-[#080d14] border border-[#1e2a3b] rounded-xl p-3">
                  <div className="text-[10px] text-[#8a99ad] uppercase font-semibold">Author & Time</div>
                  <div className="text-xs font-semibold text-white mt-1 truncate">
                    {selectedPrompt.authorEmail}
                  </div>
                  <div className="text-[10.5px] text-[#8a99ad] mt-0.5">
                    {selectedPrompt.lastModified}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-[#8a99ad]">System Prompt Body</div>
                <div className="p-3.5 rounded-xl bg-[#080d14] border border-[#202e40] text-xs font-mono text-[#38bdf8] leading-relaxed max-h-56 overflow-y-auto">
                  {selectedPrompt.promptText}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#1e2a3b]">
              <button
                onClick={() => handleCopyText(selectedPrompt.promptText, "System prompt")}
                className="px-4 py-2 rounded-lg bg-[#141d28] border border-[#25364c] text-xs font-medium text-white hover:bg-[#1a2533] transition-colors cursor-pointer flex items-center gap-2"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Payload</span>
              </button>

              <button
                onClick={() => setSelectedPrompt(null)}
                className="px-4.5 py-2 rounded-lg bg-[#1e5adb] hover:bg-[#1849b8] text-white font-semibold text-xs shadow-[0_0_15px_rgba(30,90,219,0.35)] transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
