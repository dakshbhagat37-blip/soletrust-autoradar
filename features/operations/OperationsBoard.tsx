"use client";

import React, { useState } from "react";
import type {
  ClientProject,
  ProjectMilestone,
  ProjectDeliverable,
  DeliverableStatus,
} from "../../server/db/schema.ts";

interface OperationsBoardProps {
  projects?: ClientProject[];
  onUpdateDeliverableStatus?: (
    projectId: string,
    deliverableId: string,
    status: DeliverableStatus
  ) => void;
  onRefresh?: () => void;
}

export function OperationsBoard({
  projects = [],
  onUpdateDeliverableStatus,
  onRefresh,
}: OperationsBoardProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedMilestone, setSelectedMilestone] = useState<ProjectMilestone | null>(null);

  const activeProject = (selectedProjectId ? projects.find((p) => p.id === selectedProjectId) : null) || projects[0] || null;

  // Aggregate stats across all active projects
  const totalContractValue = projects.reduce((acc, p) => acc + p.totalContractValueCents, 0);
  const totalLoggedHours = projects.reduce(
    (acc, p) => acc + p.timeLogs.reduce((sum, l) => sum + l.hours, 0),
    0
  );

  // Group all deliverables across active project into status columns
  const allDeliverables: Array<{ project: ClientProject; milestone: ProjectMilestone; deliverable: ProjectDeliverable }> = [];
  projects.forEach((proj) => {
    proj.milestones.forEach((m) => {
      m.deliverables.forEach((d) => {
        allDeliverables.push({ project: proj, milestone: m, deliverable: d });
      });
    });
  });

  const inProgressDelivs = allDeliverables.filter((item) => item.deliverable.status === "in_progress" || item.deliverable.status === "draft");
  const reviewDelivs = allDeliverables.filter((item) => item.deliverable.status === "client_review");
  const approvedDelivs = allDeliverables.filter((item) => item.deliverable.status === "approved");

  const handleStatusClick = (
    projectId: string,
    deliverableId: string,
    newStatus: DeliverableStatus
  ) => {
    onUpdateDeliverableStatus?.(projectId, deliverableId, newStatus);
    onRefresh?.();
  };

  return (
    <div className="space-y-6">
      {/* Top Operations Header / Command KPI Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-gray-900/80 border border-indigo-500/30 shadow-sm">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Active Client Projects
          </div>
          <div className="mt-2 text-2xl font-bold text-white flex items-center justify-between">
            <span>{projects.length}</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
              In Execution
            </span>
          </div>
          <div className="mt-1 text-xs text-gray-400">
            Automated from signed SOW contracts
          </div>
        </div>

        <div className="p-4 rounded-xl bg-gray-900/80 border border-emerald-500/30 shadow-sm">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Total Contract Value
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-400">
            {projects[0]?.currency || "INR"}{" "}
            {(totalContractValue / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </div>
          <div className="mt-1 text-xs text-emerald-300/80">
            Allocated across delivery milestones
          </div>
        </div>

        <div className="p-4 rounded-xl bg-gray-900/80 border border-cyan-500/30 shadow-sm">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Team Workload & Hours
          </div>
          <div className="mt-2 text-2xl font-bold text-cyan-300">
            {totalLoggedHours} <span className="text-sm font-normal text-gray-400">logged hrs</span>
          </div>
          <div className="mt-1 text-xs text-cyan-300/80">
            Capacity utilization: <span className="font-semibold text-white">48%</span> (Healthy)
          </div>
        </div>

        <div className="p-4 rounded-xl bg-gray-900/80 border border-purple-500/30 shadow-sm">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Average Gross Margin
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-300">
            71.4%
          </div>
          <div className="mt-1 text-xs text-purple-300/80">
            Target &gt; 50% for all technical SOWs
          </div>
        </div>
      </div>

      {/* Main Board Layout: Deliverable Pipeline Columns */}
      <div className="bg-gray-950 rounded-2xl border border-gray-800 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>🚀</span> Deliverables & Fulfillment Pipeline
            </h2>
            <p className="text-xs text-gray-400">
              Track project milestones from technical execution to client sign-off.
            </p>
          </div>

          {/* Project Selector Tab Pills */}
          {projects.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProjectId(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                    activeProject?.id === p.id
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/30"
                      : "bg-gray-900 text-gray-400 hover:text-white border border-gray-800"
                  }`}
                >
                  {p.clientLegalName} ({p.progressPercent}%)
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 3 Kanban Columns: In Progress -> Client Review -> Approved */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1: In Progress */}
          <div className="bg-gray-900/50 rounded-xl border border-gray-800/80 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                In Progress ({inProgressDelivs.length})
              </span>
              <span className="text-[11px] font-mono text-gray-400">Execution</span>
            </div>

            <div className="space-y-3 min-h-[300px]">
              {inProgressDelivs.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-500 italic">
                  No deliverables currently in draft.
                </div>
              ) : (
                inProgressDelivs.map(({ project, milestone, deliverable }) => (
                  <div
                    key={deliverable.id}
                    className="p-4 rounded-xl bg-gray-900 border border-gray-700/60 hover:border-amber-500/50 transition shadow-sm space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-xs font-semibold text-white">
                        {deliverable.title}
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700">
                        {milestone.title}
                      </span>
                    </div>

                    <p className="text-xs text-gray-400 line-clamp-2">
                      {deliverable.description}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-800/80">
                      <span className="font-medium text-indigo-300">
                        {project.clientLegalName}
                      </span>
                      <button
                        onClick={() =>
                          handleStatusClick(project.id, deliverable.id, "client_review")
                        }
                        className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-md text-[11px] font-medium transition cursor-pointer"
                      >
                        Submit for Review ➔
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 2: Client Review */}
          <div className="bg-gray-900/50 rounded-xl border border-gray-800/80 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                Client Review ({reviewDelivs.length})
              </span>
              <span className="text-[11px] font-mono text-gray-400">Portal Link Active</span>
            </div>

            <div className="space-y-3 min-h-[300px]">
              {reviewDelivs.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-500 italic">
                  No deliverables waiting for client approval.
                </div>
              ) : (
                reviewDelivs.map(({ project, deliverable }) => (
                  <div
                    key={deliverable.id}
                    className="p-4 rounded-xl bg-gray-900 border border-cyan-500/40 hover:border-cyan-400 transition shadow-sm space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-xs font-semibold text-white">
                        {deliverable.title}
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                        Awaiting Client
                      </span>
                    </div>

                    <p className="text-xs text-gray-400">
                      {deliverable.description}
                    </p>

                    <div className="p-2 rounded bg-gray-950/80 border border-gray-800 text-[11px] text-gray-300 flex items-center justify-between">
                      <span>Client Portal Token:</span>
                      <a
                        href={`/portal/${project.portalToken}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-400 hover:underline font-mono text-[10px]"
                      >
                        Open Portal ↗
                      </a>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-800/80">
                      <button
                        onClick={() =>
                          handleStatusClick(project.id, deliverable.id, "in_progress")
                        }
                        className="text-[11px] text-gray-400 hover:text-white transition cursor-pointer"
                      >
                        ↩ Request Changes
                      </button>
                      <button
                        onClick={() =>
                          handleStatusClick(project.id, deliverable.id, "approved")
                        }
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-[11px] font-semibold transition cursor-pointer"
                      >
                        ✓ Mark Approved
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 3: Approved & Delivered */}
          <div className="bg-gray-900/50 rounded-xl border border-gray-800/80 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Approved & Settled ({approvedDelivs.length})
              </span>
              <span className="text-[11px] font-mono text-gray-400">Milestone Complete</span>
            </div>

            <div className="space-y-3 min-h-[300px]">
              {approvedDelivs.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-500 italic">
                  No deliverables marked approved yet.
                </div>
              ) : (
                approvedDelivs.map(({ project, milestone, deliverable }) => (
                  <div
                    key={deliverable.id}
                    className="p-4 rounded-xl bg-gray-900/80 border border-emerald-500/30 space-y-3 opacity-90"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-xs font-semibold text-white line-through text-gray-400">
                        {deliverable.title}
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        ✓ Approved
                      </span>
                    </div>

                    <div className="text-[11px] text-gray-400">
                      Approved by:{" "}
                      <span className="text-gray-200 font-medium">
                        {deliverable.approvedBy || "Client Representative"}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between text-[11px]">
                      <span className="text-emerald-400 font-mono">
                        {milestone.allocatedValueCents
                          ? `${project.currency} ${(milestone.allocatedValueCents / 100).toLocaleString()}`
                          : "Earned"}
                      </span>
                      <span className="text-gray-500 text-[10px]">
                        Ready for Invoice
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Selected Project Milestone Breakdown */}
        {activeProject && (
          <div className="pt-6 border-t border-gray-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>📋</span> {activeProject.projectName} — Milestone Roadmap
              </h3>
              <span className="text-xs font-mono text-gray-400">
                Agreement: {activeProject.contractAgreementNumber}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {activeProject.milestones.map((m) => (
                <div
                  key={m.id}
                  onClick={() => setSelectedMilestone(m)}
                  className={`p-4 rounded-xl border transition cursor-pointer space-y-2 ${
                    selectedMilestone?.id === m.id
                      ? "bg-gray-900 border-indigo-500 shadow-sm shadow-indigo-500/20"
                      : "bg-gray-900/60 border-gray-800 hover:border-gray-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-indigo-400">
                      Phase {m.phaseNumber}
                    </span>
                    <span className="text-xs font-bold text-white">
                      {activeProject.currency}{" "}
                      {(m.allocatedValueCents / 100).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-white">{m.title}</div>
                  <p className="text-[11px] text-gray-400 line-clamp-2">{m.description}</p>
                  <div className="flex items-center justify-between text-[10px] text-gray-500 pt-2 border-t border-gray-800">
                    <span>Est. {m.estimatedWeeks} weeks</span>
                    <span className="font-semibold text-emerald-400 uppercase">
                      {m.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
