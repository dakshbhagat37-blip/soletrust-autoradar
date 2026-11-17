"use client";

import React, { useState } from "react";
import type { CrmLead, LeadStage } from "../lib/types/lead";
import { LEAD_STAGE_LABELS, LEAD_STAGE_ORDER } from "../lib/types/lead";

type CrmLeadsTableProps = {
  leads: CrmLead[];
  onSelectLead: (lead: CrmLead) => void;
  onStageChange: (leadId: string, stage: LeadStage) => void;
  onOpenOutreachModal: (lead: CrmLead) => void;
};

export function CrmLeadsTable({
  leads,
  onSelectLead,
  onStageChange,
  onOpenOutreachModal,
}: CrmLeadsTableProps) {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const filtered = leads.filter((l) => {
    if (stageFilter !== "all" && l.stage !== stageFilter) return false;
    if (priorityFilter !== "all" && l.priority !== priorityFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        l.companyName.toLowerCase().includes(q) ||
        (l.city && l.city.toLowerCase().includes(q)) ||
        (l.industry && l.industry.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gray-900/60 p-4 rounded-xl border border-gray-800">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <span>📋</span> All Leads Database
          </h2>
          <p className="text-xs text-gray-400">
            Comprehensive audit table of verified businesses and sales pipeline records
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search company, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-gray-950 border border-gray-800 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 w-full sm:w-56"
          />

          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-gray-950 border border-gray-800 text-xs text-gray-300 focus:outline-none"
          >
            <option value="all">All Stages</option>
            {LEAD_STAGE_ORDER.map((s) => (
              <option key={s} value={s}>
                {LEAD_STAGE_LABELS[s]}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-gray-950 border border-gray-800 text-xs text-gray-300 focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-gray-800 bg-gray-950/70">
        <table className="w-full text-left text-xs text-gray-300 border-collapse">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-900/80 text-[11px] uppercase tracking-wider text-gray-400 font-mono">
              <th className="p-3.5">Company & Website</th>
              <th className="p-3.5">Location</th>
              <th className="p-3.5">Industry</th>
              <th className="p-3.5">Stage</th>
              <th className="p-3.5">Priority</th>
              <th className="p-3.5 text-right">Score</th>
              <th className="p-3.5 text-right">Deal Value</th>
              <th className="p-3.5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-500 text-xs">
                  No matching leads found
                </td>
              </tr>
            ) : (
              filtered.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-900/40 transition-colors">
                  {/* Company */}
                  <td className="p-3.5">
                    <button
                      onClick={() => onSelectLead(lead)}
                      className="font-semibold text-white hover:text-indigo-400 text-left block"
                    >
                      {lead.companyName}
                    </button>
                    {lead.website && (
                      <a
                        href={lead.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-gray-500 hover:text-gray-300 truncate max-w-xs block"
                      >
                        {lead.website.replace(/^https?:\/\//, "")}
                      </a>
                    )}
                  </td>

                  {/* Location */}
                  <td className="p-3.5 text-gray-300 whitespace-nowrap">
                    📍 {lead.city || "Global Location"}{lead.country ? `, ${lead.country}` : ""}
                  </td>

                  {/* Industry */}
                  <td className="p-3.5 text-gray-400 max-w-xs truncate">
                    {lead.industry || "Dermatology Clinic"}
                  </td>

                  {/* Stage Dropdown */}
                  <td className="p-3.5">
                    <select
                      value={lead.stage}
                      onChange={(e) => onStageChange(lead.id, e.target.value as LeadStage)}
                      className="bg-gray-900 border border-gray-800 text-gray-200 rounded px-2 py-1 text-xs focus:outline-none"
                    >
                      {LEAD_STAGE_ORDER.map((s) => (
                        <option key={s} value={s}>
                          {LEAD_STAGE_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Priority */}
                  <td className="p-3.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        lead.priority === "critical"
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : lead.priority === "high"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      }`}
                    >
                      {lead.priority}
                    </span>
                  </td>

                  {/* Score */}
                  <td className="p-3.5 text-right font-mono font-bold">
                    <span
                      className={
                        lead.qualificationScore >= 80
                          ? "text-emerald-400"
                          : lead.qualificationScore >= 60
                          ? "text-cyan-400"
                          : "text-amber-400"
                      }
                    >
                      {lead.qualificationScore}/100
                    </span>
                  </td>

                  {/* Deal Value */}
                  <td className="p-3.5 text-right font-mono text-emerald-400 font-semibold whitespace-nowrap">
                    {lead.estimatedDealValue
                      ? `₹${lead.estimatedDealValue.toLocaleString()}`
                      : "—"}
                  </td>

                  {/* Actions */}
                  <td className="p-3.5 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => onSelectLead(lead)}
                        className="px-2 py-1 rounded bg-gray-800 text-gray-200 hover:bg-gray-700 text-xs transition-colors"
                      >
                        Dossier
                      </button>
                      <button
                        onClick={() => onOpenOutreachModal(lead)}
                        className="px-2 py-1 rounded bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600/50 border border-indigo-500/40 text-xs transition-colors"
                      >
                        Outreach
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
