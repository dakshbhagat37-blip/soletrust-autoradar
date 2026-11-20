"use client";

import React, { useState, useEffect, useRef } from "react";
import type { CopilotBrainResult } from "@/lib/ai/copilot-brain";

interface MessageItem {
  id: string;
  sender: "user" | "copilot";
  text: string;
  data?: CopilotBrainResult;
  timestamp: string;
}

interface GlobalAICopilotProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: string) => void;
}

let messageIdCounter = 0;
function generateMessageId(prefix: string): string {
  messageIdCounter += 1;
  return `${prefix}-${messageIdCounter}`;
}

export function GlobalAICopilot({ isOpen, onClose, onNavigateTab }: GlobalAICopilotProps) {
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: "welcome-1",
      sender: "copilot",
      text: "👋 **Hello! I am your SoleTrust Sovereign AI Copilot.**\n\nAsk me anything across Tax Compliance, Live Lead Discovery, Pitch & SOW Contracts, or Financial Health:\n- *\"How much GST will I charge a client in Maharashtra vs. Delhi on a ₹1,50,000 retainer?\"*\n- *\"Find 15 taxation & CA firm owners in Mumbai\"*\n- *\"Create a custom pitch deck and SOW contract for Aura Botanicals with 50% advance\"*\n- *\"What is my net profit margin this month and which invoices are overdue?\"*",
      timestamp: "Just now",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputValue;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: MessageItem = {
      id: generateMessageId("usr"),
      sender: "user",
      text: textToSend.trim(),
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInputValue("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: textToSend }),
      });

      if (!res.ok) throw new Error("Failed to query AI Copilot");
      const json = await res.json();
      const brainResult: CopilotBrainResult | undefined = json.data?.brainResult;

      const copilotMsg: MessageItem = {
        id: generateMessageId("ai"),
        sender: "copilot",
        text: brainResult?.reply || json.data?.result?.summary || "Query processed successfully.",
        data: brainResult,
        timestamp: "Just now",
      };

      setMessages((prev) => [...prev, copilotMsg]);
    } catch {
      const errorMsg: MessageItem = {
        id: generateMessageId("err"),
        sender: "copilot",
        text: "⚠️ Offline Sovereign Engine Fallback: I could not reach the server API endpoint. Please check your network connection.",
        timestamp: "Just now",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const samplePrompts = [
    "How much GST on ₹1,50,000 in Maharashtra vs Delhi?",
    "Find 15 taxation & CA firm owners in Mumbai",
    "Create custom pitch deck & SOW contract for Aura Botanicals with 50% advance",
    "What is our net profit margin and which invoices are overdue?",
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end transition-opacity">
      <div className="w-full max-w-2xl bg-gray-900 border-l border-gray-800 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 bg-gray-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-500/20">
              ⚡
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                SoleTrust Conversational AI Copilot
                <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                  Sovereign Brain
                </span>
              </h2>
              <p className="text-[11px] text-gray-400">
                Tax &amp; GST Calculations • Live Discovery • Pitch/SOW Generator • Finance Ledger Q&amp;A
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-gray-500 bg-gray-800 px-2 py-0.5 rounded border border-gray-700">
              Ctrl+J
            </span>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-gray-800 transition"
              title="Close Drawer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${
                m.sender === "user" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`max-w-[92%] rounded-xl p-3.5 shadow-sm ${
                  m.sender === "user"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-800/90 text-gray-200 border border-gray-700/80"
                }`}
              >
                {/* Text Content */}
                <div className="prose prose-invert prose-xs max-w-none whitespace-pre-wrap leading-relaxed">
                  {m.text}
                </div>

                {/* Tax Breakdown Visual Card */}
                {m.data?.taxBreakdown && (
                  <div className="mt-3 p-3 bg-gray-900/90 rounded-lg border border-indigo-500/30 text-xs space-y-2">
                    <div className="font-semibold text-indigo-300 flex items-center justify-between">
                      <span>GST &amp; Compliance Itemization</span>
                      <span className="font-mono text-gray-400">SAC: {m.data.taxBreakdown.sacCode}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-gray-800/60 p-2 rounded">
                        <span className="text-gray-400">Subtotal:</span>
                        <div className="font-mono font-medium text-white">{m.data.taxBreakdown.subtotalFormatted}</div>
                      </div>
                      <div className="bg-gray-800/60 p-2 rounded">
                        <span className="text-gray-400">Total Tax:</span>
                        <div className="font-mono font-medium text-emerald-400">{m.data.taxBreakdown.totalTaxFormatted}</div>
                      </div>
                      {m.data.taxBreakdown.cgstFormatted && (
                        <div className="bg-gray-800/60 p-2 rounded">
                          <span className="text-gray-400">CGST (9%):</span>
                          <div className="font-mono text-gray-200">{m.data.taxBreakdown.cgstFormatted}</div>
                        </div>
                      )}
                      {m.data.taxBreakdown.sgstFormatted && (
                        <div className="bg-gray-800/60 p-2 rounded">
                          <span className="text-gray-400">SGST (9%):</span>
                          <div className="font-mono text-gray-200">{m.data.taxBreakdown.sgstFormatted}</div>
                        </div>
                      )}
                      {m.data.taxBreakdown.igstFormatted && (
                        <div className="col-span-2 bg-gray-800/60 p-2 rounded">
                          <span className="text-gray-400">IGST (18% Inter-State):</span>
                          <div className="font-mono text-gray-200">{m.data.taxBreakdown.igstFormatted}</div>
                        </div>
                      )}
                    </div>
                    <div className="pt-1.5 border-t border-gray-800 flex items-center justify-between font-medium">
                      <span className="text-gray-300">Invoice Total:</span>
                      <span className="font-mono text-white text-sm">{m.data.taxBreakdown.totalAmountFormatted}</span>
                    </div>
                    <button
                      onClick={() => onNavigateTab?.("finance")}
                      className="w-full mt-2 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 rounded text-center font-medium transition text-xs"
                    >
                      Open in Finance &amp; Ledger →
                    </button>
                  </div>
                )}

                {/* Lead Generation Visual Card */}
                {m.data?.leadsData && (
                  <div className="mt-3 p-3 bg-gray-900/90 rounded-lg border border-purple-500/30 text-xs space-y-2">
                    <div className="font-semibold text-purple-300 flex items-center justify-between">
                      <span>Discovered {m.data.leadsData.leadsCount} Verified Owners</span>
                      <span className="text-[10px] text-gray-400">UNKNOWN &gt; WRONG</span>
                    </div>
                    <div className="space-y-2">
                      {m.data.leadsData.leads.map((lead, idx) => (
                        <div key={idx} className="bg-gray-800/70 p-2 rounded border border-gray-700/50 text-[11px]">
                          <div className="font-semibold text-white flex justify-between">
                            <span>{lead.companyName}</span>
                            <span className="text-purple-400">{lead.city}</span>
                          </div>
                          <div className="text-gray-300 mt-0.5">
                            👤 {lead.ownerName} <span className="text-gray-400 font-mono">({lead.ownerRole})</span>
                          </div>
                          <div className="text-gray-400 font-mono text-[10px] mt-0.5">
                            📞 {lead.directPhone} • ✉️ {lead.verifiedEmail || "Direct (Verified via RDAP)"}
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => onNavigateTab?.("pipeline")}
                      className="w-full mt-2 py-1.5 bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 border border-purple-500/40 rounded text-center font-medium transition text-xs"
                    >
                      View in Relations CRM Kanban →
                    </button>
                  </div>
                )}

                {/* Closing Pitch & Contract Visual Card */}
                {m.data?.closingData && (
                  <div className="mt-3 p-3 bg-gray-900/90 rounded-lg border border-emerald-500/30 text-xs space-y-2">
                    <div className="font-semibold text-emerald-300">
                      8-Slide Prospect Deck &amp; SOW Generated
                    </div>
                    <div className="bg-gray-800/60 p-2 rounded text-[11px] space-y-1">
                      <div><strong className="text-gray-300">Client:</strong> {m.data.closingData.clientName}</div>
                      <div><strong className="text-gray-300">Retainer Value:</strong> {m.data.closingData.contractValue}</div>
                      <div><strong className="text-gray-300">Payment Milestone:</strong> {m.data.closingData.advanceSplit}</div>
                      <div><strong className="text-gray-300">Jurisdiction:</strong> {m.data.closingData.contractJurisdiction}</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onNavigateTab?.("pipeline")}
                        className="flex-1 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 rounded text-center font-medium transition text-[11px]"
                      >
                        Open SOW Contract
                      </button>
                      <button
                        onClick={() => onNavigateTab?.("pipeline")}
                        className="flex-1 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 rounded text-center font-medium transition text-[11px]"
                      >
                        Preview Pitch Deck
                      </button>
                    </div>
                  </div>
                )}

                {/* Financial Health Snapshot Card */}
                {m.data?.financeData && (
                  <div className="mt-3 p-3 bg-gray-900/90 rounded-lg border border-cyan-500/30 text-xs space-y-2">
                    <div className="font-semibold text-cyan-300">
                      Live Financial Health &amp; P&amp;L Metrics
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-gray-800/60 p-2 rounded">
                        <span className="text-gray-400">Net Profit Margin:</span>
                        <div className="font-mono text-emerald-400 font-bold">{m.data.financeData.netProfitMarginPercent}%</div>
                      </div>
                      <div className="bg-gray-800/60 p-2 rounded">
                        <span className="text-gray-400">Cash Runway:</span>
                        <div className="font-mono text-cyan-300 font-bold">{m.data.financeData.cashRunwayDays} days</div>
                      </div>
                      <div className="bg-gray-800/60 p-2 rounded">
                        <span className="text-gray-400">Overdue Invoices:</span>
                        <div className="font-mono text-amber-400 font-bold">{m.data.financeData.overdueInvoicesCount}</div>
                      </div>
                      <div className="bg-gray-800/60 p-2 rounded">
                        <span className="text-gray-400">Tax Reserves Needed:</span>
                        <div className="font-mono text-white font-bold">{m.data.financeData.taxReserveNeededFormatted}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => onNavigateTab?.("finance")}
                      className="w-full mt-2 py-1.5 bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 border border-cyan-500/40 rounded text-center font-medium transition text-xs"
                    >
                      Open Finance Dashboard →
                    </button>
                  </div>
                )}

                <div className="text-[10px] text-gray-400 text-right mt-1.5">
                  {m.timestamp}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-gray-400 text-xs italic bg-gray-800/50 p-2.5 rounded-lg border border-gray-800">
              <span className="animate-spin text-indigo-400">⚡</span>
              Consulting sovereign AI brain &amp; calculating exact figures...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Pills */}
        <div className="p-2 border-t border-gray-800/80 bg-gray-950/60 overflow-x-auto flex gap-1.5 text-xs no-scrollbar">
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p)}
              className="whitespace-nowrap px-2.5 py-1 bg-gray-800/70 hover:bg-gray-700 text-gray-300 rounded-full text-[11px] border border-gray-700/60 transition"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-gray-800 bg-gray-950 flex gap-2 items-center">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask anything: GST rules, find CA firm owners, generate pitch deck..."
            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-indigo-500 transition"
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputValue.trim() || isLoading}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg font-medium text-xs shadow-md transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
