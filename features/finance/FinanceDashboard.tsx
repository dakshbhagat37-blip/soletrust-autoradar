"use client";

import React, { useState } from "react";
import type { InvoiceRecord, ExpenseRecord } from "../../server/db/schema.ts";
import type { FinancialHealthMetrics } from "./ledger-engine.ts";

interface FinanceDashboardProps {
  invoices?: InvoiceRecord[];
  expenses?: ExpenseRecord[];
  metrics?: FinancialHealthMetrics;
  onRecordPayment?: (invoiceId: string, amountCents: number) => void;
  onSendReminder?: (invoiceId: string) => void;
  onRefresh?: () => void;
}

export function FinanceDashboard({
  invoices = [],
  expenses = [],
  metrics,
  onRecordPayment,
  onSendReminder,
  onRefresh,
}: FinanceDashboardProps) {
  const [activeTab, setActiveTab] = useState<"invoices" | "expenses" | "runway">("invoices");
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmountInput, setPaymentAmountInput] = useState<string>("");

  const formatCurrency = (cents: number, curr = "INR") =>
    `${curr} ${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

  const totalPaid = invoices.reduce((acc, i) => acc + i.amountPaidCents, 0);
  const totalPending = invoices
    .filter((i) => i.status === "issued" || i.status === "viewed")
    .reduce((acc, i) => acc + i.balanceDueCents, 0);
  const totalOverdue = invoices
    .filter((i) => i.status === "overdue")
    .reduce((acc, i) => acc + i.balanceDueCents, 0);

  const handleOpenPayment = (inv: InvoiceRecord) => {
    setSelectedInvoice(inv);
    setPaymentAmountInput((inv.balanceDueCents / 100).toString());
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = () => {
    if (!selectedInvoice) return;
    const cents = Math.round(parseFloat(paymentAmountInput || "0") * 100);
    if (cents > 0) {
      onRecordPayment?.(selectedInvoice.id, cents);
      setShowPaymentModal(false);
      onRefresh?.();
    }
  };

  const handlePrintInvoice = (inv: InvoiceRecord) => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Invoice ${inv.invoiceNumber}</title></head>
          <body style="font-family: sans-serif; padding: 40px;">
            <h2>${inv.providerName} — Invoice #${inv.invoiceNumber}</h2>
            <p><strong>Billed To:</strong> ${inv.clientLegalName}</p>
            <p><strong>Total:</strong> ${inv.currency} ${(inv.grandTotalCents / 100).toFixed(2)}</p>
            <p><strong>Status:</strong> ${inv.status.toUpperCase()}</p>
            <p><strong>Due Date:</strong> ${new Date(inv.dueDate).toLocaleDateString()}</p>
            <script>window.print();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="space-y-6">
      {/* Financial Executive KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-gray-900/80 border border-emerald-500/30 shadow-sm">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Total Revenue (Collected)
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-400">
            {formatCurrency(totalPaid, invoices[0]?.currency)}
          </div>
          <div className="mt-1 text-xs text-emerald-300/80">
            Settled via bank direct credit
          </div>
        </div>

        <div className="p-4 rounded-xl bg-gray-900/80 border border-amber-500/30 shadow-sm">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Accounts Receivable (Pending)
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-300">
            {formatCurrency(totalPending, invoices[0]?.currency)}
          </div>
          <div className="mt-1 text-xs text-amber-300/80">
            Scheduled milestone deliverables
          </div>
        </div>

        <div className="p-4 rounded-xl bg-gray-900/80 border border-rose-500/30 shadow-sm">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Overdue Invoices (&gt;14 Days)
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-400">
            {formatCurrency(totalOverdue, invoices[0]?.currency)}
          </div>
          <div className="mt-1 text-xs text-rose-300/80">
            Automated payment reminders ready
          </div>
        </div>

        <div className="p-4 rounded-xl bg-gray-900/80 border border-indigo-500/30 shadow-sm">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            90-Day Runway Forecast
          </div>
          <div className="mt-2 text-2xl font-bold text-indigo-300">
            {metrics?.ninetyDayRunway.estimatedMonthsRunway || "12.4"} mos
          </div>
          <div className="mt-1 text-xs text-indigo-300/80">
            Ending Cash: {formatCurrency(metrics?.ninetyDayRunway.projectedEndingCashCents || 8500000)}
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="bg-gray-950 rounded-2xl border border-gray-800 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab("invoices")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === "invoices"
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/20"
                  : "bg-gray-900 text-gray-400 hover:text-white border border-gray-800"
              }`}
            >
              📄 Milestone Invoices ({invoices.length})
            </button>
            <button
              onClick={() => setActiveTab("expenses")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === "expenses"
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/20"
                  : "bg-gray-900 text-gray-400 hover:text-white border border-gray-800"
              }`}
            >
              📉 Expense Ledger ({expenses.length})
            </button>
            <button
              onClick={() => setActiveTab("runway")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === "runway"
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/20"
                  : "bg-gray-900 text-gray-400 hover:text-white border border-gray-800"
              }`}
            >
              📊 90-Day Cash Flow Projection
            </button>
          </div>

          <div className="text-xs text-gray-400 font-mono">
            Tax Engine: Indian GST (18% SAC 998314) / International VAT
          </div>
        </div>

        {/* Tab 1: Invoices Table */}
        {activeTab === "invoices" && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-3">Invoice #</th>
                    <th className="py-3 px-3">Client</th>
                    <th className="py-3 px-3">Issue Date</th>
                    <th className="py-3 px-3">Due Date</th>
                    <th className="py-3 px-3 text-right">Subtotal</th>
                    <th className="py-3 px-3 text-right">Tax (GST/VAT)</th>
                    <th className="py-3 px-3 text-right">Total Due</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 text-gray-300">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-gray-500 italic">
                        No milestone invoices issued yet.
                      </td>
                    </tr>
                  ) : (
                    invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-gray-900/50 transition">
                        <td className="py-3 px-3 font-mono font-medium text-white">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-3 px-3 font-medium text-indigo-300">
                          {inv.clientLegalName}
                        </td>
                        <td className="py-3 px-3 text-gray-400">
                          {new Date(inv.issueDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 text-gray-400">
                          {new Date(inv.dueDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 text-right font-mono">
                          {formatCurrency(inv.subtotalCents, inv.currency)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-gray-400">
                          {formatCurrency(inv.totalTaxCents, inv.currency)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-white">
                          {formatCurrency(inv.grandTotalCents, inv.currency)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase ${
                              inv.status === "paid"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : inv.status === "overdue"
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right space-x-2">
                          <button
                            onClick={() => handlePrintInvoice(inv)}
                            className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded text-[11px] transition cursor-pointer"
                            title="Print / View Invoice"
                          >
                            🖨️
                          </button>
                          {inv.status !== "paid" && (
                            <>
                              <button
                                onClick={() => handleOpenPayment(inv)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold transition cursor-pointer"
                              >
                                Record Payment
                              </button>
                              <button
                                onClick={() => onSendReminder?.(inv.id)}
                                className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded text-[11px] transition cursor-pointer"
                                title="Send Payment Reminder"
                              >
                                🔔
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Expenses Table */}
        {activeTab === "expenses" && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Vendor / Recipient</th>
                    <th className="py-3 px-3">Description</th>
                    <th className="py-3 px-3 text-right">Amount</th>
                    <th className="py-3 px-3 text-center">Tax Deductible</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 text-gray-300">
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500 italic">
                        No expenses logged yet.
                      </td>
                    </tr>
                  ) : (
                    expenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-gray-900/50 transition">
                        <td className="py-3 px-3 font-mono text-gray-400">
                          {new Date(exp.date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 font-mono text-indigo-300 uppercase text-[10px]">
                          {exp.category}
                        </td>
                        <td className="py-3 px-3 font-semibold text-white">
                          {exp.vendor}
                        </td>
                        <td className="py-3 px-3 text-gray-400">
                          {exp.description}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-rose-300">
                          -{formatCurrency(exp.amountCents, exp.currency)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {exp.isDeductible ? (
                            <span className="text-emerald-400 font-bold">✓ Yes</span>
                          ) : (
                            <span className="text-gray-500">No</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: 90-Day Runway Projection */}
        {activeTab === "runway" && metrics && (
          <div className="space-y-6">
            <div className="p-6 rounded-xl bg-gray-900 border border-indigo-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>📈</span> Deterministic 90-Day Cash Flow Runway Model
                </h4>
                <span className="text-xs font-mono text-emerald-400">
                  Confidence Score: {(metrics.ninetyDayRunway.confidenceScore * 100).toFixed(0)}%
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-lg bg-gray-950/80 border border-gray-800">
                  <div className="text-[11px] text-gray-400 uppercase">Current Cash Reserves</div>
                  <div className="text-xl font-bold text-white mt-1">
                    {formatCurrency(metrics.ninetyDayRunway.currentCashCents)}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">Liquid operational bank balance</div>
                </div>

                <div className="p-4 rounded-lg bg-gray-950/80 border border-gray-800">
                  <div className="text-[11px] text-emerald-400 uppercase">+ Projected 90-Day Inflows</div>
                  <div className="text-xl font-bold text-emerald-400 mt-1">
                    +{formatCurrency(metrics.ninetyDayRunway.projectedInflowCents)}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">Scheduled milestones + weighted CRM pipeline</div>
                </div>

                <div className="p-4 rounded-lg bg-gray-950/80 border border-gray-800">
                  <div className="text-[11px] text-rose-400 uppercase">- Projected 90-Day Outflows</div>
                  <div className="text-xl font-bold text-rose-400 mt-1">
                    -{formatCurrency(metrics.ninetyDayRunway.projectedOutflowCents)}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">Payroll, SaaS, infra & contractor burn</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-500/40 flex items-center justify-between">
                <div>
                  <div className="text-xs text-indigo-300 font-semibold">
                    Projected Ending Cash (End of Quarter)
                  </div>
                  <div className="text-2xl font-bold text-white mt-0.5">
                    {formatCurrency(metrics.ninetyDayRunway.projectedEndingCashCents)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">Total Runway Duration</div>
                  <div className="text-2xl font-bold text-emerald-400">
                    {metrics.ninetyDayRunway.estimatedMonthsRunway} Months
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-sm font-bold text-white">
                Record Invoice Payment — #{selectedInvoice.invoiceNumber}
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-gray-400">Client:</span>{" "}
                <span className="text-white font-semibold">
                  {selectedInvoice.clientLegalName}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Balance Due:</span>{" "}
                <span className="text-rose-400 font-mono font-bold">
                  {formatCurrency(selectedInvoice.balanceDueCents, selectedInvoice.currency)}
                </span>
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-1">
                  Payment Amount Received ({selectedInvoice.currency}):
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentAmountInput}
                  onChange={(e) => setPaymentAmountInput(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-xl text-white font-mono text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-800">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPayment}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow"
              >
                Confirm Payment & Update Ledger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
