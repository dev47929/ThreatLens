import React, { useRef } from "react";
import {
  X,
  Download,
  Printer,
  CheckCircle2,
  Shield,
  Copy,
  ExternalLink,
  CreditCard,
  Layers,
  Sparkles,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

export default function InvoiceReceiptModal({ isOpen, onClose, invoice }) {
  const receiptRef = useRef(null);

  if (!isOpen || !invoice) return null;

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadHtml = () => {
    if (!receiptRef.current) return;
    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>ThreatLens_Invoice_${invoice.id}.html</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0c0f14; color: #e2e8f0; padding: 40px; margin: 0; }
          .receipt-box { max-width: 680px; margin: 0 auto; background: #111822; border: 1px solid #1e293b; border-radius: 16px; padding: 36px; box-shadow: 0 10px 40px rgba(0,0,0,0.5); }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; padding-bottom: 24px; margin-bottom: 24px; }
          .logo { font-size: 22px; font-weight: bold; color: #38bdf8; letter-spacing: -0.5px; }
          .badge-paid { background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); color: #34d399; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
          .meta-label { color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px; margin-bottom: 4px; }
          .meta-val { color: #f8fafc; font-size: 14px; font-weight: 500; font-family: monospace; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
          th { text-align: left; padding: 10px 14px; background: #182230; color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
          td { padding: 14px; border-bottom: 1px solid #1e293b; color: #cbd5e1; font-size: 13px; }
          .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; color: #94a3b8; }
          .total-row.grand { font-size: 20px; font-weight: bold; color: #38bdf8; border-top: 1px solid #334155; padding-top: 16px; margin-top: 8px; }
          .footer { border-top: 1px dashed #334155; padding-top: 20px; text-align: center; color: #64748b; font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="receipt-box">
          <div class="header">
            <div>
              <div class="logo">ThreatLens AI Security</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Autonomous AST Offensive Security & Audit Engine</div>
            </div>
            <div class="badge-paid">✓ PAID</div>
          </div>
          <div class="grid-2">
            <div>
              <div class="meta-label">Billed To</div>
              <div class="meta-val" style="font-family: inherit; font-size: 14px;">${invoice.customerName || "ThreatLens Developer"}</div>
              <div style="font-size: 12px; color: #94a3b8; margin-top: 2px;">${invoice.customerEmail || "account@threatlens.io"}</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Account ID: #${invoice.accountId || "1"}</div>
            </div>
            <div style="text-align: right;">
              <div class="meta-label">Invoice Number</div>
              <div class="meta-val" style="color: #38bdf8;">${invoice.id}</div>
              <div class="meta-label" style="margin-top: 8px;">Date Issued</div>
              <div class="meta-val">${invoice.date}</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Cycle</th>
                <th>Tokens Quota</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>${invoice.description || `ThreatLens ${invoice.plan} Tier`}</strong><br><span style="font-size: 11px; color: #64748b;">Includes AST intelligence, probers & 3-way verification</span></td>
                <td>${invoice.billingCycle || "Monthly"}</td>
                <td>${invoice.tokensAllocated || "10M / mo"}</td>
                <td style="text-align: right; font-family: monospace; font-weight: bold; color: #f8fafc;">$${Number(invoice.amount).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          <div style="max-width: 260px; margin-left: auto; margin-bottom: 24px;">
            <div class="total-row"><span>Subtotal:</span><span>$${Number(invoice.subtotal || invoice.amount).toFixed(2)}</span></div>
            ${invoice.discount > 0 ? `<div class="total-row" style="color: #34d399;"><span>Discount (${invoice.promoCode || "PROMO"}):</span><span>-$${Number(invoice.discount).toFixed(2)}</span></div>` : ""}
            <div class="total-row"><span>Tax (0% VAT):</span><span>$0.00</span></div>
            <div class="total-row grand"><span>Total Paid:</span><span>$${Number(invoice.amount).toFixed(2)}</span></div>
          </div>
          <div class="footer">
            <div>Payment Method: ${invoice.paymentMethod || "Visa ending in 4242"} | Auth Code: ${invoice.authCode || "TL-SEC-8921"}</div>
            <div style="margin-top: 4px; font-family: monospace; font-size: 10px;">Merkle Audit Root: ${invoice.merkleRoot || "0x7f482ab4c08e827104b281f9"}</div>
            <div style="margin-top: 10px;">ThreatLens Security Inc. · 548 Market St, San Francisco, CA · support@threatlens.io</div>
          </div>
        </div>
      </body>
      </html>
    `;
    const blob = new Blob([content], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${invoice.id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Invoice HTML receipt downloaded!");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0e131b] border border-[#223044] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col my-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1c293a] bg-[#111822]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>Official Tax Receipt & Invoice</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold tracking-wide">
                  PAID
                </span>
              </div>
              <div className="text-[11px] font-mono text-[#8a99ad]">
                {invoice.id} · {invoice.date}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8a99ad] hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Area */}
        <div ref={receiptRef} className="p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[75vh]">
          {/* Brand header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#1c293a]">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#38bdf8]/20 border border-[#38bdf8]/40 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-[#38bdf8]" />
                </div>
                <span className="font-bold text-lg text-white tracking-tight">ThreatLens Security</span>
              </div>
              <p className="text-xs text-[#8a99ad] mt-1">Autonomous AST Offensive Security & Audit Engine</p>
            </div>
            <div className="sm:text-right">
              <div className="text-xs text-[#64748b] font-medium uppercase tracking-wider">Total Paid</div>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-[#38bdf8]">
                ${Number(invoice.amount).toFixed(2)}{" "}
                <span className="text-xs text-[#8a99ad] font-normal">USD</span>
              </div>
            </div>
          </div>

          {/* Meta Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#090d13] border border-[#1a2535] text-xs">
            <div className="space-y-1.5">
              <div className="text-[10.5px] font-semibold text-[#64748b] uppercase tracking-wider">
                Billed Account
              </div>
              <div className="font-medium text-white text-sm">
                {invoice.customerName || "ThreatLens Developer"}
              </div>
              <div className="text-[#8a99ad]">{invoice.customerEmail || "account@threatlens.io"}</div>
              <div className="text-[11px] text-[#64748b] font-mono">
                Account ID: #{invoice.accountId || "1"}
              </div>
            </div>

            <div className="space-y-1.5 sm:text-right">
              <div className="text-[10.5px] font-semibold text-[#64748b] uppercase tracking-wider">
                Transaction Details
              </div>
              <div className="font-mono text-white flex items-center sm:justify-end gap-1.5">
                <span>{invoice.id}</span>
                <button
                  onClick={() => copyToClipboard(invoice.id, "Invoice ID")}
                  className="text-[#8a99ad] hover:text-[#38bdf8] transition-colors"
                  title="Copy Invoice ID"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
              <div className="text-[#8a99ad]">Issued: {invoice.date}</div>
              <div className="text-[11px] text-emerald-400 font-medium">
                Authorization: {invoice.authCode || "TL-SEC-8921"} (Approved)
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="border border-[#1a2535] rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#111822] text-[#8a99ad] uppercase tracking-wider text-[10.5px] border-b border-[#1a2535]">
                <tr>
                  <th className="px-4 py-3">Plan / Description</th>
                  <th className="px-4 py-3">Billing Cycle</th>
                  <th className="px-4 py-3">Token Quota</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a2535] bg-[#0c1017]">
                <tr>
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-white">
                      {invoice.description || `ThreatLens ${invoice.plan} Subscription`}
                    </div>
                    <div className="text-[11px] text-[#64748b] mt-0.5">
                      Includes AST intelligence, offensive probers & tamper-proof audit anchor
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-[#cbd5e1] capitalize font-medium">
                    {invoice.billingCycle || "Monthly"}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-emerald-400">
                    {invoice.tokensAllocated || "10M / mo"}
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono font-bold text-white">
                    ${Number(invoice.subtotal || invoice.amount).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Calculation summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2">
            <div className="space-y-1.5 text-xs text-[#8a99ad]">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#38bdf8]" />
                <span>
                  Payment via:{" "}
                  <strong className="text-white">{invoice.paymentMethod || "Visa ending in 4242"}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-[#64748b]">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Merkle Audit Root:</span>
                <span className="truncate max-w-[200px] text-white">
                  {invoice.merkleRoot || "0x7f482ab4c08e827104b281f948bb319c"}
                </span>
              </div>
            </div>

            <div className="w-full sm:w-64 space-y-1.5 text-xs border-t sm:border-t-0 pt-3 sm:pt-0 border-[#1c293a]">
              <div className="flex justify-between text-[#8a99ad]">
                <span>Subtotal</span>
                <span className="font-mono text-white">
                  ${Number(invoice.subtotal || invoice.amount).toFixed(2)}
                </span>
              </div>
              {Number(invoice.discount) > 0 && (
                <div className="flex justify-between text-emerald-400 font-medium">
                  <span>Discount ({invoice.promoCode || "PROMO"})</span>
                  <span className="font-mono">-${Number(invoice.discount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#8a99ad]">
                <span>Taxes & Fees (0% B2B)</span>
                <span className="font-mono text-white">$0.00</span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-2 border-t border-[#1c293a] text-white">
                <span>Total Paid</span>
                <span className="font-mono text-[#38bdf8]">${Number(invoice.amount).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#1c293a] bg-[#111822] gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1a2535] hover:bg-[#223147] border border-[#2b3d56] text-xs font-semibold text-white transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>Print Receipt</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadHtml}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1e40af]/30 hover:bg-[#1e40af]/50 border border-[#3b82f6]/40 text-xs font-semibold text-[#60a5fa] hover:text-white transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download HTML / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#223044] hover:bg-[#2b3c54] text-xs font-semibold text-white transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
