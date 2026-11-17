"use client";

import React, { useState } from "react";
import type { CrmLead, LeadStage } from "../lib/types/lead";
import { PIPELINE_STAGES, LEAD_STAGE_LABELS } from "../lib/types/lead";

type KanbanBoardProps = {
  leads: CrmLead[];
  onStageChange: (leadId: string, newStage: LeadStage) => void;
  onSelectLead: (lead: CrmLead) => void;
  onOpenOutreachModal: (lead: CrmLead) => void;
};

export function KanbanBoard({
  leads,
  onStageChange,
  onSelectLead,
  onOpenOutreachModal,
}: KanbanBoardProps) {
  const [filterQuery, setFilterQuery] = useState("");

  const filtered = leads.filter(
    (l) =>
      !filterQuery ||
      l.companyName.toLowerCase().includes(filterQuery.toLowerCase()) ||
      (l.city && l.city.toLowerCase().includes(filterQuery.toLowerCase()))
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Kanban Header controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gray-900/60 p-4 rounded-xl border border-gray-800">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <span>📊</span> Sales Pipeline (Kanban)
          </h2>
          <p className="text-xs text-gray-400">
            Drag or advance prospects through each sales stage with persistent activity audit
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Filter pipeline leads..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-gray-950 border border-gray-800 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 w-full sm:w-64"
          />
        </div>
      </div>

      {/* Columns Container */}
      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin">
        {PIPELINE_STAGES.map((stage) => {
          const stageLeads = filtered.filter((l) => l.stage === stage);
          const totalValue = stageLeads.reduce((acc, l) => acc + (l.estimatedDealValue || 0), 0);

          return (
            <div
              key={stage}
              className="flex-shrink-0 w-72 bg-gray-900/40 border border-gray-800/80 rounded-xl flex flex-col max-h-[75vh]"
            >
              {/* Column Header */}
              <div className="p-3 border-b border-gray-800 bg-gray-900/80 rounded-t-xl flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-200">
                      {LEAD_STAGE_LABELS[stage] || stage}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-gray-800 text-gray-400">
                      {stageLeads.length}
                    </span>
                  </div>
                  {totalValue > 0 && (
                    <p className="text-[10px] font-mono text-emerald-400 mt-0.5">
                      ₹{totalValue.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Cards List */}
              <div className="p-2.5 flex flex-col gap-2 overflow-y-auto flex-1">
                {stageLeads.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-600 border border-dashed border-gray-800/60 rounded-lg">
                    No leads in this stage
                  </div>
                ) : (
                  stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="p-3 rounded-lg bg-gray-950 border border-gray-800/80 hover:border-indigo-500/50 transition-all shadow-sm group"
                    >
                      {/* Top Row: Company Name & Score */}
                      <div className="flex items-start justify-between gap-2">
                        <button
                          onClick={() => onSelectLead(lead)}
                          className="text-left text-xs font-semibold text-white hover:text-indigo-400 transition-colors line-clamp-1"
                        >
                          {lead.companyName}
                        </button>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                            lead.qualificationScore >= 80
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : lead.qualificationScore >= 60
                              ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                              : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {lead.qualificationScore}
                        </span>
                      </div>

                      {/* City & Industry */}
                      <p className="text-[11px] text-gray-400 mt-1 line-clamp-1">
                        📍 {lead.city || "Global Location"} • {lead.industry || "Clinic"}
                      </p>

                      {/* Estimated Value */}
                      {lead.estimatedDealValue && (
                        <p className="text-[11px] font-mono text-emerald-400 mt-1">
                          ₹{lead.estimatedDealValue.toLocaleString()}
                        </p>
                      )}

                      {/* Next Action */}
                      {lead.nextAction && (
                        <p className="text-[10px] text-gray-500 mt-1.5 italic line-clamp-1 border-t border-gray-900 pt-1">
                          ⚡ {lead.nextAction}
                        </p>
                      )}

                      {/* Card Actions */}
                      <div className="flex items-center justify-between gap-1 mt-2.5 pt-2 border-t border-gray-900 text-[10px]">
                        <button
                          onClick={() => onOpenOutreachModal(lead)}
                          className="px-2 py-1 rounded bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/40 border border-indigo-500/30 font-medium transition-colors"
                        >
                          Outreach
                        </button>

                        <div className="flex items-center gap-1">
                          {/* Quick Advance dropdown */}
                          <select
                            value={lead.stage}
                            onChange={(e) => onStageChange(lead.id, e.target.value as LeadStage)}
                            className="bg-gray-900 border border-gray-800 text-gray-300 rounded px-1.5 py-1 text-[10px] focus:outline-none"
                          >
                            {PIPELINE_STAGES.map((s) => (
                              <option key={s} value={s}>
                                → {LEAD_STAGE_LABELS[s]}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

