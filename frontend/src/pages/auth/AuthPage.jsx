
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Check, Eye, EyeOff,
  KeyRound, Lock, Mail, RefreshCw, ShieldAlert,
  User,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { ThreatLensLogo } from "@/components/common/ThreatLensLogo";



function Field({ label, id, rightEl, children }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-[11px] font-semibold text-[#8da0b8] uppercase tracking-wide">
          {label}
        </label>
        {rightEl}
      </div>
      {children}
    </div>
  );
}

export default function AuthPage({ initialMode = "signup" }) {
  const [mode, setMode]                     = useState(initialMode);
  const [method, setMethod]                 = useState("password");
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState(null);
  const [name, setName]                     = useState("");
  const [email, setEmail]                   = useState("");
  const [handle, setHandle]                 = useState("");
  const [password, setPassword]             = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [showPassword, setShowPassword]     = useState(false);
  const [showRepeat, setShowRepeat]         = useState(false);
  const [acceptTerms, setAcceptTerms]       = useState(true);
  const [otp, setOtp]                       = useState("");
  const [otpSent, setOtpSent]               = useState(false);
  const [otpCountdown, setOtpCountdown]     = useState(0);

  const [, setLocation] = useLocation();
  const { login, isAuthenticated } = useAuth();

  useEffect(() => { setMode(initialMode === "signup" ? "signup" : "signin"); }, [initialMode]);
  useEffect(() => { if (isAuthenticated) setLocation("/dashboard"); }, [isAuthenticated, setLocation]);
  useEffect(() => {
    if (otpCountdown > 0) {
      const t = setTimeout(() => setOtpCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [otpCountdown]);

  const handleSendOtp = async () => {
    if (!email) { toast.error("Enter your email first."); return; }
    setLoading(true); setError(null);
    try {
      await authApi.sendOtp(email, mode === "signup" ? "signup" : "login");
      setOtpSent(true); setOtpCountdown(60);
      toast.success("Verification code sent!");
    } catch (err) {
      const msg = err.message || "Failed to send OTP.";
      setError(msg); toast.error(msg);
    } finally { setLoading(false); }
  };

  const handleSocialLogin = (provider) => {
    const base = import.meta.env.VITE_API_BASE_URL || "https://api.codesena.me";
    const cb   = window.location.origin;
    window.location.href = base + "/tc-auth/" + provider + "/login?frontend_url=" + encodeURIComponent(cb);
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault(); setError(null);
    if (mode === "signup") {
      if (!acceptTerms) { setError("Accept Terms first."); toast.error("Accept Terms."); return; }
      if (method === "password" && password !== repeatPassword) { setError("Passwords do not match."); toast.error("Passwords do not match."); return; }
      if (method === "password" && password.length < 8) { setError("Password too short (min 8 chars)."); toast.error("Password too short."); return; }
    }
    setLoading(true);
    try {
      let res;
      const nm = name || email.split("@")[0];
      const hd = handle || email.split("@")[0];
      if (mode === "signin") {
        res = method === "password"
          ? await authApi.loginWithPassword({ identifier: email, password })
          : await authApi.loginWithOtp({ email, otp });
      } else if (mode === "signup") {
        res = method === "password"
          ? await authApi.signupWithPassword({ name: nm, email, handle: hd, password })
          : await authApi.signupWithOtp({ name: nm, email, handle: hd, password: password || "ThreatLens#2026", otp });
      } else {
        res = await authApi.forgotPassword({ email, otp, password });
      }
      if (res?.access_token) {
        login(res.access_token, res.account || { name, email, handle });
        toast.success(mode === "signup" ? "Welcome to ThreatLens!" : "Authenticated!");
      } else {
        login("mock_" + Date.now(), { id: 1, name: nm, email, handle: hd, role: "developer" });
        toast.success("Signed in!");
      }
      setLocation("/dashboard");
    } catch (err) {
      const msg = err.message || "Authentication failed.";
      setError(msg); toast.error(msg);
    } finally { setLoading(false); }
  };

  const switchMode = (m) => { setMode(m); setError(null); };

  const inputCls =
    "w-full rounded-xl border border-white/[0.07] bg-white/[0.04] py-3 text-sm text-white placeholder-[#3e5568] " +
    "focus:border-[#1e3cff]/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-[#1e3cff]/20 focus:outline-none transition-all";

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#05080f] text-white overflow-hidden">

      {/* LEFT PANEL */}
      <div className="relative hidden lg:flex lg:w-[52%] xl:w-[55%] flex-col justify-between overflow-hidden bg-[#050a14]">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.022)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.022)_1px,transparent_1px)] bg-[size:60px_60px]" />

        {/* SVG node graph art */}
        <div className="absolute inset-0 overflow-hidden">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 580 700" preserveAspectRatio="xMidYMid slice">
            <defs>
              <radialGradient id="coreGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stopColor="#3b6bff" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#3b6bff" stopOpacity="0"   />
              </radialGradient>
              <filter id="gblur"><feGaussianBlur stdDeviation="12" /></filter>
            </defs>
            <ellipse cx="290" cy="350" rx="270" ry="270" fill="url(#coreGrad)" filter="url(#gblur)" opacity="0.45" />
            <ellipse cx="120" cy="155" rx="110" ry="110" fill="rgba(0,210,255,0.11)" filter="url(#gblur)" />
            <ellipse cx="475" cy="555" rx="115" ry="100" fill="rgba(100,80,255,0.11)" filter="url(#gblur)" />
            {[
              [290,350,120,155],[290,350,455,200],[290,350,78,500],
              [290,350,475,530],[290,350,195,558],[290,350,398,102],
              [120,155,398,102],[455,200,475,530],[78,500,195,558],
            ].map(([x1,y1,x2,y2],i) => (
              <motion.line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="rgba(99,149,255,0.22)" strokeWidth="1" strokeDasharray="6 4"
                animate={{ strokeDashoffset: [0,-20] }}
                transition={{ duration:1.8, repeat:Infinity, ease:"linear", delay:i*0.15 }}
              />
            ))}
            {[
              [120,155, 9,"rgba(0,210,255,0.72)",  4.5,0   ],
              [455,200, 7,"rgba(99,149,255,0.65)", 5.0,0.5 ],
              [78, 500, 8,"rgba(167,100,255,0.6)", 4.0,1.0 ],
              [475,530, 6,"rgba(0,210,255,0.55)",  5.5,0.3 ],
              [195,558,10,"rgba(99,149,255,0.6)",  4.2,0.8 ],
              [398,102, 7,"rgba(52,211,153,0.55)", 4.8,0.2 ],
            ].map(([cx,cy,r,fill,dur,delay],i) => (
              <motion.circle key={i} cx={cx} cy={cy} r={r} fill={fill}
                animate={{ cy:[cy-15,cy+15,cy-15], opacity:[0.55,0.9,0.55] }}
                transition={{ duration:dur, repeat:Infinity, ease:"easeInOut", delay }}
              />
            ))}
            <motion.circle cx={290} cy={350} r={24} fill="rgba(37,70,255,0.2)" stroke="rgba(99,149,255,0.5)" strokeWidth="1.5"
              animate={{ r:[24,28,24], opacity:[0.65,1,0.65] }}
              transition={{ duration:3, repeat:Infinity, ease:"easeInOut" }} />
            <motion.circle cx={290} cy={350} r={13} fill="rgba(60,100,255,0.9)"
              animate={{ r:[13,15.5,13] }}
              transition={{ duration:3, repeat:Infinity, ease:"easeInOut" }} />
            <motion.circle cx={290} cy={350} r={30} fill="none" stroke="rgba(99,149,255,0.28)" strokeWidth="1"
              animate={{ r:[30,62], opacity:[0.5,0] }}
              transition={{ duration:2.6, repeat:Infinity, ease:"easeOut" }} />
          </svg>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#050a14]/72 via-transparent to-[#050a14]/92" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050a14]/65 via-transparent to-transparent" />

        {/* Top bar */}
        <div className="relative z-10 flex items-center justify-between px-10 pt-8">
          <Link href="/" className="group flex items-center gap-2.5">
            <ThreatLensLogo className="h-7 w-auto transition-transform duration-300 group-hover:scale-105" />
          </Link>
        </div>

        {/* Left content */}
        <div className="relative z-10 flex-1 flex flex-col justify-start px-10 xl:px-14 pt-14 xl:pt-16 pb-12">
          <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.7 }}>
            <h1 className="text-4xl xl:text-5xl font-extrabold leading-[1.1] tracking-tight text-white mb-4">
              Security that<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4facfe] via-[#00f2fe] to-[#4facfe]">
                leaves a receipt.
              </span>
            </h1>
            <p className="text-[15px] text-[#6d879e] leading-relaxed max-w-md">
              Intercept zero-day vulnerabilities, neutralize token leaks,
              and verify immutable audit trails before every deploy.
            </p>
          </motion.div>




        </div>

        {/* Bottom bar */}
        <div className="relative z-10 px-10 pb-8 flex items-center justify-end">
          <div className="flex items-center gap-5 text-[11px] text-[#4d6070]">
            <button onClick={() => toast.info("Standard ThreatLens security license.")} className="hover:text-[#93c5fd] transition-colors cursor-pointer">Terms</button>
            <button onClick={() => setLocation("/dashboard")} className="hover:text-[#93c5fd] transition-colors cursor-pointer">Plans</button>
            <button onClick={() => toast.info("security@threatlens.io")} className="hover:text-[#93c5fd] transition-colors cursor-pointer">Contact</button>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex flex-col min-h-screen relative overflow-y-auto bg-[#060b18]">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[radial-gradient(ellipse_at_top_right,rgba(37,90,255,0.16),transparent_65%)] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,200,255,0.08),transparent_65%)] pointer-events-none" />

        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-6 pt-6 pb-4">
          <Link href="/"><ThreatLensLogo className="h-6 w-auto" /></Link>
          <Link href="/" className="flex items-center gap-1.5 text-xs text-[#6d87a0] hover:text-white transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Link>
        </div>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center justify-between px-8 xl:px-12 pt-8">
          <Link href="/" className="flex items-center gap-2 text-xs text-[#5d7a94] hover:text-white transition-colors group">
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Overview
          </Link>
        </div>

        {/* Form container */}
        <div className="flex-1 flex items-center justify-center px-5 py-10">
          <motion.div
            initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.55, ease:[0.22,1,0.36,1] }}
            className="w-full max-w-[420px]"
          >
            {/* Mode toggle */}
            <div className="flex items-center gap-1 p-1 mb-8 rounded-2xl bg-white/[0.04] border border-white/[0.07]">
              {["signup","signin"].map((m) => (
                <button key={m} type="button" onClick={() => switchMode(m)}
                  className={"flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer " +
                    (mode === m
                      ? "bg-[#1e3cff] text-white shadow-[0_0_20px_rgba(30,60,255,0.45)]"
                      : "text-[#5d7a94] hover:text-white")}>
                  {m === "signup" ? "Create account" : "Sign in"}
                </button>
              ))}
            </div>

            {/* Heading */}
            <div className="mb-7">
              <div className="text-[28px] font-bold text-white tracking-tight leading-tight">
                {mode === "signup" ? "Get started free" : mode === "signin" ? "Welcome back" : "Reset password"}
              </div>
              <p className="text-sm text-[#5d7a94] mt-1.5">
                {mode === "signup"
                  ? "Create your ThreatLens workspace in seconds."
                  : mode === "signin"
                  ? "Sign in to your security intelligence dashboard."
                  : "Enter your email — we'll send a one-time code."}
              </p>
            </div>

            {/* Social buttons */}
            {mode !== "forgot" && (
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button type="button" onClick={() => handleSocialLogin("google")}
                  className="flex items-center justify-center gap-2.5 py-2.5 px-3 rounded-xl border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/[0.2] transition-all text-sm font-medium text-[#c5d4e8] cursor-pointer">
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  Google
                </button>
                <button type="button" onClick={() => handleSocialLogin("github")}
                  className="flex items-center justify-center gap-2.5 py-2.5 px-3 rounded-xl border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/[0.2] transition-all text-sm font-medium text-[#c5d4e8] cursor-pointer">
                  <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                  GitHub
                </button>
              </div>
            )}

            {/* Divider */}
            {mode !== "forgot" && (
              <div className="relative flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-white/[0.07]" />
                <span className="text-[11px] text-[#3e5468] font-medium uppercase tracking-widest">or email</span>
                <div className="flex-1 h-px bg-white/[0.07]" />
              </div>
            )}

            {/* Auth method pills */}
            {mode !== "forgot" && (
              <div className="flex gap-1.5 mb-5">
                {["password","otp"].map((m) => (
                  <button key={m} type="button" onClick={() => setMethod(m)}
                    className={"px-3 py-1 text-xs rounded-lg transition-all cursor-pointer font-medium " +
                      (method === m
                        ? "bg-black text-[#d8e2ec] border border-white/15"
                        : "text-[#4d6070] hover:text-[#8ea4be] border border-transparent")}>
                    {m === "password" ? "Password" : "Email OTP"}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">

              {mode === "signup" && (
                <Field label="Full name" id="auth-name">
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#3e5568]" />
                    <input id="auth-name" type="text" placeholder="Alex Vance" value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={inputCls + " pl-10 pr-4"} />
                  </div>
                </Field>
              )}

              <Field label="Email address" id="auth-email">
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#3e5568]" />
                  <input id="auth-email" type="email" placeholder="you@company.io" value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputCls + " pl-10 pr-4"} required />
                </div>
              </Field>

              {method === "password" ? (
                <>
                  <Field label="Password" id="auth-pw"
                    rightEl={mode === "signin" && (
                      <button type="button"
                        onClick={() => { setMode("forgot"); setMethod("otp"); }}
                        className="text-[11px] text-[#4facfe] hover:underline cursor-pointer">
                        Forgot password?
                      </button>
                    )}
                  >
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#3e5568]" />
                      <input id="auth-pw" type={showPassword ? "text" : "password"} placeholder="••••••••"
                        value={password} onChange={(e) => setPassword(e.target.value)}
                        className={inputCls + " pl-10 pr-10"} required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3e5568] hover:text-[#93c5fd] transition-colors cursor-pointer">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </Field>

                  {mode === "signup" && (
                    <Field label="Confirm password" id="auth-rpt">
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#3e5568]" />
                        <input id="auth-rpt" type={showRepeat ? "text" : "password"} placeholder="••••••••"
                          value={repeatPassword} onChange={(e) => setRepeatPassword(e.target.value)}
                          className={"w-full rounded-xl border bg-white/[0.04] pl-10 pr-10 py-3 text-sm text-white placeholder-[#3e5568] focus:outline-none focus:ring-2 transition-all " +
                            (repeatPassword && repeatPassword === password
                              ? "border-[#34d399]/40 focus:border-[#34d399]/60 focus:ring-[#34d399]/15"
                              : repeatPassword
                              ? "border-[#f87171]/40 focus:border-[#f87171]/60 focus:ring-[#f87171]/15"
                              : "border-white/[0.07] focus:border-[#1e3cff]/60 focus:ring-[#1e3cff]/20")}
                          required />
                        <button type="button" onClick={() => setShowRepeat(!showRepeat)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3e5568] hover:text-[#93c5fd] transition-colors cursor-pointer">
                          {showRepeat ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </Field>
                  )}
                </>
              ) : (
                <Field label="6-digit security code" id="auth-otp">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#3e5568]" />
                      <input id="auth-otp" type="text" maxLength={6} placeholder="123456" value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g,""))}
                        className={inputCls + " pl-10 pr-3 font-mono tracking-widest text-center"} required />
                    </div>
                    <button type="button" disabled={loading || otpCountdown > 0} onClick={handleSendOtp}
                      className="rounded-xl border border-[#1e3cff]/30 bg-[#1e3cff]/15 hover:bg-[#1e3cff]/25 px-4 py-3 text-xs font-semibold text-[#93c5fd] transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap">
                      {otpCountdown > 0 ? otpCountdown + "s" : otpSent ? "Resend" : "Send OTP"}
                    </button>
                  </div>
                </Field>
              )}

              {mode === "signup" && (
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <button type="button" onClick={() => setAcceptTerms(!acceptTerms)}
                    className={"w-4 h-4 rounded-md border flex items-center justify-center transition-all cursor-pointer shrink-0 " +
                      (acceptTerms
                        ? "bg-[#1e3cff] border-[#1e3cff] shadow-[0_0_10px_rgba(30,60,255,0.4)]"
                        : "border-white/[0.18] bg-transparent hover:border-white/[0.35]")}>
                    {acceptTerms && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                  </button>
                  <span className="text-xs text-[#5d7a94] group-hover:text-[#8ea4be] transition-colors select-none">
                    I agree to the{" "}
                    <span className="text-[#4facfe] hover:underline">Terms of Service</span>
                    {" "}and{" "}
                    <span className="text-[#4facfe] hover:underline">Privacy Policy</span>
                  </span>
                </label>
              )}

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-xs">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <button type="submit" disabled={loading}
                className="w-full relative overflow-hidden rounded-xl py-3.5 text-sm font-bold text-white cursor-pointer disabled:opacity-60 transition-all active:scale-[0.99] mt-1"
                style={{
                  background: "linear-gradient(135deg,#1e3cff 0%,#0b28e0 100%)",
                  boxShadow: "0 0 28px rgba(30,60,255,0.4),inset 0 1px 0 rgba(255,255,255,0.12)",
                }}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" /> Authenticating…
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    {mode === "signup" ? "Create account" : mode === "signin" ? "Sign in" : "Reset password"}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </button>

              <p className="text-center text-xs text-[#4d6070] pt-1">
                {mode === "signup" ? (
                  <>Already have an account?{" "}
                    <button type="button" onClick={() => switchMode("signin")}
                      className="text-[#4facfe] font-semibold hover:underline cursor-pointer">Sign in</button>
                  </>
                ) : (
                  <>Don't have an account?{" "}
                    <button type="button" onClick={() => switchMode("signup")}
                      className="text-[#4facfe] font-semibold hover:underline cursor-pointer">Create one</button>
                  </>
                )}
              </p>
            </form>
          </motion.div>
        </div>

        <div className="px-8 pb-6 text-center">
          <p className="text-[10px] text-[#2a3a4a]">
            &copy; {new Date().getFullYear()} ThreatLens Intelligence &middot; Zero-trust security infrastructure
          </p>
        </div>
      </div>
    </div>
  );
}
