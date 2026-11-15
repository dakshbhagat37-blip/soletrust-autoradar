"use client";

import React from "react";
import type { CrmDashboardMetrics } from "../lib/types/crm";

type AnalyticsDashboardProps = {
  metrics: CrmDashboardMetrics | null;
  isLoading: boolean;
};

export function AnalyticsDashboard({ metrics, isLoading }: AnalyticsDashboardProps) {
  if (isLoading || !metrics) {
    return (
      <div className="py-16 text-center text-xs text-gray-400">
        <span className="animate-spin inline-block mr-2">⚙️</span>
        Calculating real-time sales funnel metrics...
      </div>
    );
  }

  const funnelSteps = [
    { label: "1. Discovered", count: metrics.totalDiscovered, rate: "100%" },
    {
      label: "2. Identity Verified",
      count: metrics.totalVerified,
      rate: `${metrics.conversionRates.discoveryToVerification}%`,
    },
    {
      label: "3. Qualified Leads",
      count: metrics.totalQualified,
      rate: `${metrics.conversionRates.verificationToQualification}%`,
    },
    {
      label: "4. Outreach Contacted",
      count: metrics.contactedLeads,
      rate: `${metrics.conversionRates.qualificationToOutreach}%`,
    },
    {
      label: "5. Real Replies Received",
      count: metrics.actualReplies,
      rate: `${metrics.conversionRates.outreachToReply}%`,
    },
    {
      label: "6. Meetings / Demos",
      count: metrics.meetingsScheduled + metrics.meetingsCompleted,
      rate: `${metrics.conversionRates.replyToMeeting}%`,
    },
    {
      label: "7. Closed Won Customers",
      count: metrics.wonDeals,
      rate: `${metrics.conversionRates.proposalToWon}%`,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-800">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <span>📈</span> Full-Funnel Sales & Intelligence Analytics
        </h2>
        <p className="text-xs text-gray-400">
          Strict mathematical conversion rates derived entirely from verified business records, messages, and closed deals
        </p>
      </div>

      {/* Top Level Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
          <p className="text-[11px] font-mono text-gray-400 uppercase">Closed Won Revenue</p>
          <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            ₹{metrics.actualRevenue.toLocaleString()}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">{metrics.wonDeals} deals closed</p>
        </div>

        <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
          <p className="text-[11px] font-mono text-gray-400 uppercase">Active Pipeline Value</p>
          <p className="text-2xl font-bold font-mono text-cyan-400 mt-1">
            ₹{metrics.pipelineValue.toLocaleString()}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {metrics.proposalsSent + metrics.negotiatingDeals} in proposal/negotiation
          </p>
        </div>

        <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
          <p className="text-[11px] font-mono text-gray-400 uppercase">Outreach Response Rate</p>
          <p className="text-2xl font-bold font-mono text-indigo-400 mt-1">
            {metrics.conversionRates.outreachToReply}%
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {metrics.actualReplies} replies / {metrics.messagesSent} sent
          </p>
        </div>

        <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
          <p className="text-[11px] font-mono text-gray-400 uppercase">Qualified Rate</p>
          <p className="text-2xl font-bold font-mono text-amber-400 mt-1">
            {metrics.conversionRates.verificationToQualification}%
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {metrics.totalQualified} qualified from {metrics.totalVerified} verified
          </p>
        </div>
      </div>

      {/* 7-Step Conversion Funnel */}
      <div className="bg-gray-950 border border-gray-800 rounded-xl p-5 flex flex-col gap-4">
        <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
          End-to-End Sales Conversion Funnel
        </h3>

        <div className="flex flex-col gap-3">
          {funnelSteps.map((step, idx) => (
            <div key={step.label} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-200">{step.label}</span>
                <span className="font-mono text-gray-400">
                  <span className="text-white font-bold">{step.count}</span> ({step.rate} conversion)
                </span>
              </div>
              <div className="w-full bg-gray-900 h-2.5 rounded-full overflow-hidden border border-gray-800/80">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    idx === 6
                      ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                      : idx >= 4
                      ? "bg-gradient-to-r from-cyan-500 to-indigo-500"
                      : "bg-indigo-600"
                  }`}
                  style={{
                    width: `${Math.max(
                      5,
                      Math.min(100, (step.count / Math.max(metrics.totalDiscovered, 1)) * 100)
                    )}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reply Quality & Follow-ups Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Reply Breakdown */}
        <div className="bg-gray-950 border border-gray-800 rounded-xl p-4 flex flex-col gap-3">
          <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider font-mono">
            Reply Sentiment & Classification
          </h3>
          <div className="flex flex-col gap-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded bg-gray-900/60 border border-gray-800">
              <span className="text-emerald-400 font-medium">🟢 Positive (Requested Demo/Next Step)</span>
              <span className="font-mono font-bold text-white">{metrics.positiveReplies}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-gray-900/60 border border-gray-800">
              <span className="text-gray-300 font-medium">⚪ Neutral (Questions / Info Request)</span>
              <span className="font-mono font-bold text-white">{metrics.neutralReplies}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-gray-900/60 border border-gray-800">
              <span className="text-red-400 font-medium">🔴 Objections / Not Interested</span>
              <span className="font-mono font-bold text-white">{metrics.negativeReplies}</span>
            </div>
          </div>
        </div>

        {/* Operational Queues */}
        <div className="bg-gray-950 border border-gray-800 rounded-xl p-4 flex flex-col gap-3">
          <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider font-mono">
            Operational Cadence
          </h3>
          <div className="flex flex-col gap-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded bg-gray-900/60 border border-gray-800">
              <span className="text-gray-300">Upcoming Follow-ups Due</span>
              <span className="font-mono font-bold text-amber-400">{metrics.followUpsDue}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-gray-900/60 border border-gray-800">
              <span className="text-gray-300">Overdue Follow-ups</span>
              <span className="font-mono font-bold text-red-400">{metrics.followUpsOverdue}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-gray-900/60 border border-gray-800">
              <span className="text-gray-300">Meetings Scheduled</span>
              <span className="font-mono font-bold text-cyan-400">{metrics.meetingsScheduled}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

