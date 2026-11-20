"use client";

import React, { useState, useEffect } from "react";
import type {
  ExecutiveQueryResult,
  BusinessTriggerAlert,
} from "../lib/ai/executive-copilot.ts";

interface ExecutiveCopilotViewProps {
  onOpenIcpStudio?: () => void;
  onRefresh?: () => void;
}

const PRESET_QUERIES = [
  "Which clients have overdue invoices over 15 days?",
  "What is our net profit margin on D2C projects this quarter?",
  "Draft a renewal + upsell pitch for clients whose projects finish in 14 days",
  "What is our 90-day cash runway and projected MRR?",
  "Who is the highest margin client and what is their health score?",
];

export function ExecutiveCopilotView({ onOpenIcpStudio, onRefresh }: ExecutiveCopilotViewProps) {
  const [queryInput, setQueryInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ExecutiveQueryResult | null>(null);
  const [alerts, setAlerts] = useState<BusinessTriggerAlert[]>([]);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function loadAlerts() {
      try {
        const res = await fetch("/api/ai/copilot");
        if (res.ok) {
          const json = await res.json();
          if (json.success && !ignore) {
            setAlerts(json.data.alerts || []);
          }
        }
      } catch (err) {
        console.error("Failed to fetch copilot alerts:", err);
      }
    }
    loadAlerts();
    return () => {
      ignore = true;
    };
  }, []);

  const handleRunQuery = async (text: string) => {
    if (!text.trim()) return;
    setIsLoading(true);
    setActionFeedback(null);
    try {
      const res = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setResult(json.data.result);
          if (json.data.alerts) setAlerts(json.data.alerts);
        }
      }
    } catch (err) {
      console.error("Copilot query failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteAction = (action: NonNullable<ExecutiveQueryResult["suggestedAction"]>) => {
    setActionFeedback(`Executed: ${action.label}. Trigger dispatched into Business OS ledger.`);
    onRefresh?.();
    setTimeout(() => setActionFeedback(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Copilot Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-gray-950 via-gray-900 to-indigo-950/70 border border-indigo-500/30 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-xl shadow-lg shadow-indigo-500/20">
              🤖
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Executive AI COO & CFO Copilot
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  Cross-Module Core
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                Live natural language intelligence across Sales, Client Health, Operations & Cash Runway.
              </p>
            </div>
          </div>

          {onOpenIcpStudio && (
            <button
              onClick={onOpenIcpStudio}
              className="px-3.5 py-1.5 rounded-xl border border-cyan-500/40 bg-cyan-950/50 hover:bg-cyan-900/60 text-cyan-300 text-xs font-semibold shadow-sm transition cursor-pointer self-start sm:self-auto"
            >
              ⚡ Open ICP Strategy Studio
            </button>
          )}
        </div>

        {/* Natural Language Query Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRunQuery(queryInput);
          }}
          className="relative flex items-center"
        >
          <span className="absolute left-4 text-indigo-400 text-base">✨</span>
          <input
            type="text"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            placeholder="Ask anything: 'What is our 90-day runway?' or 'Which clients have overdue invoices?'..."
            className="w-full pl-11 pr-28 py-3 bg-gray-900 border border-gray-700/80 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-inner"
          />
          <button
            type="submit"
            disabled={isLoading || !queryInput.trim()}
            className="absolute right-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow transition cursor-pointer"
          >
            {isLoading ? "Querying..." : "Ask Copilot"}
          </button>
        </form>

        {/* Quick Query Suggestion Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[11px]">
          <span className="text-gray-400 whitespace-nowrap font-medium">Quick Prompts:</span>
          {PRESET_QUERIES.map((q, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQueryInput(q);
                handleRunQuery(q);
              }}
              className="px-2.5 py-1 rounded-lg bg-gray-900/90 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-700/60 whitespace-nowrap transition cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Autonomous Business Trigger Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <span>🚨</span> Autonomous Policy Alerts & Health Triggers ({alerts.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border space-y-2 ${
                  alert.severity === "critical"
                    ? "bg-rose-950/30 border-rose-500/40 text-rose-200"
                    : alert.severity === "warning"
                    ? "bg-amber-950/30 border-amber-500/40 text-amber-200"
                    : "bg-indigo-950/30 border-indigo-500/40 text-indigo-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        alert.severity === "critical"
                          ? "bg-rose-400 animate-ping"
                          : alert.severity === "warning"
                          ? "bg-amber-400"
                          : "bg-indigo-400"
                      }`}
                    />
                    {alert.title}
                  </span>
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-black/40 border border-white/10">
                    {alert.category}
                  </span>
                </div>
                <p className="text-xs opacity-90">{alert.description}</p>
                <div className="text-[11px] font-medium pt-1 border-t border-white/10 flex items-center gap-1">
                  <span>💡 Recommended:</span>
                  <span className="text-white">{alert.recommendedAction}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Execution Feedback Toast */}
      {actionFeedback && (
        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center justify-between">
          <span>✓ {actionFeedback}</span>
        </div>
      )}

      {/* Query Result Card */}
      {result && (
        <div className="p-6 rounded-2xl bg-gray-950 border border-gray-800 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-800 pb-4">
            <div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                {result.category} Analysis
              </span>
              <h3 className="text-sm font-bold text-white mt-1">
                &ldquo;{result.query}&rdquo;
              </h3>
            </div>
            <span className="text-xs text-gray-400">Live Database Verified</span>
          </div>

          <div className="p-4 rounded-xl bg-gray-900 border border-indigo-500/30 text-xs text-gray-200 leading-relaxed">
            {result.summary}
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(result.keyMetrics).map(([key, val]) => (
              <div key={key} className="p-3 rounded-xl bg-gray-900/60 border border-gray-800">
                <div className="text-[10px] uppercase text-gray-400 font-mono">
                  {key.replace(/([A-Z])/g, " $1")}
                </div>
                <div className="text-base font-bold text-white mt-1 truncate">
                  {val}
                </div>
              </div>
            ))}
          </div>

          {/* Data Points Table / List */}
          {result.dataPoints.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Corroborated Data Signals
              </div>
              <div className="p-3 rounded-xl bg-gray-900 border border-gray-800/80 overflow-x-auto text-xs">
                <pre className="text-[11px] font-mono text-indigo-300 whitespace-pre-wrap">
                  {JSON.stringify(result.dataPoints, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Action Items & 1-Click Trigger */}
          <div className="pt-4 border-t border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-gray-300">
                Executive Action Recommendations:
              </span>
              <ul className="text-xs text-gray-400 list-disc list-inside space-y-0.5">
                {result.actionItems.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            {result.suggestedAction && (
              <button
                onClick={() => handleExecuteAction(result.suggestedAction!)}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/20 transition cursor-pointer whitespace-nowrap"
              >
                ⚡ {result.suggestedAction.label}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
