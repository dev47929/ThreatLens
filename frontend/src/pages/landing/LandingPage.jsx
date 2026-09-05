/**
 * ThreatLens AI - Verified Code Auditing & Supply Chain Defense
 * Design & Layout: High-density intelligence dashboard aesthetic, calibrated
 * trace rails, frosted attestation surfaces, and concise operational language.
 */
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  ChevronRight,
  Code2,
  Copy,
  Cpu,
  Database,
  ExternalLink,
  Eye,
  FileCheck2,
  FileCode,
  FileTerminal,
  Fingerprint,
  Gauge,
  GitBranch,
  Github,
  Key,
  Layers,
  LayoutDashboard,
  Link2,
  Lock,
  LogOut,
  Menu,
  Monitor,
  Network,
  Play,
  RotateCcw,
  ScanSearch,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  Terminal,
  TriangleAlert,
  User,
  X,
  Zap,
} from "lucide-react";
import React, { useEffect, useId, useRef, useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { ThreatLensLogo } from "@/components/common/ThreatLensLogo";
import FloatingLines from "@/components/common/FloatingLines";
import ProfileModal from "@/components/drawers/ProfileModal";
import { PLANS } from "@/pages/dashboard/tabs/billing/TokenUsageTab";

const heroImage = "/terminal_cli_preview.jpg";

const appear = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] },
  },
};

function FadeIn({ children, className = "", delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.16 });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 22 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.62, delay, ease: [0.23, 1, 0.32, 1] }}
    >
      {children}
    </motion.div>
  );
}

function Brand({ compact = false }) {
  return (
    <a className="brand flex items-center" href="#top" aria-label="ThreatLens AI home">
      <ThreatLensLogo className={compact ? "h-6 w-auto" : "h-7 w-auto"} />
    </a>
  );
}

function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const { user, logout } = useAuth();

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 12);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const closeMenu = () => {
    setOpen(false);
    setProfileDropdownOpen(false);
  };

  const initials = (user?.name || user?.handle || "TL").slice(0, 2).toUpperCase();

  return (
    <header className={`site-header ${scrolled ? "is-scrolled" : ""}`}>
      <div className="nav-shell">
        <Brand />
        <nav className="desktop-nav" aria-label="Main navigation">
          <Link href="/dashboard" className="text-[#8a99ad] hover:text-[#EAF2F8] font-medium text-[14px] transition-colors flex items-center gap-1.5">
            Dashboard
          </Link>
          <a href="#pricing" className="text-[#8a99ad] hover:text-[#EAF2F8] font-medium text-[14px] transition-colors flex items-center gap-1.5">
            Pricing
          </a>
        </nav>
        <div className="nav-actions">
          <a className="github-link text-[#8a99ad] hover:text-[#EAF2F8] font-medium text-[14px] transition-colors flex items-center gap-2" href="https://github.com" target="_blank" rel="noreferrer" aria-label="Open GitHub">
            <Github size={17} className="text-[#8a99ad]" />
            <span className="text-[#8a99ad] hover:text-[#EAF2F8]">GitHub</span>
          </a>

          {user ? (
            <div className="relative flex items-center" ref={profileMenuRef}>
              {/* User Profile Avatar matching Dashboard */}
              <button
                type="button"
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                className="flex items-center rounded-full ring-1 ring-white/10 hover:ring-[#6EA8DA]/60 focus:outline-none focus:ring-2 focus:ring-[#6EA8DA]/60 transition-all cursor-pointer overflow-hidden p-0.5"
                title={user.name || user.handle || "Account Profile"}
                aria-label="Account Settings"
                aria-expanded={profileDropdownOpen}
              >
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name || user.handle || "Avatar"}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shadow-sm"
                    style={{
                      background: "linear-gradient(135deg, #2C6CB0, #6EA8DA)",
                    }}
                  >
                    {initials}
                  </div>
                )}
              </button>

              {/* Profile Dropdown Menu */}
              <AnimatePresence>
                {profileDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2.5 w-60 rounded-xl bg-[#0c101a] border border-[#222f46] shadow-[0_12px_40px_rgba(0,0,0,0.85)] p-2 backdrop-blur-xl z-[9999]"
                  >
                    {/* User Card Header */}
                    <div className="px-3 py-2.5 rounded-lg bg-[#141a29] border border-white/[0.04] mb-1.5 flex items-center gap-2.5">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover ring-1 ring-white/10 shrink-0"
                        />
                      ) : (
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shadow-sm shrink-0"
                          style={{
                            background: "linear-gradient(135deg, #2C6CB0, #6EA8DA)",
                          }}
                        >
                          {initials}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-white truncate">
                          {user.name || user.handle || "User"}
                        </p>
                        <p className="text-[10px] text-[#6EA8DA] font-mono truncate">
                          @{user.handle || "user"}
                        </p>
                      </div>
                    </div>

                    {/* Navigation Items */}
                    <div className="space-y-1">
                      <Link
                        href="/dashboard"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-[#c4d1e0] hover:text-white hover:bg-white/[0.06] transition-colors"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5 text-[#6EA8DA]" />
                        <span>Open Dashboard</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          setIsProfileOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-[#c4d1e0] hover:text-white hover:bg-white/[0.06] transition-colors text-left cursor-pointer"
                      >
                        <User className="w-3.5 h-3.5 text-[#6EA8DA]" />
                        <span>Profile Settings</span>
                      </button>
                    </div>

                    <div className="my-1.5 border-t border-white/[0.06]" />

                    {/* Sign Out Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/signin"
                className="text-[#8a99ad] hover:text-[#EAF2F8] font-medium text-[14px] px-3 py-1.5 rounded-lg hover:bg-white/[0.04] transition-all"
              >
                Sign In
              </Link>
              <Link className="button button-primary nav-cta flex items-center gap-1.5" href="/signup">
                <span>Sign Up</span> <ArrowRight size={14} />
              </Link>
            </div>
          )}

          <button className="mobile-menu-button" onClick={() => setOpen(!open)} aria-label="Toggle navigation">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      <div className={`mobile-nav ${open ? "open" : ""}`}>
        <Link onClick={closeMenu} href="/dashboard">Dashboard</Link>
        <a onClick={closeMenu} href="#pricing">Pricing</a>
        {user ? (
          <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.08]">
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg bg-[#12141c] border border-white/[0.06]">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-white/10"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                  style={{
                    background: "linear-gradient(135deg, #2C6CB0, #6EA8DA)",
                  }}
                >
                  {initials}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">{user.name || user.handle}</p>
                <p className="text-[10px] text-[#6EA8DA] font-mono truncate">@{user.handle || "user"}</p>
              </div>
            </div>

            <Link
              onClick={closeMenu}
              href="/dashboard"
              className="button button-primary text-xs flex items-center justify-center gap-1.5"
            >
              <LayoutDashboard size={14} />
              <span>Open Dashboard</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                closeMenu();
                setIsProfileOpen(true);
              }}
              className="button button-ghost text-xs flex items-center justify-center gap-1.5"
            >
              <User size={14} />
              <span>Profile Settings</span>
            </button>

            <button
              type="button"
              onClick={() => {
                logout();
                closeMenu();
              }}
              className="button button-ghost text-xs text-rose-400 hover:text-rose-300 border-rose-500/20 flex items-center justify-center gap-1.5"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 pt-2">
            <Link onClick={closeMenu} href="/signin" className="button button-ghost text-center">Sign In</Link>
            <Link onClick={closeMenu} href="/signup" className="button button-primary text-center justify-center flex items-center gap-1.5">
              <span>Sign Up</span> <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>

      {/* Account Settings Modal matching Dashboard */}
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </header>
  );
}

function ScoreCounter() {
  const [score, setScore] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });

  useEffect(() => {
    if (!inView) return;
    let start = null;
    let frame = 0;
    const tick = (time) => {
      if (!start) start = time;
      const progress = Math.min((time - start) / 1050, 1);
      setScore(Math.round(78 * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView]);

  return (
    <div ref={ref} className="score-orbit">
      <div className="score-orbit-ring ring-one" />
      <div className="score-orbit-ring ring-two" />
      <div className="score-shield">
        <ShieldCheck size={26} strokeWidth={1.5} />
        <strong>{score}</strong>
        <span>Security score</span>
      </div>
    </div>
  );
}

const pipelineSteps = [
  { label: "GitHub Repository", icon: GitBranch },
  { label: "AI Analysis", icon: Bot },
  { label: "Security Scan", icon: ScanSearch },
  { label: "Vulnerability Found", icon: ShieldAlert, danger: true },
  { label: "AI Report", icon: FileCheck2 },
  { label: "SHA-256 Hash", icon: Fingerprint },
  { label: "Blockchain", icon: Link2 },
];

function PipelineVisual() {
  return (
    <div className="pipeline-visual" aria-label="Security pipeline illustration">
      <div className="visual-topline"><span>LIVE ATTESTATION</span><Activity size={13} /></div>
      <div className="pipeline-core">
        <div className="pipeline-list">
          {pipelineSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div className={`pipeline-step ${step.danger ? "danger" : ""}`} key={step.label}>
                <div className="pipeline-icon"><Icon size={13} /></div>
                <span>{step.label}</span>
                {index < pipelineSteps.length - 1 && <i className="pipeline-connector"><b /></i>}
              </div>
            );
          })}
          <div className="pipeline-verified"><CheckCircle2 size={13} /> VERIFIED</div>
        </div>
        <ScoreCounter />
      </div>
      <div className="scan-card scan-card-one"><Check size={13} /><span>Secrets scan</span></div>
      <div className="scan-card scan-card-two danger-card"><TriangleAlert size={13} /><span>2 critical findings</span></div>
      <div className="scan-card scan-card-three"><Check size={13} /><span>AI analysis</span></div>
      <div className="scan-card scan-card-four"><Check size={13} /><span>Polygon verified</span></div>
      <div className="data-particle particle-one" /><div className="data-particle particle-two" /><div className="data-particle particle-three" />
    </div>
  );
}

function HeroTypewriter() {
  const line1Text = "Secure every commit";
  const line2Text = "Prove every result";

  const [displayedLine1, setDisplayedLine1] = useState("");
  const [displayedLine2, setDisplayedLine2] = useState("");
  const [activeLine, setActiveLine] = useState(1);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    let i1 = 0;
    let i2 = 0;

    const timer1 = setInterval(() => {
      if (i1 <= line1Text.length) {
        setDisplayedLine1(line1Text.slice(0, i1));
        i1++;
      } else {
        clearInterval(timer1);
        setActiveLine(2);
        const timer2 = setInterval(() => {
          if (i2 <= line2Text.length) {
            setDisplayedLine2(line2Text.slice(0, i2));
            i2++;
          } else {
            clearInterval(timer2);
            setIsDone(true);
          }
        }, 65);
      }
    }, 60);

    return () => {
      clearInterval(timer1);
    };
  }, []);

  return (
    <h1 className="hero-typewriter-title">
      <span className="typewriter-line line-1">
        {displayedLine1}
        {activeLine === 1 && <span className="typewriter-cursor line-1-cursor" />}
      </span>
      <br />
      <span className="typewriter-line line-2">
        <span className="line-2-text">{displayedLine2}</span>
        {activeLine === 2 && !isDone && <span className="typewriter-cursor line-2-cursor" />}
      </span>
    </h1>
  );
}

function Hero() {
  const { user } = useAuth();
  return (
    <section className="hero" id="top">
      <div className="hero-art" style={{ backgroundImage: `url(${heroImage})` }} />
      <div className="hero-grid" />
      <div className="hero-acid w-full h-full pointer-events-none" aria-hidden="true">
        <div style={{ width: '100%', height: '100%', position: 'relative' }} className="pointer-events-auto w-full h-full">
          <FloatingLines
            linesGradient={["#071b5b","#061348","#162b40"]}
            animationSpeed={1}
            interactive
            bendRadius={5}
            bendStrength={-0.5}
            mouseDamping={0.05}
            parallax
            parallaxStrength={0.2}
          />
        </div>
      </div>
      <div className="container hero-layout">
        <motion.div className="hero-copy" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.11 } } }}>
          <motion.div variants={appear}>
            <HeroTypewriter />
          </motion.div>
          <motion.p variants={appear}>AI-powered security testing that detects threats, finds real vulnerabilities, and turns every security result into verifiable proof.</motion.p>
          <motion.div variants={appear} className="hero-actions">
            <Link className="button button-primary button-large flex items-center gap-2" href={user ? "/dashboard" : "/signup"}>
              <span>{user ? "Open Dashboard" : "Get Started"}</span> <ArrowRight size={18} />
            </Link>
            <a className="button button-ghost button-large" href="#terminal">Explore Terminal CLI <ChevronRight size={17} /></a>
          </motion.div>
          <motion.div variants={appear} className="hero-capabilities">
            <span>AI Analysis</span><i /> <span>Active Security Testing</span><i /> <span>Blockchain Verification</span>
          </motion.div>
        </motion.div>
      </div>

      {/* Floating Side Moving Box Elements */}
      {/* 1. Top Left - Monitor */}
      <motion.div
        className="absolute top-[22%] left-0 hidden lg:flex items-center pointer-events-none z-10"
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <div className="relative w-16 xl:w-20 h-px bg-gradient-to-r from-transparent via-[#2C6CB0] to-[#6EA8DA]">
          <span className="absolute -top-1 right-0 w-2 h-2 rounded-full bg-[#6EA8DA]" />
        </div>
        <motion.div
          animate={{ y: [0, -7, 0], x: [0, 3, 0] }}
          transition={{ repeat: Infinity, duration: 4.8, ease: "easeInOut" }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0c0c0e]/95 border border-[#27272a] shadow-lg backdrop-blur-xl pointer-events-auto"
        >
          <div className="p-1 rounded-md bg-[#1D3557] text-[#6EA8DA]">
            <Monitor size={14} />
          </div>
          <span className="text-xs font-semibold text-white tracking-wide">Monitor</span>
        </motion.div>
      </motion.div>

      {/* 2. Bottom Left - Performance */}
      <motion.div
        className="absolute bottom-[24%] left-0 hidden lg:flex items-center pointer-events-none z-10"
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        <div className="relative w-24 xl:w-32 h-px bg-gradient-to-r from-transparent via-[#C8A27A]/60 to-[#C8A27A]">
          <span className="absolute -top-1 right-0 w-2 h-2 rounded-full bg-[#C8A27A]" />
        </div>
        <motion.div
          animate={{ y: [0, 8, 0], x: [0, -3, 0] }}
          transition={{ repeat: Infinity, duration: 5.4, ease: "easeInOut", delay: 0.5 }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0c0c0e]/95 border border-[#27272a] shadow-lg backdrop-blur-xl pointer-events-auto"
        >
          <div className="p-1 rounded-md bg-[#1D3557] text-[#C8A27A]">
            <Gauge size={14} />
          </div>
          <span className="text-xs font-semibold text-white tracking-wide">Performance</span>
        </motion.div>
      </motion.div>

      {/* 3. Top Right - Security */}
      <motion.div
        className="absolute top-[26%] right-0 hidden lg:flex items-center flex-row-reverse pointer-events-none z-10"
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <div className="relative w-20 xl:w-28 h-px bg-gradient-to-l from-transparent via-[#2C6CB0] to-[#6EA8DA]">
          <span className="absolute -top-1 left-0 w-2 h-2 rounded-full bg-[#6EA8DA]" />
        </div>
        <motion.div
          animate={{ y: [0, -8, 0], x: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 5.0, ease: "easeInOut", delay: 0.3 }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0c0c0e]/95 border border-[#27272a] shadow-lg backdrop-blur-xl pointer-events-auto"
        >
          <span className="text-xs font-semibold text-white tracking-wide">Security</span>
          <div className="p-1 rounded-md bg-[#1D3557] text-[#6EA8DA]">
            <ShieldCheck size={14} />
          </div>
        </motion.div>
      </motion.div>

      {/* 4. Bottom Right - Attestation */}
      <motion.div
        className="absolute bottom-[22%] right-0 hidden lg:flex items-center flex-row-reverse pointer-events-none z-10"
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
      >
        <div className="relative w-16 xl:w-24 h-px bg-gradient-to-l from-transparent via-[#2C6CB0] to-[#C8A27A]">
          <span className="absolute -top-1 left-0 w-2 h-2 rounded-full bg-[#C8A27A]" />
        </div>
        <motion.div
          animate={{ y: [0, 7, 0], x: [0, 4, 0] }}
          transition={{ repeat: Infinity, duration: 5.8, ease: "easeInOut", delay: 0.8 }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0c0c0e]/95 border border-[#27272a] shadow-lg backdrop-blur-xl pointer-events-auto"
        >
          <span className="text-xs font-semibold text-white tracking-wide">Attestation</span>
          <div className="p-1 rounded-md bg-[#1D3557] text-[#EAF2F8]">
            <Link2 size={14} />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

function TerminalShowcase() {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("tui");

  const cmdTui = "cd tui && npm start";
  const cmdCli = "python sectest/cli.py scan -t http://localhost:8000 --html --serve";

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="terminal-section" id="terminal">
      <div className="container">
        <div className="split-heading">
          <div>
            <h2>Terminal-first security execution</h2>
          </div>
          <p>Two complementary modes designed for engineering workflows: an interactive terminal user interface and an automated CLI scanner.</p>
        </div>

        <div className="terminal-grid mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left / Top - Visual Preview */}
          <div className="terminal-frame border border-white/10 rounded-xl overflow-hidden bg-[#07090d] shadow-2xl relative">
            <div className="terminal-topbar flex items-center justify-between px-4 py-3 bg-[#0b0e14] border-b border-white/10">
              <div className="flex gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block" />
              </div>
              <div className="text-xs font-mono text-[#8a99ad] flex items-center gap-2">
                <Terminal size={14} /> ThreatLens Terminal Mode
              </div>
              <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE
              </span>
            </div>

            <div className="p-3 bg-[#06080d]">
              <img
                src={heroImage}
                alt="ThreatLensGo Terminal TUI Preview"
                className="w-full h-auto rounded border border-white/5 object-cover"
              />
            </div>
          </div>

          {/* Right / Bottom - Details and Commands */}
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-white/10 bg-[#0a0d15] space-y-2">
                <div className="flex items-center gap-2 font-mono text-sm text-white font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#2546ff]" /> ThreatLensGo (TUI Mode)
                </div>
                <p className="text-xs text-[#8a99ad] leading-relaxed">
                  Interactive real-time terminal UI built with <strong>Ink &amp; React</strong>. Navigate security findings, inspect vulnerability severities, view CVE mappings, and trigger remediation directly in your console.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-white/10 bg-[#0a0d15] space-y-2">
                <div className="flex items-center gap-2 font-mono text-sm text-white font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#4d8eff]" /> SecTest Scanner (CLI Mode)
                </div>
                <p className="text-xs text-[#8a99ad] leading-relaxed">
                  Headless autonomous scanner in Python with Rich CLI logging. Performs active SQLi/XSS fuzzing, secret entropy scanning, and launches a dynamic HTML report dashboard locally.
                </p>
              </div>
            </div>

            {/* Quick Command Box */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("tui")}
                  className={`px-3 py-1.5 text-xs font-mono font-semibold transition-colors cursor-pointer ${
                    activeTab === "tui"
                      ? "bg-[#2546ff] text-white border border-white/10"
                      : "bg-[#0b0e14] text-[#8a99ad] border border-white/5 hover:text-white"
                  }`}
                >
                  ThreatLensGo TUI
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("cli")}
                  className={`px-3 py-1.5 text-xs font-mono font-semibold transition-colors cursor-pointer ${
                    activeTab === "cli"
                      ? "bg-[#2546ff] text-white border border-white/10"
                      : "bg-[#0b0e14] text-[#8a99ad] border border-white/5 hover:text-white"
                  }`}
                >
                  SecTest Scanner
                </button>
              </div>

              <div className="terminal-cmd-bar">
                <code>{activeTab === "tui" ? cmdTui : cmdCli}</code>
                <button
                  type="button"
                  onClick={() => handleCopy(activeTab === "tui" ? cmdTui : cmdCli)}
                  className="flex items-center gap-1.5 text-xs text-[#8a99ad] hover:text-white transition-colors bg-transparent border-0 cursor-pointer p-1"
                  title="Copy command"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const valueProps = [
  {
    icon: Bot,
    title: "AI Analysis",
    description: "Multi-layered inspection of code, dependencies, and git history to identify complex security vulnerabilities before they reach production.",
    metric: "Deep code analysis",
    hash: "0x8F4A...3B21",
  },
  {
    icon: ShieldCheck,
    title: "Active Security Testing",
    description: "Safe, targeted security validation against your live application to confirm vulnerabilities without causing downtime.",
    metric: "Validated proof",
    hash: "0xC2E1...9F04",
  },
  {
    icon: Link2,
    title: "Polygon Attestation",
    description: "Every security test is hashed and permanently recorded on the Polygon blockchain, creating an indisputable audit trail.",
    metric: "On-chain record",
    hash: "0x4D8E...7C12",
  },
];

function ValueProposition() {
  return (
    <section className="section proof-section" id="product">
      <div className="container">
        <div className="split-heading">
          <div><h2>How ThreatLens works</h2></div>
          <p>A unified security platform combining AI code analysis, active vulnerability testing, and blockchain-backed proof.</p>
        </div>
        <div className="value-cards">
          {valueProps.map((item, index) => {
            const Icon = item.icon;
            return (
              <FadeIn className="value-card" delay={index * 0.1} key={item.title}>
                <div className="receipt-top"><span className="receipt-route">ROUTE_0{index + 1}</span><span className="card-index">SYS.SEC</span></div>
                <div className="value-card-top"><div className="value-icon"><Icon size={20} /></div><span className="receipt-hash">{item.hash}</span></div>
                <h3>{item.title}</h3><p>{item.description}</p>
                <div className="value-metric"><i className="metric-dot" /><span>{item.metric}</span><ExternalLink size={12} /></div>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const processSteps = [
  { num: "01", icon: GitBranch, title: "Connect Repo", desc: "Link your GitHub repository in seconds with zero configuration." },
  { num: "02", icon: Bot, title: "AI Scan", desc: "AI scans your code and history for secrets, flaws, and risks." },
  { num: "03", icon: ShieldAlert, title: "Active Test", desc: "Safe exploit validation confirms real, reproducible threats." },
  { num: "04", icon: Link2, title: "Anchor Proof", desc: "Results are hashed and permanently anchored to Polygon." },
];

function HowItWorks() {
  return (
    <section className="section process-section" id="how-it-works">
      <div className="container">
        <div className="split-heading centered-heading">
          <h2>From commit to cryptographic proof</h2>
        </div>
        <div className="process-rail">
          <div className="rail-line"><span /></div>
          {processSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <FadeIn className="process-step" delay={index * 0.08} key={step.num}>
                <div className="process-number">{step.num}</div>
                <div className="process-icon"><Icon size={18} /></div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const scoreRows = [
  ["Secrets Detection", "100%", "clean"],
  ["Dependency Health", "94%", "good"],
  ["DAST Exploit Validation", "78%", "attention"],
  ["Blockchain Proof", "100%", "verified"],
];

function SecurityReport() {
  return (
    <section className="section report-section" id="report">
      <div className="container report-layout">
        <FadeIn className="report-intro">
          <h2>Automated security reports you can trust</h2>
          <p>Every scan produces a comprehensive, verified security report with actionable remediation guidance and cryptographic proof of testing.</p>
          <div className="report-intro-list">
            <span><FileCheck2 size={15} /> Automated SBOM</span>
            <span><ShieldAlert size={15} /> Exploit validation</span>
            <span><Fingerprint size={15} /> Polygon anchoring</span>
          </div>
        </FadeIn>
        <FadeIn className="report-shell" delay={0.12}>
          <div className="report-topbar">
            <div className="flex items-center gap-2">
              <ThreatLensLogo className="h-5 w-auto" idPrefix="report" />
            </div>
            <div className="report-live"><i /> LIVE TELEMETRY</div>
          </div>
          <div className="report-main">
            <div className="report-score-area">
              <div><span className="mono-label">Composite Security Index</span><div className="report-score">84<span>/100</span></div></div>
              <div className="report-circle"><span>A+</span><i /></div>
            </div>
            <div className="report-rule" />
            <div className="score-list">
              {scoreRows.map(([name, score, tone]) => (
                <div className="score-row" key={name}><span>{name}</span><div className="score-track"><span className={`score-fill ${tone}`} /></div><strong>{score}</strong></div>
              ))}
            </div>
          </div>
          <div className="report-finding">
            <div className="finding-card">
              <div className="finding-meta"><span className="sev sev-high">HIGH</span><span className="finding-id">TL-2026-0841</span></div>
              <h3>SQL Injection Vulnerability</h3>
              <div className="finding-copy"><span>IDENTIFIED VULNERABILITY</span><p>Unsanitized user input in query parameters allows arbitrary SQL execution.</p></div>
              <div className="finding-rec"><span>REMEDIATION GUIDANCE</span><p>Use parameterized queries with prepared statements to prevent injection.</p><ArrowRight size={14} /></div>
            </div>
          </div>
          <div className="report-footer"><span><Lock size={12} /> SHA-256 HASH</span><code>0x9f4a7c2e...88b1</code></div>
        </FadeIn>
      </div>
    </section>
  );
}

function PricingSection() {
  const [billingCycle, setBillingCycle] = useState("monthly");

  return (
    <section className="section pricing-section" id="pricing">
      <div className="container">
        <div className="split-heading centered-heading">
          <h2>Simple, predictable security pricing</h2>
          <p className="max-w-xl mx-auto text-[#8a99ad] mt-4 text-center">
            Scale your code security posture from individual developer repositories to full enterprise supply chain defense.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <span className={`text-sm font-medium transition-colors ${billingCycle === "monthly" ? "text-white" : "text-[#8a99ad]"}`}>
              Monthly
            </span>
            <button
              type="button"
              onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
              className={`relative w-11 h-6 rounded-full transition-colors duration-300 cursor-pointer focus:outline-none border border-white/10 ${
                billingCycle === "yearly" ? "bg-[#38bdf8]" : "bg-[#162032]"
              }`}
              aria-label="Toggle billing cycle"
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${
                  billingCycle === "yearly" ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <span className={`text-sm font-medium transition-colors ${billingCycle === "yearly" ? "text-white" : "text-[#8a99ad]"}`}>
              Yearly
            </span>
            {billingCycle === "yearly" && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
                Save 20%
              </span>
            )}
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch mt-12">
          {PLANS.map((plan, index) => {
            const PlanIcon = plan.icon || Shield;
            const displayPrice =
              plan.monthlyPrice === null
                ? null
                : billingCycle === "yearly"
                ? plan.yearlyPrice
                : plan.monthlyPrice;

            return (
              <FadeIn
                key={plan.id}
                delay={index * 0.1}
                className={`relative flex flex-col rounded-2xl border p-7 gap-6 transition-all duration-300 backdrop-blur-xl ${
                  plan.popular
                    ? "bg-gradient-to-b from-[#0e1d3a]/90 via-[#0a1224]/90 to-[#07090d]/90 border-[#2C6CB0] shadow-[0_0_40px_rgba(44,108,176,0.2)]"
                    : plan.id === "enterprise"
                    ? "bg-gradient-to-b from-[#170e30]/90 via-[#0d091a]/90 to-[#07090d]/90 border-[#3b1f6b] hover:border-[#a78bfa]/50"
                    : "bg-[#0a0d14]/90 border-white/10 hover:border-white/20"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#38bdf8] text-[#04101c] text-[11px] font-bold tracking-wide shadow-lg shadow-sky-500/30 whitespace-nowrap">
                    <Sparkles className="w-3 h-3" /> Most Popular
                  </div>
                )}

                {/* Plan Header */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${plan.color}15`, border: `1px solid ${plan.color}28` }}
                    >
                      <PlanIcon className="w-5 h-5" style={{ color: plan.color }} />
                    </div>
                    <div>
                      <div className="text-[17px] font-bold text-white leading-tight">{plan.name}</div>
                      <div className="text-[11px] text-[#8a99ad] font-medium font-mono">{plan.tokens}</div>
                    </div>
                  </div>
                  <p className="text-xs text-[#8a99ad] leading-relaxed min-h-[36px]">{plan.description}</p>
                </div>

                {/* Price Display */}
                <div className="space-y-1">
                  {displayPrice === null ? (
                    <div>
                      <div className="text-3xl font-bold text-white">Custom</div>
                      <div className="text-xs text-[#8a99ad]">Volume-based enterprise pricing</div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-bold text-white">${displayPrice}</span>
                        <span className="text-[#8a99ad] text-sm font-medium">/ month</span>
                      </div>
                      {billingCycle === "yearly" && displayPrice > 0 && (
                        <div className="text-[11.5px] text-emerald-400 font-medium mt-1">
                          ${(plan.monthlyPrice - plan.yearlyPrice) * 12} saved per year
                        </div>
                      )}
                      {displayPrice === 0 && (
                        <div className="text-[11.5px] text-[#8a99ad] mt-1">Free forever · No credit card required</div>
                      )}
                    </div>
                  )}
                </div>

                {/* CTA Action */}
                <Link
                  href={plan.id === "enterprise" ? "mailto:sales@threatlens.io" : "/signup"}
                  className={`w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                    plan.popular
                      ? "bg-gradient-to-b from-[#1e5adb] via-[#1342a8] to-[#0c2a74] text-[#E0F2FE] hover:text-white shadow-lg shadow-blue-900/30 hover:brightness-110 active:scale-[0.98]"
                      : plan.id === "enterprise"
                      ? "bg-transparent border border-[#3b1f6b] hover:border-[#a78bfa] text-[#a78bfa] hover:bg-[#a78bfa]/10 active:scale-[0.98]"
                      : "bg-[#141b27] hover:bg-[#1a2333] border border-white/10 text-white active:scale-[0.98]"
                  }`}
                >
                  <span>{plan.id === "enterprise" ? "Contact Sales" : plan.cta === "Current Plan" ? "Get Started Free" : plan.cta}</span>
                  <ArrowRight size={15} />
                </Link>

                <div className="border-t border-dashed border-white/10" />

                {/* Features List */}
                <div className="space-y-3 flex-1">
                  <div className="text-[11px] font-bold text-[#8a99ad] uppercase tracking-wider font-mono">
                    What&apos;s included
                  </div>
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      {feature.included ? (
                        <div
                          className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                          style={{ background: `${plan.color}20` }}
                        >
                          <Check className="w-2.5 h-2.5" style={{ color: plan.color }} />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-white/5">
                          <X className="w-2.5 h-2.5 text-zinc-600" />
                        </div>
                      )}
                      <span
                        className={`text-xs leading-snug ${
                          feature.included ? "text-[#c2d0df]" : "text-zinc-600"
                        }`}
                      >
                        {feature.label}
                      </span>
                    </div>
                  ))}
                </div>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function BlockchainTrust() {
  const { user } = useAuth();
  return (
    <section className="section trust-section" id="trust">
      <div className="trust-art" /><div className="trust-grid" />
      <div className="container trust-layout">
        <FadeIn className="trust-copy">
          <h2>Proof of security that can&apos;t be altered</h2>
          <p>Security claims without proof are just words. ThreatLens cryptographically hashes every finding, exploit test, and report — then anchors that proof permanently to Polygon.</p>
          <Link className="button button-primary flex items-center gap-2" href={user ? "/dashboard" : "/signup"}>
            <span>{user ? "Open Dashboard" : "Start Securing Your Code"}</span> <ArrowRight size={15} />
          </Link>
        </FadeIn>
        <FadeIn className="verification-stage" delay={0.15}>
          <div className="verification-path">
            <div><Cpu size={16} /><span>Scan</span></div><i><b /></i>
            <div><Bot size={16} /><span>AI Test</span></div><i><b /></i>
            <div><Fingerprint size={16} /><span>SHA-256</span></div><i><b /></i>
            <div className="path-verified"><Link2 size={16} /><span>Polygon</span></div>
          </div>
          <div className="verification-card">
            <div className="verification-title"><div><span className="mono-label">BLOCK ATTESTATION</span><h4>POLYGON PROOF</h4></div><div className="verified-check"><Check size={13} /><span>LIVE</span></div></div>
            <div className="verification-data"><span>Network:</span><strong>Polygon Mainnet</strong><span>Block:</span><code>#48192041</code><span>Hash:</span><code>0x4D8E...7C12</code><span>Integrity:</span><strong className="integrity">100% VERIFIED</strong></div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

function FinalCTA() {
  const { user } = useAuth();
  return (
    <section className="final-cta">
      <div className="container final-cta-content">
        <div className="cta-seal"><Shield size={20} /></div>
        <h2>Ready to secure your code?</h2>
        <p>Connect your repository and get your first AI-verified security report in minutes.</p>
        <Link className="button button-primary button-large flex items-center gap-2" href={user ? "/dashboard" : "/signup"}>
          <span>{user ? "Open Dashboard" : "Get Started Free"}</span> <ArrowRight size={17} />
        </Link>
        <span className="cta-footnote"><ShieldCheck size={14} /> Free tier available · No credit card required · Instant setup</span>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-top">
        <div>
          <Brand />
          <p>Security that leaves a receipt.</p>
        </div>
        <div className="footer-links">
          <Link href="/dashboard">Dashboard</Link>
          <a href="#pricing">Pricing</a>
          <a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a>
        </div>
      </div>
      <div className="container footer-bottom"><span>© 2026 ThreatLens AI</span><span>Security that leaves a receipt.</span></div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="site-shell">
      <Navbar />
      <main className="proof-journey">
        <Hero />
        <TerminalShowcase />
        <ValueProposition />
        <HowItWorks />
        <SecurityReport />
        <PricingSection />
        <BlockchainTrust />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
