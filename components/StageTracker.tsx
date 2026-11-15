"use client";

import React from "react";
import type { SearchStageStats } from "../lib/types/search-job.ts";

type StageTrackerProps = {
  currentStage: string;
  progress: number;
  stats: SearchStageStats;
  isCompleted: boolean;
};

const STAGES = [
  { id: "discovery", label: "1. Discovery" },
  { id: "identity_verification", label: "2. Identity" },
  { id: "industry_verification", label: "3. Industry" },
  { id: "location_verification", label: "4. Location" },
  { id: "website_intelligence", label: "5. Website Intel" },
  { id: "decision_maker_discovery", label: "6. Decision Makers" },
  { id: "contact_verification", label: "7. Contacts" },
  { id: "qualification", label: "8. Qualification" },
];

export function StageTracker({
  currentStage,
  progress,
  stats,
  isCompleted,
}: StageTrackerProps) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/70 p-6 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            Pipeline Execution & Observability
            {isCompleted ? (
              <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                Completed
              </span>
            ) : (
              <span className="text-xs font-medium text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded-full animate-pulse">
                In Progress ({progress}%)
              </span>
            )}
          </h2>
          <p className="text-xs text-gray-400">
            Real-time candidate drop-off metrics and verification stage tracking.
          </p>
        </div>
        <div className="text-xs font-mono text-gray-400 bg-gray-950 px-3 py-1.5 rounded-lg border border-gray-800">
          Stage: <span className="text-indigo-400 font-semibold uppercase">{currentStage.replace(/_/g, " ")}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-950 rounded-full h-2 overflow-hidden mb-6 border border-gray-800">
        <div
          className="bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-400 h-full transition-all duration-500 ease-out"
          style={{ width: `${Math.max(5, progress)}%` }}
        />
      </div>

      {/* Stage Flow Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-6">
        {STAGES.map((s, idx) => {
          const isDone = isCompleted || (idx + 1) * 12 <= progress;
          const isCurrent = s.id === currentStage || currentStage.includes(s.id);

          return (
            <div
              key={s.id}
              className={`p-2 rounded-xl text-center border text-[11px] font-medium transition ${
                isDone
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : isCurrent
                  ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300 animate-pulse"
                  : "bg-gray-950/60 border-gray-800 text-gray-500"
              }`}
            >
              {s.label}
            </div>
          );
        })}
      </div>

      {/* Drop-off Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Discovered */}
        <div className="p-3.5 rounded-xl border border-gray-800 bg-gray-950/70">
          <p className="text-[11px] text-gray-500 uppercase font-mono">Discovered</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{stats.candidatesFound}</span>
            <span className="text-[10px] text-gray-400">candidates</span>
          </div>
        </div>

        {/* 2. Identity Passed */}
        <div className="p-3.5 rounded-xl border border-gray-800 bg-gray-950/70">
          <p className="text-[11px] text-gray-500 uppercase font-mono">Identity Gate</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-cyan-400">{stats.identityVerified}</span>
            <span className="text-[10px] text-gray-400">passed</span>
          </div>
        </div>

        {/* 3. Location Passed */}
        <div className="p-3.5 rounded-xl border border-gray-800 bg-gray-950/70">
          <p className="text-[11px] text-gray-500 uppercase font-mono">Location Gate</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-indigo-400">{stats.locationVerified}</span>
            <span className="text-[10px] text-gray-400">in city</span>
          </div>
        </div>

        {/* 4. Decision Makers */}
        <div className="p-3.5 rounded-xl border border-gray-800 bg-gray-950/70">
          <p className="text-[11px] text-gray-500 uppercase font-mono">Decision Makers</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-purple-400">{stats.decisionMakersVerified}</span>
            <span className="text-[10px] text-gray-400">verified</span>
          </div>
        </div>

        {/* 5. Qualified Leads */}
        <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
          <p className="text-[11px] text-emerald-400 font-mono uppercase font-semibold">Qualified Leads</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-300">{stats.qualifiedLeads}</span>
            <span className="text-[10px] text-emerald-400/80">score &ge; 65</span>
          </div>
        </div>

        {/* 6. Disqualified / Review */}
        <div className="p-3.5 rounded-xl border border-gray-800 bg-gray-950/70">
          <p className="text-[11px] text-amber-500 uppercase font-mono">Review / Rejected</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-300">{stats.rejectedLeads}</span>
            <span className="text-[10px] text-gray-400">drop-off</span>
          </div>
        </div>
      </div>
    </div>
  );
}

