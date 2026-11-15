"use client";

import React, { useState } from "react";
import type { FollowUp, Task } from "../lib/types/crm";
import type { CrmLead } from "../lib/types/lead";

type TasksFollowUpsViewProps = {
  followUps: FollowUp[];
  tasks: Task[];
  leads: CrmLead[];
  onCompleteFollowUp: (id: string) => Promise<void>;
  onUpdateTaskStatus: (id: string, status: "todo" | "in_progress" | "completed" | "cancelled") => Promise<void>;
  onCreateTask: (params: { title: string; leadId?: string; priority?: "critical" | "high" | "medium" | "low" }) => Promise<void>;
  onRefresh: () => void;
};

export function TasksFollowUpsView({
  followUps,
  tasks,
  leads,
  onCompleteFollowUp,
  onUpdateTaskStatus,
  onCreateTask,
  onRefresh,
}: TasksFollowUpsViewProps) {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [priority, setPriority] = useState<"critical" | "high" | "medium" | "low">("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getLeadName = (leadId?: string | null) => {
    if (!leadId) return "General";
    return leads.find((l) => l.id === leadId)?.companyName || "Unknown Lead";
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle) return;
    setIsSubmitting(true);
    try {
      await onCreateTask({
        title: newTaskTitle,
        leadId: selectedLeadId || undefined,
        priority,
      });
      setNewTaskTitle("");
      onRefresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-800">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <span>⏱️</span> Context-Aware Follow-ups & Task Management
        </h2>
        <p className="text-xs text-gray-400">
          Automated outreach intervals, overdue alerts, and commercial task assignments
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Follow-ups Queue */}
        <div className="bg-gray-950 border border-gray-800 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-gray-800 pb-2">
            <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider font-mono">
              Follow-ups Queue ({followUps.length})
            </h3>
            <span className="text-[11px] text-gray-500 font-mono">Auto-pauses on prospect reply</span>
          </div>

          <div className="flex flex-col gap-2.5 max-h-[60vh] overflow-y-auto">
            {followUps.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-500">No scheduled follow-ups</div>
            ) : (
              followUps.map((f) => (
                <div
                  key={f.id}
                  className={`p-3 rounded-lg border flex items-start justify-between gap-3 ${
                    f.status === "completed"
                      ? "bg-gray-900/20 border-gray-800/40 opacity-60"
                      : f.status === "paused"
                      ? "bg-amber-950/20 border-amber-900/40"
                      : f.status === "overdue"
                      ? "bg-red-950/20 border-red-900/40"
                      : "bg-gray-900/60 border-gray-800"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">
                        {getLeadName(f.leadId)}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                          f.status === "completed"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : f.status === "paused"
                            ? "bg-amber-500/20 text-amber-400"
                            : f.status === "overdue"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-indigo-500/20 text-indigo-400"
                        }`}
                      >
                        {f.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 mt-1">{f.reason}</p>
                    <p className="text-[10px] text-gray-500 mt-1 font-mono">
                      📅 Due: {new Date(f.dueAt).toLocaleDateString()}
                      {f.pausedReason && ` • ${f.pausedReason}`}
                    </p>
                  </div>

                  {f.status !== "completed" && (
                    <button
                      onClick={async () => {
                        await onCompleteFollowUp(f.id);
                        onRefresh();
                      }}
                      className="px-2.5 py-1 rounded bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/40 border border-emerald-500/30 text-xs font-medium whitespace-nowrap transition-colors"
                    >
                      Done ✓
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Tasks Management */}
        <div className="bg-gray-950 border border-gray-800 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-gray-800 pb-2">
            <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider font-mono">
              Action Items & Tasks ({tasks.length})
            </h3>
          </div>

          {/* Quick Create Task */}
          <form onSubmit={handleCreateTask} className="flex flex-col gap-2 bg-gray-900/50 p-3 rounded-lg border border-gray-800">
            <input
              type="text"
              placeholder="Add new task (e.g. Prepare custom video audit for Cutis Clinic)..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="px-3 py-1.5 rounded bg-gray-950 border border-gray-800 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
            <div className="flex items-center justify-between gap-2">
              <select
                value={selectedLeadId}
                onChange={(e) => setSelectedLeadId(e.target.value)}
                className="bg-gray-950 border border-gray-800 text-xs text-gray-300 rounded px-2 py-1 focus:outline-none max-w-xs"
              >
                <option value="">General Task (No Lead)</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.companyName}
                  </option>
                ))}
              </select>

              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as "critical" | "high" | "medium" | "low")}
                className="bg-gray-950 border border-gray-800 text-xs text-gray-300 rounded px-2 py-1 focus:outline-none"
              >
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="critical">Critical</option>
                <option value="low">Low Priority</option>
              </select>

              <button
                type="submit"
                disabled={!newTaskTitle || isSubmitting}
                className="px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-500 text-xs font-semibold disabled:opacity-40 transition-colors"
              >
                Add Task
              </button>
            </div>
          </form>

          {/* Tasks List */}
          <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto">
            {tasks.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-500">No active tasks</div>
            ) : (
              tasks.map((t) => (
                <div
                  key={t.id}
                  className={`p-3 rounded-lg border flex items-center justify-between gap-3 ${
                    t.status === "completed"
                      ? "bg-gray-900/20 border-gray-800/40 opacity-50 line-through text-gray-500"
                      : "bg-gray-900/60 border-gray-800 text-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={t.status === "completed"}
                      onChange={async (e) => {
                        await onUpdateTaskStatus(t.id, e.target.checked ? "completed" : "todo");
                        onRefresh();
                      }}
                      className="rounded bg-gray-900 border-gray-800 text-indigo-600 focus:ring-0 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-medium">{t.title}</span>
                      <p className="text-[10px] text-gray-400">
                        {getLeadName(t.leadId)} • Priority: {t.priority}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

