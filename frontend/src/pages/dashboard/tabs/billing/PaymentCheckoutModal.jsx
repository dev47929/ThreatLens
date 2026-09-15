import React, { useState, useMemo } from "react";
import {
  X,
  CreditCard,
  Shield,
  Lock,
  Sparkles,
  CheckCircle2,
  Check,
  ChevronRight,
  Zap,
  Building2,
  ArrowRight,
  Copy,
  Download,
  Wallet,
  FileText,
  HelpCircle,
  AlertCircle,
  BadgeCheck,
  Loader2,
  Percent,
  Tag,
  Clock,
  Globe,
} from "lucide-react";
import { toast } from "sonner";

// Test presets for instant one-click testing
const TEST_CARDS = [
  { brand: "visa", label: "Test Visa", number: "4242 4242 4242 4242", expiry: "12/28", cvc: "424", name: "Alex Vance" },
  { brand: "mastercard", label: "Test Mastercard", number: "5555 5555 5555 4444", expiry: "10/27", cvc: "888", name: "Sarah Chen" },
  { brand: "amex", label: "Test Amex", number: "3782 822463 10005", expiry: "08/29", cvc: "3005", name: "Dev Sharma" },
];

const PROMO_CODES = {
  HACKER20: { discountPercent: 20, description: "20% Hacker Discount Applied" },
  DEFCON50: { discountPercent: 50, description: "50% DEFCON Community Pass" },
  THREAT100: { discountPercent: 100, description: "100% Free Sandbox Pass ($0.00 Total)" },
};

function detectCardBrand(number) {
  const clean = number.replace(/\s+/g, "");
  if (clean.startsWith("4")) return "visa";
  if (clean.startsWith("51") || clean.startsWith("52") || clean.startsWith("53") || clean.startsWith("54") || clean.startsWith("55")) return "mastercard";
  if (clean.startsWith("34") || clean.startsWith("37")) return "amex";
  return "generic";
}

export default function PaymentCheckoutModal({
  isOpen,
  onClose,
  currentPlan,
  targetPlan,
  billingCycle: initialBillingCycle = "monthly",
  currentUser,
  onPaymentSuccess,
  onViewInvoice,
}) {
  const [billingCycle, setBillingCycle] = useState(initialBillingCycle);
  const [paymentMethod, setPaymentMethod] = useState("card"); // 'card' | 'crypto' | 'po'

  // Card Form State
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [cardHolder, setCardHolder] = useState(currentUser?.name || "Alex Vance");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvc, setCardCvc] = useState("424");
  const [postalCode, setPostalCode] = useState("94103");
  const [saveCard, setSaveCard] = useState(true);

  // Crypto state
  const [cryptoCurrency, setCryptoCurrency] = useState("ETH");
  const [cryptoNetwork, setCryptoNetwork] = useState("Ethereum Mainnet");

  // Corporate PO State
  const [companyName, setCompanyName] = useState("Acme Security Corp");
  const [poNumber, setPoNumber] = useState(`PO-TL-${Math.floor(100000 + Math.random() * 900000)}`);
  const [taxId, setTaxId] = useState("US-94-2819401");

  // Coupon / Promo
  const [promoInput, setPromoInput] = useState("");
  const [activePromo, setActivePromo] = useState(null);
  const [promoError, setPromoError] = useState("");

  // Processing & Success State
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0); // 0 to 4
  const [completedInvoice, setCompletedInvoice] = useState(null);

  if (!isOpen || !targetPlan) return null;

  // Pricing calculations
  const baseMonthly = targetPlan.monthlyPrice ?? 299;
  const baseYearly = targetPlan.yearlyPrice ?? 239;
  const unitPrice = billingCycle === "yearly" ? baseYearly : baseMonthly;
  const subtotal = billingCycle === "yearly" ? baseYearly * 12 : baseMonthly;

  let discount = 0;
  if (activePromo) {
    discount = (subtotal * activePromo.discountPercent) / 100;
  }
  const totalDue = Math.max(0, subtotal - discount);

  // Crypto conversion
  const ethRate = 3200; // 1 ETH = $3200
  const ethAmount = (totalDue / ethRate).toFixed(4);

  // Format Card input
  const handleCardNumberChange = (e) => {
    let val = e.target.value.replace(/\D/g, "").slice(0, 16);
    let formatted = val.match(/.{1,4}/g)?.join(" ") || val;
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (val.length >= 3) {
      val = val.slice(0, 2) + "/" + val.slice(2);
    }
    setCardExpiry(val);
  };

  const applyPromo = (codeToApply = null) => {
    const code = (codeToApply || promoInput).trim().toUpperCase();
    if (!code) return;
    if (PROMO_CODES[code]) {
      setActivePromo({ code, ...PROMO_CODES[code] });
      setPromoError("");
      toast.success(`Coupon "${code}" applied! ${PROMO_CODES[code].description}`);
    } else {
      setPromoError("Invalid promo code. Try HACKER20, DEFCON50, or THREAT100");
      toast.error("Invalid coupon code");
    }
  };

  const removePromo = () => {
    setActivePromo(null);
    setPromoInput("");
    setPromoError("");
    toast.info("Coupon removed");
  };

  const handleFillTestCard = (testCard) => {
    setCardNumber(testCard.number);
    setCardExpiry(testCard.expiry);
    setCardCvc(testCard.cvc);
    setCardHolder(testCard.name);
    toast.success(`Loaded ${testCard.label} preset`);
  };

  const detectedBrand = detectCardBrand(cardNumber);

  // Payment Execution Simulation
  const handleAuthorizePayment = async () => {
    setIsProcessing(true);
    setProcessingStep(1);

    // Step 1: 3D Secure / TLS handshake
    await new Promise((r) => setTimeout(r, 600));
    setProcessingStep(2);

    // Step 2: Billing Gateway Authorization
    await new Promise((r) => setTimeout(r, 700));
    setProcessingStep(3);

    // Step 3: Quota Provisioning & AST Limits Sync
    await new Promise((r) => setTimeout(r, 600));
    setProcessingStep(4);

    // Step 4: Merkle Blockchain Audit Anchor
    await new Promise((r) => setTimeout(r, 500));

    // Build generated invoice record
    const invoiceId = `INV-TL-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const authCode = `TL-AUTH-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const merkleHash = "0x" + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("");

    let paymentMethodDisplay = "Visa ending in 4242";
    if (paymentMethod === "card") {
      const last4 = cardNumber.replace(/\s+/g, "").slice(-4) || "4242";
      const brandName = detectedBrand === "visa" ? "Visa" : detectedBrand === "mastercard" ? "Mastercard" : detectedBrand === "amex" ? "Amex" : "Card";
      paymentMethodDisplay = `${brandName} ending in ${last4}`;
    } else if (paymentMethod === "crypto") {
      paymentMethodDisplay = `Web3 (${cryptoCurrency} on ${cryptoNetwork})`;
    } else if (paymentMethod === "po") {
      paymentMethodDisplay = `Corporate PO #${poNumber}`;
    }

    const newInvoice = {
      id: invoiceId,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      timestamp: new Date().toISOString(),
      plan: targetPlan.name,
      planId: targetPlan.id,
      billingCycle: billingCycle === "yearly" ? "Annual" : "Monthly",
      tokensAllocated: targetPlan.tokens,
      subtotal: subtotal,
      discount: discount,
      promoCode: activePromo?.code || null,
      amount: totalDue,
      currency: "USD",
      status: "PAID",
      paymentMethod: paymentMethodDisplay,
      authCode: authCode,
      merkleRoot: merkleHash,
      customerName: cardHolder || currentUser?.name || "Alex Vance",
      customerEmail: currentUser?.email || "alex@threatlens.io",
      accountId: currentUser?.id || "1",
      description: `ThreatLens ${targetPlan.name} Subscription (${billingCycle === "yearly" ? "Annual" : "Monthly"})`,
    };

    setCompletedInvoice(newInvoice);
    setIsProcessing(false);

    // Notify parent to update plan in backend and localStorage
    if (onPaymentSuccess) {
      await onPaymentSuccess(newInvoice, targetPlan);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-5 lg:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#0b0f17] border border-[#1f2d40] rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col my-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1c2738] bg-[#0f1522]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#38bdf8]/15 border border-[#38bdf8]/30 flex items-center justify-center">
              <Shield className="w-4 h-4 text-[#38bdf8]" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>ThreatLens Secure Payment Gateway</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                  256-BIT SSL
                </span>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-[10px] font-bold">
                  SIMULATED SANDBOX
                </span>
              </div>
              <p className="text-[11px] text-[#8a99ad]">Zero-risk simulated tier transition with instant quota sync</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 rounded-lg text-[#8a99ad] hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── PROCESSING ANIMATION SCREEN ── */}
        {isProcessing && (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-6 min-h-[420px] bg-[#0c111a]">
            <div className="relative flex items-center justify-center">
              <div className="w-20 h-20 rounded-full border-4 border-[#1e2d42] border-t-[#38bdf8] animate-spin" />
              <Shield className="w-8 h-8 text-[#38bdf8] absolute" />
            </div>
            <div className="space-y-2 max-w-md">
              <h3 className="text-lg font-bold text-white">Authorizing Subscription Upgrade</h3>
              <p className="text-xs text-[#8a99ad]">
                Executing cryptographic handshake & updating account permissions...
              </p>
            </div>

            {/* Stepper indicators */}
            <div className="w-full max-w-md space-y-3 pt-4">
              {[
                { step: 1, label: "Validating payment credentials & 3D Secure 2.0" },
                { step: 2, label: "Authorizing with ThreatLens Security Gateway" },
                { step: 3, label: `Provisioning ${targetPlan.name} quota (${targetPlan.tokens})` },
                { step: 4, label: "Anchoring audit verification to Merkle chain" },
              ].map(({ step, label }) => (
                <div
                  key={step}
                  className={`flex items-center gap-3 text-xs p-2.5 rounded-xl border transition-all ${
                    processingStep > step
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-medium"
                      : processingStep === step
                      ? "bg-[#38bdf8]/10 border-[#38bdf8]/40 text-[#38bdf8] font-bold"
                      : "bg-[#090d14] border-[#182332] text-[#475569]"
                  }`}
                >
                  {processingStep > step ? (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : processingStep === step ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#38bdf8] shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-[#334155] flex items-center justify-center text-[10px] shrink-0">
                      {step}
                    </div>
                  )}
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PAYMENT SUCCESS CONFIRMATION SCREEN ── */}
        {!isProcessing && completedInvoice && (
          <div className="p-8 sm:p-10 flex flex-col items-center justify-center text-center space-y-6 bg-[#0c111a] animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.3)]">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  Tier Upgrade Active
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Welcome to ThreatLens {targetPlan.name}!
              </h2>
              <p className="text-xs sm:text-sm text-[#8a99ad] max-w-md mx-auto">
                Your account has been upgraded immediately. Token quota and AST scanning features are now live.
              </p>
            </div>

            {/* Receipt Quick Preview Card */}
            <div className="w-full max-w-lg p-5 rounded-2xl bg-[#080c12] border border-[#1c293a] text-left text-xs space-y-3.5 shadow-xl">
              <div className="flex justify-between items-center pb-3 border-b border-[#182332]">
                <span className="text-[#8a99ad]">Invoice Number</span>
                <span className="font-mono text-white font-bold">{completedInvoice.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#8a99ad]">New Subscription Plan</span>
                <span className="font-bold text-[#38bdf8] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#38bdf8]" />
                  <span>ThreatLens {completedInvoice.plan}</span>
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#8a99ad]">Token Quota</span>
                <span className="font-mono text-emerald-400 font-semibold">{completedInvoice.tokensAllocated}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#8a99ad]">Amount Paid</span>
                <span className="font-mono text-lg font-bold text-white">${Number(completedInvoice.amount).toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#8a99ad]">Payment Method</span>
                <span className="text-[#cbd5e1]">{completedInvoice.paymentMethod}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-[#182332] text-[11px]">
                <span className="text-[#64748b]">Merkle Proof</span>
                <span className="font-mono text-[#8a99ad] truncate max-w-[220px]">{completedInvoice.merkleRoot}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  if (onViewInvoice) onViewInvoice(completedInvoice);
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1a2535] hover:bg-[#223147] border border-[#2b3d56] text-xs font-semibold text-white transition-all cursor-pointer"
              >
                <FileText className="w-4 h-4 text-[#38bdf8]" />
                <span>View / Print Full Invoice</span>
              </button>
              <button
                onClick={onClose}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-xs font-bold text-white shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
              >
                <span>Return to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── CHECKOUT FORM & INTERACTIVE CARD PREVIEW ── */}
        {!isProcessing && !completedInvoice && (
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#1c2738] overflow-y-auto max-h-[80vh]">
            {/* LEFT COLUMN: Payment details & Live Cyber Card (7 cols) */}
            <div className="lg:col-span-7 p-6 sm:p-7 space-y-6">
              {/* Payment Method Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#cbd5e1] uppercase tracking-wider flex items-center justify-between">
                  <span>Select Payment Method</span>
                  <span className="text-[10.5px] text-[#64748b] font-normal lowercase">simulated demo</span>
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      paymentMethod === "card"
                        ? "bg-[#182333] border-[#38bdf8] text-white shadow-[0_0_15px_rgba(56,189,248,0.15)]"
                        : "bg-[#0c1118] border-[#1f2b3c] text-[#8a99ad] hover:text-white hover:border-[#2f4058]"
                    }`}
                  >
                    <CreditCard className={`w-4 h-4 mb-1.5 ${paymentMethod === "card" ? "text-[#38bdf8]" : ""}`} />
                    <span>Credit Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("crypto")}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      paymentMethod === "crypto"
                        ? "bg-[#182333] border-[#a78bfa] text-white shadow-[0_0_15px_rgba(167,139,250,0.15)]"
                        : "bg-[#0c1118] border-[#1f2b3c] text-[#8a99ad] hover:text-white hover:border-[#2f4058]"
                    }`}
                  >
                    <Wallet className={`w-4 h-4 mb-1.5 ${paymentMethod === "crypto" ? "text-[#a78bfa]" : ""}`} />
                    <span>Web3 Crypto</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("po")}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      paymentMethod === "po"
                        ? "bg-[#182333] border-[#34d399] text-white shadow-[0_0_15px_rgba(52,211,153,0.15)]"
                        : "bg-[#0c1118] border-[#1f2b3c] text-[#8a99ad] hover:text-white hover:border-[#2f4058]"
                    }`}
                  >
                    <Building2 className={`w-4 h-4 mb-1.5 ${paymentMethod === "po" ? "text-[#34d399]" : ""}`} />
                    <span>Corporate PO</span>
                  </button>
                </div>
              </div>

              {/* ── METHOD 1: CREDIT CARD ── */}
              {paymentMethod === "card" && (
                <div className="space-y-5">
                  {/* Cyber Card Visualizer */}
                  <div className="relative w-full max-w-sm mx-auto h-48 rounded-2xl p-5 overflow-hidden border border-[#2d4361] shadow-2xl bg-gradient-to-br from-[#121c2d] via-[#0b121e] to-[#060a10] flex flex-col justify-between select-none">
                    {/* Glowing holographic sheen overlay */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 via-transparent to-blue-500/10 pointer-events-none" />
                    <div className="absolute -right-8 -bottom-8 w-36 h-36 rounded-full bg-[#38bdf8]/10 blur-2xl pointer-events-none" />

                    {/* Top of Card */}
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-2">
                        {/* Metallic chip */}
                        <div className="w-9 h-7 rounded bg-gradient-to-br from-[#e2e8f0] via-[#cbd5e1] to-[#94a3b8] border border-amber-300/40 p-1 flex flex-col justify-between shadow-inner">
                          <div className="w-full h-0.5 bg-[#64748b]/40 rounded" />
                          <div className="w-full h-0.5 bg-[#64748b]/40 rounded" />
                        </div>
                        {/* Contactless Wifi Icon */}
                        <div className="text-[#94a3b8] text-[10px] font-mono opacity-80">)))</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono tracking-widest text-[#38bdf8] font-bold">THREATLENS</span>
                        {detectedBrand === "visa" && (
                          <span className="font-extrabold italic text-sm tracking-wider text-white">VISA</span>
                        )}
                        {detectedBrand === "mastercard" && (
                          <div className="flex -space-x-2">
                            <div className="w-4 h-4 rounded-full bg-rose-500/90" />
                            <div className="w-4 h-4 rounded-full bg-amber-400/90" />
                          </div>
                        )}
                        {detectedBrand === "amex" && (
                          <span className="font-bold text-xs tracking-wider text-[#38bdf8] border border-[#38bdf8]/50 px-1 rounded">AMEX</span>
                        )}
                      </div>
                    </div>

                    {/* Card Number display */}
                    <div className="relative z-10">
                      <div className="font-mono text-base sm:text-lg tracking-[0.2em] text-white drop-shadow font-semibold">
                        {cardNumber || "•••• •••• •••• ••••"}
                      </div>
                    </div>

                    {/* Bottom row: Cardholder & Expiry */}
                    <div className="flex items-end justify-between relative z-10 text-[10.5px]">
                      <div>
                        <div className="text-[8px] uppercase tracking-wider text-[#64748b] font-semibold">Cardholder</div>
                        <div className="font-mono text-white font-medium uppercase tracking-wider truncate max-w-[170px]">
                          {cardHolder || "THREATLENS OPERATOR"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[8px] uppercase tracking-wider text-[#64748b] font-semibold">Expires</div>
                        <div className="font-mono text-white font-medium">{cardExpiry || "MM/YY"}</div>
                      </div>
                    </div>
                  </div>

                  {/* One-Click Test Presets */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[11px] font-semibold text-[#64748b]">Quick Test Fill:</span>
                    {TEST_CARDS.map((tc) => (
                      <button
                        key={tc.brand}
                        type="button"
                        onClick={() => handleFillTestCard(tc)}
                        className="px-2.5 py-1 rounded-lg bg-[#141d2a] hover:bg-[#1e2a3c] border border-[#243347] text-[11px] text-[#cbd5e1] hover:text-white transition-colors cursor-pointer"
                      >
                        ⚡ {tc.label}
                      </button>
                    ))}
                  </div>

                  {/* Input Fields */}
                  <div className="space-y-3.5">
                    <div>
                      <label className="text-[11px] font-semibold text-[#8a99ad] block mb-1">Cardholder Name</label>
                      <input
                        type="text"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        placeholder="Alex Vance"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#0d121b] border border-[#223043] focus:border-[#38bdf8] focus:outline-none text-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-[#8a99ad] block mb-1">Card Number</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={handleCardNumberChange}
                          placeholder="4242 4242 4242 4242"
                          maxLength={19}
                          className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#0d121b] border border-[#223043] focus:border-[#38bdf8] focus:outline-none text-white font-mono text-xs"
                        />
                        <CreditCard className="w-4 h-4 text-[#64748b] absolute right-3.5 top-3" />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-[#8a99ad] block mb-1">Expiry Date</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={handleExpiryChange}
                          placeholder="MM/YY"
                          maxLength={5}
                          className="w-full px-3 py-2.5 rounded-xl bg-[#0d121b] border border-[#223043] focus:border-[#38bdf8] focus:outline-none text-white font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-[#8a99ad] block mb-1">CVC / CVV</label>
                        <input
                          type="password"
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                          placeholder="424"
                          maxLength={4}
                          className="w-full px-3 py-2.5 rounded-xl bg-[#0d121b] border border-[#223043] focus:border-[#38bdf8] focus:outline-none text-white font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-[#8a99ad] block mb-1">Billing ZIP</label>
                        <input
                          type="text"
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value.slice(0, 10))}
                          placeholder="94103"
                          className="w-full px-3 py-2.5 rounded-xl bg-[#0d121b] border border-[#223043] focus:border-[#38bdf8] focus:outline-none text-white font-mono text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="saveCard"
                        checked={saveCard}
                        onChange={(e) => setSaveCard(e.target.checked)}
                        className="rounded border-[#2d3f56] bg-[#0d121b] text-[#38bdf8] focus:ring-0 cursor-pointer"
                      />
                      <label htmlFor="saveCard" className="text-xs text-[#8a99ad] cursor-pointer">
                        Save card for automated seamless renewals
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* ── METHOD 2: WEB3 CRYPTO ── */}
              {paymentMethod === "crypto" && (
                <div className="space-y-4 p-5 rounded-2xl bg-[#0d131e] border border-[#1f2d40] text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#141b29] border border-[#26374d]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#a78bfa]/20 border border-[#a78bfa]/40 flex items-center justify-center">
                        <Wallet className="w-4 h-4 text-[#a78bfa]" />
                      </div>
                      <div>
                        <div className="font-bold text-white">MetaMask Connected</div>
                        <div className="text-[10.5px] font-mono text-emerald-400">0x71C...4E89 (Sandbox Active)</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                      Ready
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-semibold text-[#8a99ad] block mb-1">Target Network</label>
                      <select
                        value={cryptoNetwork}
                        onChange={(e) => setCryptoNetwork(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#090d14] border border-[#223043] text-white text-xs focus:outline-none"
                      >
                        <option>Ethereum Mainnet (L1)</option>
                        <option>Arbitrum One (L2 Low Gas)</option>
                        <option>Polygon POS</option>
                        <option>ThreatLens Private Anchor Ledger</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-[#8a99ad] block mb-1">Currency</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setCryptoCurrency("ETH")}
                          className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 ${
                            cryptoCurrency === "ETH"
                              ? "bg-[#21163b] border-[#a78bfa] text-white"
                              : "bg-[#090d14] border-[#223043] text-[#8a99ad]"
                          }`}
                        >
                          <span>Ethereum (ETH)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setCryptoCurrency("USDC")}
                          className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 ${
                            cryptoCurrency === "USDC"
                              ? "bg-[#11243b] border-[#38bdf8] text-white"
                              : "bg-[#090d14] border-[#223043] text-[#8a99ad]"
                          }`}
                        >
                          <span>USD Coin (USDC)</span>
                        </button>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#070a10] border border-[#172230] space-y-1.5">
                      <div className="flex justify-between text-[#8a99ad]">
                        <span>Conversion Rate:</span>
                        <span className="text-white font-mono">1 ETH = ${ethRate} USD</span>
                      </div>
                      <div className="flex justify-between text-[#8a99ad]">
                        <span>Estimated Gas:</span>
                        <span className="text-emerald-400 font-mono">0.0001 ETH (~$0.32)</span>
                      </div>
                      <div className="flex justify-between text-white font-bold pt-1 border-t border-[#172230]">
                        <span>Total Crypto Due:</span>
                        <span className="font-mono text-[#a78bfa]">
                          {cryptoCurrency === "ETH" ? `${ethAmount} ETH` : `${totalDue.toFixed(2)} USDC`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── METHOD 3: CORPORATE PO ── */}
              {paymentMethod === "po" && (
                <div className="space-y-4 p-5 rounded-2xl bg-[#0d131e] border border-[#1f2d40] text-xs">
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-semibold text-[#8a99ad] block mb-1">Company Legal Entity</label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Acme Security Corp"
                        className="w-full px-3 py-2.5 rounded-xl bg-[#090d14] border border-[#223043] text-white text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-[#8a99ad] block mb-1">Purchase Order (PO) #</label>
                      <input
                        type="text"
                        value={poNumber}
                        onChange={(e) => setPoNumber(e.target.value)}
                        placeholder="PO-TL-928194"
                        className="w-full px-3 py-2.5 rounded-xl bg-[#090d14] border border-[#223043] text-white font-mono text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-[#8a99ad] block mb-1">Corporate Tax ID / VAT</label>
                      <input
                        type="text"
                        value={taxId}
                        onChange={(e) => setTaxId(e.target.value)}
                        placeholder="US-94-2819401"
                        className="w-full px-3 py-2.5 rounded-xl bg-[#090d14] border border-[#223043] text-white font-mono text-xs focus:outline-none"
                      />
                    </div>
                    <div className="p-3 rounded-xl bg-[#070a10] border border-[#172230] text-[11px] text-[#8a99ad] leading-relaxed">
                      Corporate Net-30 invoicing will automatically generate an approved enterprise invoice and provision unlimited security scanner seats.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Plan Summary, Promo Codes & Checkout Total (5 cols) */}
            <div className="lg:col-span-5 p-6 sm:p-7 bg-[#090d14] flex flex-col justify-between space-y-6">
              <div className="space-y-5">
                {/* Selected Plan Overview */}
                <div className="p-4 rounded-xl bg-[#0f1622] border border-[#1e2d42] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#38bdf8]/15 border border-[#38bdf8]/30 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-[#38bdf8]" />
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm">ThreatLens {targetPlan.name}</div>
                        <div className="text-[11px] text-emerald-400 font-medium">{targetPlan.tokens}</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-[10px] font-bold">
                      UPGRADE
                    </span>
                  </div>

                  {/* Billing Cycle Switcher */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#080c12] border border-[#182332] text-xs">
                    <span className="text-[#8a99ad]">Billing Frequency</span>
                    <div className="flex items-center gap-1 bg-[#131b26] p-0.5 rounded-md border border-[#223042]">
                      <button
                        type="button"
                        onClick={() => setBillingCycle("monthly")}
                        className={`px-2 py-1 rounded text-[10.5px] font-semibold transition-all cursor-pointer ${
                          billingCycle === "monthly" ? "bg-[#2563eb] text-white" : "text-[#8a99ad] hover:text-white"
                        }`}
                      >
                        Monthly
                      </button>
                      <button
                        type="button"
                        onClick={() => setBillingCycle("yearly")}
                        className={`px-2 py-1 rounded text-[10.5px] font-semibold transition-all cursor-pointer ${
                          billingCycle === "yearly" ? "bg-[#2563eb] text-white" : "text-[#8a99ad] hover:text-white"
                        }`}
                      >
                        Annual (-20%)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Promo Code Box */}
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-[#8a99ad] flex items-center justify-between">
                    <span>Discount Coupon</span>
                    {activePromo && (
                      <button
                        onClick={removePromo}
                        className="text-[10px] text-rose-400 hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </label>
                  {!activePromo ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={promoInput}
                          onChange={(e) => {
                            setPromoInput(e.target.value);
                            setPromoError("");
                          }}
                          placeholder="e.g. HACKER20, DEFCON50"
                          className="flex-1 px-3 py-2 rounded-xl bg-[#0d121b] border border-[#223043] focus:border-[#38bdf8] focus:outline-none text-white text-xs font-mono uppercase"
                        />
                        <button
                          type="button"
                          onClick={() => applyPromo()}
                          className="px-3.5 py-2 rounded-xl bg-[#1a2536] hover:bg-[#25344c] border border-[#2c3d55] text-xs font-semibold text-white transition-colors cursor-pointer"
                        >
                          Apply
                        </button>
                      </div>
                      {promoError && <div className="text-[11px] text-rose-400">{promoError}</div>}

                      {/* Quick Coupons */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-[#64748b]">Try:</span>
                        <button
                          type="button"
                          onClick={() => applyPromo("HACKER20")}
                          className="text-[10px] px-2 py-0.5 rounded bg-[#131b26] border border-[#1e2a3c] text-[#38bdf8] hover:bg-[#1a2538] cursor-pointer"
                        >
                          HACKER20 (-20%)
                        </button>
                        <button
                          type="button"
                          onClick={() => applyPromo("THREAT100")}
                          className="text-[10px] px-2 py-0.5 rounded bg-[#131b26] border border-[#1e2a3c] text-emerald-400 hover:bg-[#1a2538] cursor-pointer"
                        >
                          THREAT100 ($0 Free)
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                      <div className="flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5" />
                        <span>{activePromo.code} ({activePromo.discountPercent}% Off)</span>
                      </div>
                      <span className="font-mono font-bold">-${discount.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Calculation Breakdown */}
                <div className="p-4 rounded-xl bg-[#0d121b] border border-[#1a2434] space-y-2 text-xs">
                  <div className="flex justify-between text-[#8a99ad]">
                    <span>Subtotal ({billingCycle === "yearly" ? "12 months" : "1 month"})</span>
                    <span className="font-mono text-white">${subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-400 font-medium">
                      <span>Discount ({activePromo?.code})</span>
                      <span className="font-mono">-${discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#8a99ad]">
                    <span>Tax / VAT (B2B exempt)</span>
                    <span className="font-mono text-white">$0.00</span>
                  </div>
                  <div className="pt-2 border-t border-[#1a2434] flex justify-between items-baseline">
                    <span className="text-sm font-bold text-white">Total Due Today</span>
                    <div className="text-right">
                      <span className="text-2xl font-bold font-mono text-[#38bdf8]">${totalDue.toFixed(2)}</span>
                      <span className="text-[11px] text-[#64748b] ml-1">USD</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="space-y-3 pt-4">
                <button
                  type="button"
                  onClick={handleAuthorizePayment}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#2563eb] via-[#1d4ed8] to-[#1e40af] hover:brightness-110 text-white font-bold text-sm shadow-xl shadow-blue-900/40 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>
                    Authorize & Switch to {targetPlan.name} (${totalDue.toFixed(2)})
                  </span>
                </button>

                <div className="flex items-center justify-center gap-4 text-[10.5px] text-[#64748b]">
                  <div className="flex items-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-400" />
                    <span>Encrypted & Audited</span>
                  </div>
                  <span>•</span>
                  <span>Instant Activation</span>
                  <span>•</span>
                  <span>Cancel Anytime</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
