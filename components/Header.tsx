"use client";

import React from "react";

export type NavTab =
  | "find_leads"
  | "pipeline"
  | "leads_table"
  | "outreach"
  | "tasks"
  | "deals"
  | "analytics";

type HeaderProps = {
  providerHealth?: {
    overpass?: boolean;
    searxng?: boolean;
    mock?: boolean;
  };
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  leadCounts?: {
    total: number;
    qualified: number;
    contacted: number;
    dealsWon: number;
  };
};

export function Header({
  providerHealth,
  activeTab,
  onTabChange,
  leadCounts,
}: HeaderProps) {
  const tabs: { id: NavTab; label: string; icon: string; count?: number }[] = [
    { id: "find_leads", label: "Find Leads", icon: "🔍" },
    { id: "pipeline", label: "Sales Pipeline", icon: "📊", count: leadCounts?.total },
    { id: "leads_table", label: "All Leads", icon: "📋", count: leadCounts?.qualified },
    { id: "outreach", label: "Outreach & Inbox", icon: "💬" },
    { id: "tasks", label: "Follow-ups & Tasks", icon: "⏱️" },
    { id: "deals", label: "Deals & Customers", icon: "💼", count: leadCounts?.dealsWon },
    { id: "analytics", label: "Analytics", icon: "📈" },
  ];

  return (
    <header className="border-b border-gray-800 bg-gray-950/90 backdrop-blur sticky top-0 z-40 px-6 pt-4 pb-2">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
              AR
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                SoleTrust AutoRadar
                <span className="text-[11px] font-mono uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                  v2.0 Full Platform
                </span>
              </h1>
              <p className="text-xs text-gray-400">
                B2B Intelligence, Decision-Maker Enrichment, CRM Pipeline & Sales Engagement
              </p>
            </div>
          </div>
        </div>

        {/* Right side: Principle & Provider status pills */}
        <div className="flex items-center gap-3 text-xs">
          {/* Principle Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 font-mono text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            UNKNOWN &gt; WRONG
          </div>

          {/* Provider Health Pills */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-800 bg-gray-900 text-gray-300">
            <span className="text-gray-500 text-[11px]">Providers:</span>
            <span className="flex items-center gap-1 text-[11px] text-emerald-400">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  providerHealth?.overpass === false ? "bg-red-400" : "bg-emerald-400"
                }`}
              />
              OSM / Overpass
            </span>
            <span className="text-gray-600">•</span>
            <span className="flex items-center gap-1 text-[11px] text-cyan-400">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  providerHealth?.searxng === false ? "bg-red-400" : "bg-cyan-400"
                }`}
              />
              SearXNG
            </span>
            <span className="text-gray-600">•</span>
            <span className="flex items-center gap-1 text-[11px] text-indigo-400">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  providerHealth?.mock === false ? "bg-red-400" : "bg-indigo-400"
                }`}
              />
              Verified Fixtures
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="max-w-7xl mx-auto mt-4 flex items-center gap-1 overflow-x-auto border-t border-gray-800/80 pt-2 scrollbar-none">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                isActive
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/60"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isActive ? "bg-indigo-700/80 text-white" : "bg-gray-800 text-gray-300"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
}
