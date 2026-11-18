"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Header, type NavTab } from "../components/Header.tsx";
import { SearchForm, type SearchFormData } from "../components/SearchForm.tsx";
import { StageTracker } from "../components/StageTracker.tsx";
import { LeadCard } from "../components/LeadCard.tsx";
import { LeadDossierModal } from "../components/LeadDossierModal.tsx";
import { ExportModal } from "../components/ExportModal.tsx";
import { KanbanBoard } from "../components/KanbanBoard.tsx";
import { CrmLeadsTable } from "../components/CrmLeadsTable.tsx";
import { OutreachInboxView } from "../components/OutreachInboxView.tsx";
import { TasksFollowUpsView } from "../components/TasksFollowUpsView.tsx";
import { DealsCustomersView } from "../components/DealsCustomersView.tsx";
import { AnalyticsDashboard } from "../components/AnalyticsDashboard.tsx";

import type { Business } from "../lib/types/business.ts";
import type { SearchJob, SearchStageStats } from "../lib/types/search-job.ts";
import type { CrmLead, LeadStage } from "../lib/types/lead.ts";
import type {
  FollowUp,
  Task,
  Deal,
  Customer,
  CrmDashboardMetrics,
  OutreachChannel,
  DealStage,
} from "../lib/types/crm.ts";

const INITIAL_STATS: SearchStageStats = {
  candidatesFound: 0,
  uniqueBusinesses: 0,
  identityVerified: 0,
  industryVerified: 0,
  locationVerified: 0,
  officialWebsitesFound: 0,
  businessContactsFound: 0,
  decisionMakersFound: 0,
  decisionMakersVerified: 0,
  qualifiedLeads: 0,
  rejectedLeads: 0,
};

type FilterTab = "all" | "qualified" | "review" | "rejected";

export default function Home() {
  const [navTab, setNavTab] = useState<NavTab>("find_leads");
  const [isLoading, setIsLoading] = useState(false);
  const [searchJob, setSearchJob] = useState<SearchJob | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeTab, setActiveTab] = useState<FilterTab>("qualified");
  const [selectedLead, setSelectedLead] = useState<Business | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // CRM State
  const [crmLeads, setCrmLeads] = useState<CrmLead[]>([]);
  const [followUps] = useState<FollowUp[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [metrics, setMetrics] = useState<CrmDashboardMetrics | null>(null);
  const [isCrmLoading, setIsCrmLoading] = useState(false);

  // Fetch all CRM state
  const loadCrmData = useCallback(async () => {
    try {
      const [leadsRes, dealsRes, tasksRes, customersRes, metricsRes] = await Promise.all([
        fetch("/api/crm/leads"),
        fetch("/api/crm/deals"),
        fetch("/api/crm/tasks"),
        fetch("/api/crm/customers"),
        fetch("/api/crm/analytics"),
      ]);

      if (leadsRes.ok) {
        const json = await leadsRes.json();
        if (json.success) setCrmLeads(json.data);
      }
      if (dealsRes.ok) {
        const json = await dealsRes.json();
        if (json.success) setDeals(json.data);
      }
      if (tasksRes.ok) {
        const json = await tasksRes.json();
        if (json.success) setTasks(json.data);
      }
      if (customersRes.ok) {
        const json = await customersRes.json();
        if (json.success) setCustomers(json.data);
      }
      if (metricsRes.ok) {
        const json = await metricsRes.json();
        if (json.success) setMetrics(json.data);
      }
    } catch (err) {
      console.error("Failed to load CRM data:", err);
    } finally {
      setIsCrmLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const [leadsRes, dealsRes, tasksRes, customersRes, metricsRes] = await Promise.all([
          fetch("/api/crm/leads"),
          fetch("/api/crm/deals"),
          fetch("/api/crm/tasks"),
          fetch("/api/crm/customers"),
          fetch("/api/crm/analytics"),
        ]);
        if (ignore) return;
        if (leadsRes.ok) {
          const json = await leadsRes.json();
          if (json.success && !ignore) setCrmLeads(json.data);
        }
        if (dealsRes.ok) {
          const json = await dealsRes.json();
          if (json.success && !ignore) setDeals(json.data);
        }
        if (tasksRes.ok) {
          const json = await tasksRes.json();
          if (json.success && !ignore) setTasks(json.data);
        }
        if (customersRes.ok) {
          const json = await customersRes.json();
          if (json.success && !ignore) setCustomers(json.data);
        }
        if (metricsRes.ok) {
          const json = await metricsRes.json();
          if (json.success && !ignore) setMetrics(json.data);
        }
      } catch (err) {
        console.error("Initial load error", err);
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, []);

  const handleSearchSubmit = async (data: SearchFormData) => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      // Step 1: Initialize Search Job
      const createRes = await fetch("/api/search-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          industry: data.industry,
          city: data.city,
          country: data.country,
          limit: data.limit,
          serviceTrack: data.serviceTrack,
          provider: data.provider,
        }),
      });

      const createJson = await createRes.json();
      if (!createRes.ok || !createJson.success) {
        throw new Error(createJson.error?.message || "Failed to initialize search job");
      }

      const job: SearchJob = createJson.data;
      setSearchJob(job);

      // Step 2: Trigger End-to-End Execution Pipeline
      const execRes = await fetch(`/api/search-jobs/${job.id}/execute`, {
        method: "POST",
      });

      const execJson = await execRes.json();
      if (!execRes.ok || !execJson.success) {
        throw new Error(execJson.error?.message || "AutoRadar intelligence pipeline failed");
      }

      const updatedJob: SearchJob = execJson.data.job;
      const returnedBusinesses: Business[] = execJson.data.businesses || [];

      setSearchJob(updatedJob);
      setBusinesses(returnedBusinesses);

      if (execJson.data.qualifiedCount === 0 && returnedBusinesses.length > 0) {
        setActiveTab("all");
      } else {
        setActiveTab("qualified");
      }

      // Reload CRM state after discovery
      await loadCrmData();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleReverifyLead = async (id: string) => {
    try {
      const res = await fetch(`/api/leads/${id}/verify`, { method: "POST" });
      const json = await res.json();
      if (res.ok && json.success) {
        setBusinesses((prev) =>
          prev.map((b) =>
            b.id === id
              ? { ...b, identityStatus: json.data.status, identityScore: json.data.score }
              : b
          )
        );
        await loadCrmData();
      }
    } catch (err) {
      console.error("Re-verify failed", err);
    }
  };

  // CRM Actions
  const handleStageChange = async (leadId: string, stage: LeadStage) => {
    try {
      const res = await fetch(`/api/crm/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      });
      if (res.ok) {
        await loadCrmData();
      }
    } catch (err) {
      console.error("Failed to update stage:", err);
    }
  };

  const handleSendOutreach = async (
    leadId: string,
    params: { channel: OutreachChannel; subject: string; body: string; action: "send" | "log" }
  ) => {
    try {
      const res = await fetch(`/api/crm/leads/${leadId}/outreach`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (res.ok) {
        await loadCrmData();
      }
    } catch (err) {
      console.error("Outreach dispatch failed:", err);
    }
  };

  const handleRecordReply = async (
    leadId: string,
    params: { channel: OutreachChannel; body: string; classification: "positive" | "neutral" | "negative" | "unsubscribe" }
  ) => {
    try {
      const res = await fetch(`/api/crm/leads/${leadId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (res.ok) {
        await loadCrmData();
      }
    } catch (err) {
      console.error("Reply record failed:", err);
    }
  };

  const handleCompleteFollowUp = async (id: string) => {
    try {
      await fetch(`/api/crm/leads/${id}/follow-ups`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await loadCrmData();
    } catch (err) {
      console.error("Complete follow-up failed:", err);
    }
  };

  const handleUpdateTaskStatus = async (
    id: string,
    status: "todo" | "in_progress" | "completed" | "cancelled"
  ) => {
    try {
      await fetch("/api/crm/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      await loadCrmData();
    } catch (err) {
      console.error("Update task status failed:", err);
    }
  };

  const handleCreateTask = async (params: {
    title: string;
    leadId?: string;
    priority?: "critical" | "high" | "medium" | "low";
  }) => {
    try {
      await fetch("/api/crm/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      await loadCrmData();
    } catch (err) {
      console.error("Create task failed:", err);
    }
  };

  const handleUpdateDealStage = async (id: string, stage: DealStage) => {
    try {
      await fetch("/api/crm/deals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, stage }),
      });
      await loadCrmData();
    } catch (err) {
      console.error("Update deal stage failed:", err);
    }
  };

  const handleCreateDeal = async (params: {
    leadId: string;
    title: string;
    amount: number;
    stage?: DealStage;
  }) => {
    try {
      await fetch("/api/crm/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      await loadCrmData();
    } catch (err) {
      console.error("Create deal failed:", err);
    }
  };

  const handleOpenLeadDossierFromCrm = (lead: CrmLead) => {
    const matchedBiz = businesses.find((b) => b.id === lead.businessId);
    if (matchedBiz) {
      setSelectedLead(matchedBiz);
    } else {
      // Build stub business object
      setSelectedLead({
        id: lead.businessId,
        canonicalName: lead.companyName,
        website: lead.website,
        domain: lead.website ? lead.website.replace(/^https?:\/\//, "") : null,
        industry: lead.industry,
        city: lead.city,
        country: lead.country,
        identityStatus: "verified",
        identityScore: 85,
        qualificationScore: lead.qualificationScore,
        status: lead.qualificationScore >= 60 ? "qualified" : "review",
        serviceTrack: lead.serviceTrack || "creative+technical",
        sources: [],
        contacts: [],
        decisionMakers: [],
        createdAt: lead.createdAt,
        updatedAt: lead.updatedAt,
      });
    }
  };

  const filteredBusinesses = businesses.filter((b) => {
    if (activeTab === "all") return true;
    if (activeTab === "qualified") return b.status === "qualified";
    if (activeTab === "review") return b.status === "review";
    if (activeTab === "rejected") return b.status === "rejected";
    return true;
  });

  const qualifiedCount = businesses.filter((b) => b.status === "qualified").length;
  const reviewCount = businesses.filter((b) => b.status === "review").length;
  const rejectedCount = businesses.filter((b) => b.status === "rejected").length;

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col font-sans">
      <Header
        activeTab={navTab}
        onTabChange={(tab) => setNavTab(tab)}
        leadCounts={{
          total: crmLeads.length,
          qualified: crmLeads.filter((l) => l.qualificationScore >= 60).length,
          contacted: crmLeads.filter((l) => l.stage === "contacted" || l.stage === "engaged").length,
          dealsWon: customers.length,
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-8 space-y-6">
        {/* Error notification banner */}
        {errorMsg && (
          <div className="p-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-300 text-sm flex items-center justify-between">
            <span>{errorMsg}</span>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="text-xs uppercase font-bold text-red-400 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 1. FIND LEADS VIEW */}
        {navTab === "find_leads" && (
          <div className="space-y-8">
            <SearchForm onSubmit={handleSearchSubmit} isLoading={isLoading} />

            {(searchJob || isLoading) && (
              <StageTracker
                currentStage={searchJob?.currentStage || "queued"}
                progress={searchJob?.progress || 0}
                stats={searchJob?.stageStats || INITIAL_STATS}
                isCompleted={searchJob?.status === "completed"}
              />
            )}

            {businesses.length > 0 && (
              <div className="space-y-6">
                {searchJob && (
                  <div className="flex flex-wrap items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-900/80 border border-gray-800 text-xs text-gray-300">
                    <span className="text-gray-500 font-medium">Target Query:</span>
                    <span className="font-semibold text-white">{searchJob.query.industry}</span>
                    <span className="text-gray-600">•</span>
                    <span className="font-semibold text-indigo-400">{searchJob.query.city}, {searchJob.query.country}</span>
                    <span className="text-gray-600">•</span>
                    <span className="text-gray-400">Track: <span className="text-gray-200 capitalize">{searchJob.query.serviceTrack}</span></span>
                    {searchJob.query.provider && (
                      <>
                        <span className="text-gray-600">•</span>
                        <span className="text-gray-400">Provider: <span className="font-mono text-amber-300 uppercase">{searchJob.query.provider}</span></span>
                      </>
                    )}
                    <span className="text-gray-600">•</span>
                    <span className="text-gray-400">Status: <span className="text-emerald-400 uppercase font-mono">{searchJob.status}</span></span>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      Prospecting Results Database
                      <span className="text-xs font-mono text-gray-400 bg-gray-900 border border-gray-800 px-2 py-0.5 rounded-full">
                        {businesses.length} Total Evaluated
                      </span>
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">
                      Verified leads ranked by 6-factor score and hard eligibility gates. Automatically synced to CRM Pipeline.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setNavTab("pipeline")}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition shadow-sm shadow-indigo-600/30"
                    >
                      View in Pipeline (Kanban) →
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsExportOpen(true)}
                      className="flex items-center gap-1.5 rounded-xl border border-gray-700 bg-gray-900 px-3.5 py-2 text-xs font-semibold text-gray-200 hover:bg-gray-800 transition cursor-pointer"
                    >
                      <span>Export</span>
                    </button>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 overflow-x-auto text-xs pb-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab("qualified")}
                    className={`px-4 py-2 rounded-xl font-semibold border transition cursor-pointer ${
                      activeTab === "qualified"
                        ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                        : "border-gray-800 text-gray-400 hover:text-white bg-gray-900/40"
                    }`}
                  >
                    Qualified ({qualifiedCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("review")}
                    className={`px-4 py-2 rounded-xl font-semibold border transition cursor-pointer ${
                      activeTab === "review"
                        ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                        : "border-gray-800 text-gray-400 hover:text-white bg-gray-900/40"
                    }`}
                  >
                    Needs Review ({reviewCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("all")}
                    className={`px-4 py-2 rounded-xl font-semibold border transition cursor-pointer ${
                      activeTab === "all"
                        ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300"
                        : "border-gray-800 text-gray-400 hover:text-white bg-gray-900/40"
                    }`}
                  >
                    All Discovered ({businesses.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("rejected")}
                    className={`px-4 py-2 rounded-xl font-semibold border transition cursor-pointer ${
                      activeTab === "rejected"
                        ? "bg-red-500/20 border-red-500/50 text-red-300"
                        : "border-gray-800 text-gray-400 hover:text-white bg-gray-900/40"
                    }`}
                  >
                    Disqualified ({rejectedCount})
                  </button>
                </div>

                {/* Grid of Lead Cards */}
                {filteredBusinesses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {filteredBusinesses.map((biz) => (
                      <LeadCard
                        key={biz.id}
                        business={biz}
                        onViewDossier={(b) => setSelectedLead(b)}
                        onReverify={handleReverifyLead}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center rounded-2xl border border-gray-800 bg-gray-900/30">
                    <p className="text-gray-400 text-sm">
                      No prospects match the filter &quot;{activeTab}&quot;.
                    </p>
                  </div>
                )}
              </div>
            )}

            {searchJob && searchJob.status === "completed" && businesses.length === 0 && (
              <div className="p-8 text-center rounded-2xl border border-gray-800 bg-gray-900/40 space-y-2">
                <div className="text-2xl">🔍</div>
                <h3 className="text-sm font-semibold text-white">0 Businesses Qualified in this Search</h3>
                <p className="text-xs text-gray-400 max-w-lg mx-auto">
                  {searchJob.stageStats.candidatesFound === 0
                    ? `No candidates were found in ${searchJob.query.city}, ${searchJob.query.country} for "${searchJob.query.industry}". Check network connectivity or try a broader search location.`
                    : `Discovered ${searchJob.stageStats.candidatesFound} candidate(s), but strict verification gates (identity, sector relevance, location) filtered them out (UNKNOWN > WRONG principle).`}
                </p>
              </div>
            )}

            {!searchJob && !isLoading && (
              <div className="p-12 text-center rounded-2xl border border-dashed border-gray-800 bg-gray-900/20">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto mb-4 text-xl">
                  &oplus;
                </div>
                <h3 className="text-base font-semibold text-white">No active prospecting search</h3>
                <p className="text-xs text-gray-400 max-w-md mx-auto mt-1.5">
                  Launch an AutoRadar search above to discover verified local businesses in any target city and industry, identify decision makers, verify official contact channels, and rank sales opportunities.
                </p>
              </div>
            )}
          </div>
        )}

        {/* 2. PIPELINE KANBAN VIEW */}
        {navTab === "pipeline" && (
          <KanbanBoard
            leads={crmLeads}
            onStageChange={handleStageChange}
            onSelectLead={handleOpenLeadDossierFromCrm}
            onOpenOutreachModal={() => setNavTab("outreach")}
          />
        )}

        {/* 3. ALL LEADS TABLE VIEW */}
        {navTab === "leads_table" && (
          <CrmLeadsTable
            leads={crmLeads}
            onSelectLead={handleOpenLeadDossierFromCrm}
            onStageChange={handleStageChange}
            onOpenOutreachModal={() => setNavTab("outreach")}
          />
        )}

        {/* 4. OUTREACH & INBOX VIEW */}
        {navTab === "outreach" && (
          <OutreachInboxView
            leads={crmLeads}
            onSendOutreach={handleSendOutreach}
            onRecordReply={handleRecordReply}
            onRefresh={loadCrmData}
          />
        )}

        {/* 5. TASKS & FOLLOW-UPS VIEW */}
        {navTab === "tasks" && (
          <TasksFollowUpsView
            followUps={followUps}
            tasks={tasks}
            leads={crmLeads}
            onCompleteFollowUp={handleCompleteFollowUp}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onCreateTask={handleCreateTask}
            onRefresh={loadCrmData}
          />
        )}

        {/* 6. DEALS & CUSTOMERS VIEW */}
        {navTab === "deals" && (
          <DealsCustomersView
            deals={deals}
            customers={customers}
            leads={crmLeads}
            onUpdateDealStage={handleUpdateDealStage}
            onCreateDeal={handleCreateDeal}
            onRefresh={loadCrmData}
          />
        )}

        {/* 7. ANALYTICS DASHBOARD VIEW */}
        {navTab === "analytics" && (
          <AnalyticsDashboard metrics={metrics} isLoading={isCrmLoading} />
        )}
      </main>

      {/* Lead Dossier Detail Modal */}
      <LeadDossierModal
        business={selectedLead}
        onClose={() => setSelectedLead(null)}
        onOpenOutreach={() => {
          setSelectedLead(null);
          setNavTab("outreach");
        }}
      />

      {/* Export Modal */}
      <ExportModal
        businesses={filteredBusinesses.length > 0 ? filteredBusinesses : businesses}
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />
    </div>
  );
}
