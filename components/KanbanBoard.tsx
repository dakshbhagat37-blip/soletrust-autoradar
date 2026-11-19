"use client";

import React, { useState } from "react";
import type { CrmLead, LeadStage } from "../lib/types/lead";
import { PIPELINE_STAGES, LEAD_STAGE_LABELS } from "../lib/types/lead";

type KanbanBoardProps = {
  leads: CrmLead[];
  onStageChange: (leadId: string, newStage: LeadStage) => void;
  onSelectLead: (lead: CrmLead) => void;
  onOpenOutreachModal: (lead: CrmLead) => void;
  onLaunchSearchPrompt?: (prompt: string) => void;
};

export function KanbanBoard({
  leads,
  onStageChange,
  onSelectLead,
  onOpenOutreachModal,
  onLaunchSearchPrompt,
}: KanbanBoardProps) {
  const [filterQuery, setFilterQuery] = useState("");
  const [pipelinePrompt, setPipelinePrompt] = useState("");
  const [minScoreFilter, setMinScoreFilter] = useState<number>(0);
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<LeadStage | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handlePromptSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pipelinePrompt.trim()) return;
    onLaunchSearchPrompt?.(pipelinePrompt);
  };

  const handleCopy = (key: string, text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const handleExportCsv = () => {
    const headers = [
      "ID",
      "Company",
      "Domain",
      "City",
      "Country",
      "Industry",
      "Decision Maker",
      "Role",
      "Email",
      "Phone",
      "Stage",
      "Score",
      "Priority",
      "Estimated Deal Value",
    ];

    const rows = leads.map((l) => [
      `"${l.id}"`,
      `"${l.companyName.replace(/"/g, '""')}"`,
      `"${l.website || ""}"`,
      `"${l.city || ""}"`,
      `"${l.country || ""}"`,
      `"${l.industry || ""}"`,
      `"${(l.primaryDecisionMakerName || "").replace(/"/g, '""')}"`,
      `"${(l.primaryDecisionMakerRole || "").replace(/"/g, '""')}"`,
      `"${l.primaryEmail || ""}"`,
      `"${l.primaryPhone || ""}"`,
      `"${l.stage}"`,
      l.qualificationScore,
      `"${l.priority}"`,
      l.estimatedDealValue || 0,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `autoradar-pipeline-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggedLeadId(leadId);
    e.dataTransfer.setData("text/plain", leadId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, stage: LeadStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverStage !== stage) {
      setDragOverStage(stage);
    }
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (e: React.DragEvent, targetStage: LeadStage) => {
    e.preventDefault();
    setDragOverStage(null);
    const leadId = draggedLeadId || e.dataTransfer.getData("text/plain");
    if (leadId) {
      onStageChange(leadId, targetStage);
      setDraggedLeadId(null);
    }
  };

  // Filter leads
  const filtered = leads.filter((l) => {
    if (minScoreFilter > 0 && l.qualificationScore < minScoreFilter) return false;
    if (priorityFilter !== "all" && l.priority !== priorityFilter) return false;
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    return (
      l.companyName.toLowerCase().includes(q) ||
      (l.city && l.city.toLowerCase().includes(q)) ||
      (l.industry && l.industry.toLowerCase().includes(q)) ||
      (l.primaryDecisionMakerName && l.primaryDecisionMakerName.toLowerCase().includes(q))
    );
  });

  // Calculate Pipeline Executive Metrics
  const totalPipelineValue = leads.reduce((acc, l) => acc + (l.estimatedDealValue || 0), 0);
  const avgScore = leads.length > 0 ? Math.round(leads.reduce((acc, l) => acc + l.qualificationScore, 0) / leads.length) : 0;
  const tierAPlusCount = leads.filter((l) => l.qualificationScore >= 80).length;

  return (
    <div className="flex flex-col gap-5">
      {/* 1. Executive Pipeline Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-900/50 p-4 rounded-2xl border border-gray-800 shadow-xl backdrop-blur-sm">
        <div className="px-3 py-1 border-r border-gray-800/80">
          <p className="text-[10px] font-mono uppercase text-gray-400">Total Prospects</p>
          <p className="text-xl font-bold font-mono text-white mt-0.5">{leads.length}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">{filtered.length} showing</p>
        </div>

        <div className="px-3 py-1 border-r border-gray-800/80">
          <p className="text-[10px] font-mono uppercase text-gray-400">Pipeline Deal Value</p>
          <p className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
            ${totalPipelineValue.toLocaleString()}
          </p>
          <p className="text-[10px] text-gray-500 mt-0.5">Estimated opportunity</p>
        </div>

        <div className="px-3 py-1 border-r border-gray-800/80">
          <p className="text-[10px] font-mono uppercase text-gray-400">Average Fit Score</p>
          <p className="text-xl font-bold font-mono text-indigo-400 mt-0.5">{avgScore}/100</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Verified intelligence</p>
        </div>

        <div className="px-3 py-1 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono uppercase text-gray-400">Tier A+ Prospects</p>
            <p className="text-xl font-bold font-mono text-cyan-400 mt-0.5">{tierAPlusCount}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">80+ Fit score</p>
          </div>
          <button
            onClick={handleExportCsv}
            disabled={leads.length === 0}
            className="px-3 py-1.5 rounded-xl border border-indigo-500/40 bg-indigo-950/40 hover:bg-indigo-900/50 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition shadow disabled:opacity-50 cursor-pointer"
            title="Export all leads in pipeline to CSV"
          >
            <span>📥</span>
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. AI Prompt Prospect Discovery Bar */}
      <form
        onSubmit={handlePromptSearch}
        className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-gray-950/60 shadow-lg backdrop-blur-sm"
      >
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse shadow-sm shadow-indigo-400" />
          <div>
            <span className="text-xs font-semibold text-indigo-200 uppercase tracking-wider block">
              ⚡ Instant AI Prospecting Bar
            </span>
            <span className="text-[11px] text-gray-400">
              Type any prompt to discover, verify, and drop new leads directly into this pipeline:
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto flex-1 sm:max-w-xl">
          <input
            type="text"
            value={pipelinePrompt}
            onChange={(e) => setPipelinePrompt(e.target.value)}
            placeholder="e.g. 'find D2C apparel brands in Australia for creative studio'"
            className="flex-1 px-3.5 py-2 rounded-xl bg-gray-950/90 border border-indigo-500/40 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-400 shadow-inner"
          />
          <button
            type="submit"
            disabled={!pipelinePrompt.trim()}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold disabled:opacity-50 transition cursor-pointer whitespace-nowrap shadow-lg flex items-center gap-1"
          >
            <span>⚡ Find Leads</span>
          </button>
        </div>
      </form>

      {/* 3. Filter Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gray-900/60 p-3.5 rounded-xl border border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-white">Pipeline View:</span>
          <span className="text-[11px] text-gray-400">Drag & drop cards across columns to advance deal status</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Text Search */}
          <input
            type="text"
            placeholder="Filter by company, city, contact..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-gray-950 border border-gray-800 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 w-full sm:w-52"
          />

          {/* Min Score Filter */}
          <select
            value={minScoreFilter}
            onChange={(e) => setMinScoreFilter(Number(e.target.value))}
            className="px-2.5 py-1.5 rounded-lg bg-gray-950 border border-gray-800 text-xs text-gray-300 focus:outline-none"
          >
            <option value={0}>All Fit Scores</option>
            <option value={60}>Fit Score 60+</option>
            <option value={75}>Fit Score 75+</option>
            <option value={80}>Tier A+ (80+)</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-gray-950 border border-gray-800 text-xs text-gray-300 focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical 🔥</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* 4. Kanban Columns Container with Drag & Drop */}
      <div className="flex gap-3.5 overflow-x-auto pb-4 scrollbar-thin">
        {PIPELINE_STAGES.map((stage) => {
          const stageLeads = filtered.filter((l) => l.stage === stage);
          const totalValue = stageLeads.reduce((acc, l) => acc + (l.estimatedDealValue || 0), 0);
          const isTarget = dragOverStage === stage;

          return (
            <div
              key={stage}
              onDragOver={(e) => handleDragOver(e, stage)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage)}
              className={`flex-shrink-0 w-80 rounded-2xl flex flex-col max-h-[76vh] transition-all duration-200 border ${
                isTarget
                  ? "bg-indigo-950/30 border-indigo-500 shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-400"
                  : "bg-gray-900/40 border-gray-800/80"
              }`}
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-gray-800/80 bg-gray-900/80 rounded-t-2xl flex items-center justify-between sticky top-0 z-10 backdrop-blur">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-200 tracking-wide">
                    {LEAD_STAGE_LABELS[stage] || stage}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-gray-800 text-gray-300">
                    {stageLeads.length}
                  </span>
                </div>
                {totalValue > 0 && (
                  <p className="text-[11px] font-mono text-emerald-400 font-semibold">
                    ${totalValue.toLocaleString()}
                  </p>
                )}
              </div>

              {/* Cards List */}
              <div className="p-3 flex flex-col gap-3 overflow-y-auto flex-1 scrollbar-thin">
                {stageLeads.length === 0 ? (
                  <div
                    className={`py-10 text-center text-xs rounded-xl border border-dashed transition-colors flex flex-col items-center justify-center gap-1 ${
                      isTarget
                        ? "border-indigo-400 text-indigo-300 bg-indigo-950/20"
                        : "border-gray-800/60 text-gray-600"
                    }`}
                  >
                    <span className="text-lg">📥</span>
                    <span>{isTarget ? "Drop to move here" : "No leads in this stage"}</span>
                  </div>
                ) : (
                  stageLeads.map((lead) => {
                    const isCopiedEmail = copiedKey === `email-${lead.id}`;
                    const isCopiedPhone = copiedKey === `phone-${lead.id}`;

                    return (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        className="p-3.5 rounded-xl bg-gray-950 border border-gray-800/90 hover:border-indigo-500/60 transition-all shadow-md group cursor-grab active:cursor-grabbing hover:shadow-indigo-500/10"
                      >
                        {/* Card Header: Title & Score Badge */}
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => onSelectLead(lead)}
                            className="text-left text-xs font-bold text-white hover:text-indigo-400 transition-colors line-clamp-1 cursor-pointer flex-1"
                          >
                            {lead.companyName}
                          </button>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-black font-mono shrink-0 ${
                              lead.qualificationScore >= 80
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : lead.qualificationScore >= 60
                                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                                : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            }`}
                          >
                            {lead.qualificationScore}/100
                          </span>
                        </div>

                        {/* Domain & Location */}
                        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-gray-400">
                          <span>📍 {lead.city || "Global"}{lead.country ? `, ${lead.country}` : ""}</span>
                          {lead.website && (
                            <>
                              <span>•</span>
                              <a
                                href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-400 hover:text-indigo-300 hover:underline line-clamp-1 text-[11px]"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {lead.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/.*$/, "")}
                              </a>
                            </>
                          )}
                        </div>

                        {/* Decision Maker Pill */}
                        {lead.primaryDecisionMakerName && (
                          <div className="mt-2 flex items-center gap-1.5 bg-gray-900/90 border border-gray-800 rounded-lg px-2 py-1 text-[11px]">
                            <span className="text-indigo-400 text-xs">👤</span>
                            <span className="font-semibold text-gray-200 truncate">
                              {lead.primaryDecisionMakerName}
                            </span>
                            {lead.primaryDecisionMakerRole && (
                              <span className="text-[10px] text-gray-400 truncate">
                                ({lead.primaryDecisionMakerRole})
                              </span>
                            )}
                          </div>
                        )}

                        {/* Quick Contact Touchpoints */}
                        <div className="mt-2 flex items-center gap-1.5 flex-wrap text-[10px]">
                          {lead.primaryEmail && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(`email-${lead.id}`, lead.primaryEmail!);
                              }}
                              className="px-2 py-0.5 rounded bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 hover:text-white transition flex items-center gap-1 cursor-pointer"
                              title="Click to copy email"
                            >
                              <span>✉️</span>
                              <span>{isCopiedEmail ? "Copied!" : "Copy Email"}</span>
                            </button>
                          )}

                          {lead.primaryPhone && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(`phone-${lead.id}`, lead.primaryPhone!);
                              }}
                              className="px-2 py-0.5 rounded bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 hover:text-white transition flex items-center gap-1 cursor-pointer"
                              title="Click to copy phone"
                            >
                              <span>📞</span>
                              <span>{isCopiedPhone ? "Copied!" : "Copy Phone"}</span>
                            </button>
                          )}

                          {lead.estimatedDealValue && (
                            <span className="ml-auto font-mono text-emerald-400 font-bold">
                              ${lead.estimatedDealValue.toLocaleString()}
                            </span>
                          )}
                        </div>

                        {/* Card Actions Footer */}
                        <div className="flex items-center justify-between gap-1 mt-2.5 pt-2 border-t border-gray-900 text-[10px]">
                          <button
                            type="button"
                            onClick={() => onOpenOutreachModal(lead)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 font-semibold transition flex items-center gap-1 cursor-pointer"
                          >
                            <span>⚡</span>
                            <span>Outreach</span>
                          </button>

                          {/* Quick Advance dropdown */}
                          <select
                            value={lead.stage}
                            onChange={(e) => onStageChange(lead.id, e.target.value as LeadStage)}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-gray-900 border border-gray-800 text-gray-300 rounded-lg px-2 py-1 text-[10px] focus:outline-none cursor-pointer"
                          >
                            {PIPELINE_STAGES.map((s) => (
                              <option key={s} value={s}>
                                → {LEAD_STAGE_LABELS[s]}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
