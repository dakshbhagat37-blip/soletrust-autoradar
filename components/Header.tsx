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
  onGlobalPromptSearch?: (prompt: string) => void;
  isSearching?: boolean;
  onOpenIcpStudio?: () => void;
  onOpenSettings?: () => void;
};

export function Header({
  providerHealth,
  activeTab,
  onTabChange,
  leadCounts,
  onGlobalPromptSearch,
  isSearching = false,
  onOpenIcpStudio,
  onOpenSettings,
}: HeaderProps) {
  const [promptText, setPromptText] = React.useState("");
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === "/" || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim() || isSearching) return;
    onGlobalPromptSearch?.(promptText);
  };
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

        {/* Global AI Prompt Search Bar (Universal across all tabs) */}
        <form onSubmit={handlePromptSubmit} className="flex-1 max-w-xl mx-0 md:mx-4">
          <div className="relative flex items-center group">
            <span className="absolute left-3 text-indigo-400 text-sm pointer-events-none">✨</span>
            <input
              ref={searchInputRef}
              type="text"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              disabled={isSearching}
              placeholder="Ask AutoRadar: 'Find D2C brands in Australia' or 'Supermarkets in China' (Press /)..."
              className="w-full pl-9 pr-32 py-2 text-xs text-white bg-gray-900/90 border border-indigo-500/40 rounded-xl placeholder-gray-500 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 shadow-inner group-hover:border-indigo-500/60 transition"
            />
            <div className="absolute right-1.5 flex items-center gap-1.5">
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-gray-800 border border-gray-700/80 text-[10px] font-mono text-gray-400">
                /
              </span>
              <button
                type="submit"
                disabled={isSearching || !promptText.trim()}
                className="px-3 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-[11px] font-semibold rounded-lg shadow disabled:opacity-50 transition flex items-center gap-1 cursor-pointer"
              >
                {isSearching ? (
                  <>
                    <span className="w-2.5 h-2.5 border border-white border-t-transparent rounded-full animate-spin" />
                    <span>Searching</span>
                  </>
                ) : (
                  <>
                    <span>⚡ Find</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {onOpenIcpStudio && (
          <button
            type="button"
            onClick={onOpenIcpStudio}
            className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-cyan-500/40 bg-cyan-950/30 hover:bg-cyan-900/40 text-cyan-300 text-xs font-semibold shadow-sm shadow-cyan-500/20 transition cursor-pointer"
          >
            <span>⚡</span>
            <span>ICP & Offer Studio</span>
          </button>
        )}

        {onOpenSettings && (
          <button
            type="button"
            onClick={onOpenSettings}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-gray-700 bg-gray-900/80 hover:bg-gray-800 text-gray-300 hover:text-white text-xs font-medium transition cursor-pointer"
          >
            <span>⚙️</span>
            <span>Settings</span>
          </button>
        )}

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
