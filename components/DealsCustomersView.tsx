"use client";

import React, { useState } from "react";
import type { Deal, Customer, DealStage } from "../lib/types/crm";
import type { CrmLead } from "../lib/types/lead";

type DealsCustomersViewProps = {
  deals: Deal[];
  customers: Customer[];
  leads: CrmLead[];
  onUpdateDealStage: (id: string, stage: DealStage) => Promise<void>;
  onCreateDeal: (params: { leadId: string; title: string; amount: number; stage?: DealStage }) => Promise<void>;
  onRefresh: () => void;
};

export function DealsCustomersView({
  deals,
  customers,
  leads,
  onUpdateDealStage,
  onCreateDeal,
  onRefresh,
}: DealsCustomersViewProps) {
  const [newDealTitle, setNewDealTitle] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState(leads[0]?.id || "");
  const [dealAmount, setDealAmount] = useState("120000");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getLeadName = (leadId: string) => {
    return leads.find((l) => l.id === leadId)?.companyName || "Clinic Lead";
  };

  const totalPipeline = deals
    .filter((d) => d.stage !== "lost" && d.stage !== "won")
    .reduce((sum, d) => sum + (d.amount || 0), 0);

  const totalWon = deals
    .filter((d) => d.stage === "won")
    .reduce((sum, d) => sum + (d.amount || 0), 0);

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDealTitle || !selectedLeadId || !dealAmount) return;
    setIsSubmitting(true);
    try {
      await onCreateDeal({
        leadId: selectedLeadId,
        title: newDealTitle,
        amount: Number(dealAmount),
        stage: "proposal",
      });
      setNewDealTitle("");
      onRefresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-800">
          <p className="text-xs text-gray-400 font-mono uppercase">Total Pipeline Value</p>
          <p className="text-2xl font-bold font-mono text-cyan-400 mt-1">₹{totalPipeline.toLocaleString()}</p>
          <p className="text-[11px] text-gray-500 mt-1">Active proposals & negotiations</p>
        </div>
        <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-800">
          <p className="text-xs text-gray-400 font-mono uppercase">Closed Won Revenue</p>
          <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">₹{totalWon.toLocaleString()}</p>
          <p className="text-[11px] text-gray-500 mt-1">{customers.length} converted customers</p>
        </div>
        <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-800">
          <p className="text-xs text-gray-400 font-mono uppercase">Active Deals</p>
          <p className="text-2xl font-bold font-mono text-indigo-400 mt-1">{deals.length}</p>
          <p className="text-[11px] text-gray-500 mt-1">Managed across all stages</p>
        </div>
      </div>

      {/* Create Deal Quick Form */}
      <div className="bg-gray-950 border border-gray-800 rounded-xl p-4">
        <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider font-mono mb-3">
          Create Commercial Deal / Proposal
        </h3>
        <form onSubmit={handleCreateDeal} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <select
            value={selectedLeadId}
            onChange={(e) => setSelectedLeadId(e.target.value)}
            className="bg-gray-900 border border-gray-800 text-xs text-gray-200 rounded-lg px-3 py-2 focus:outline-none"
          >
            {leads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.companyName}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Deal Title (e.g. Full-Stack Booking Infrastructure)"
            value={newDealTitle}
            onChange={(e) => setNewDealTitle(e.target.value)}
            className="bg-gray-900 border border-gray-800 text-xs text-gray-200 rounded-lg px-3 py-2 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />

          <input
            type="number"
            placeholder="Amount in INR"
            value={dealAmount}
            onChange={(e) => setDealAmount(e.target.value)}
            className="bg-gray-900 border border-gray-800 text-xs text-gray-200 rounded-lg px-3 py-2 placeholder-gray-500 focus:outline-none focus:border-indigo-500 font-mono"
          />

          <button
            type="submit"
            disabled={!newDealTitle || isSubmitting}
            className="bg-indigo-600 text-white rounded-lg px-4 py-2 text-xs font-semibold hover:bg-indigo-500 transition-colors disabled:opacity-40 shadow-sm shadow-indigo-600/30"
          >
            Create Proposal Deal
          </button>
        </form>
      </div>

      {/* Deals Table */}
      <div className="bg-gray-950 border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800 bg-gray-900/60">
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
            Commercial Deals ({deals.length})
          </h3>
        </div>
        <table className="w-full text-left text-xs text-gray-300">
          <thead>
            <tr className="border-b border-gray-800 text-[11px] text-gray-500 uppercase font-mono">
              <th className="p-3">Deal Title</th>
              <th className="p-3">Prospect</th>
              <th className="p-3 text-right">Amount</th>
              <th className="p-3">Stage</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {deals.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-500">
                  No deals created yet
                </td>
              </tr>
            ) : (
              deals.map((d) => (
                <tr key={d.id} className="hover:bg-gray-900/30">
                  <td className="p-3 font-semibold text-white">{d.title}</td>
                  <td className="p-3 text-gray-400">{getLeadName(d.leadId)}</td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-400">
                    ₹{d.amount?.toLocaleString()}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                        d.stage === "won"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : d.stage === "lost"
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                      }`}
                    >
                      {d.stage}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <select
                      value={d.stage}
                      onChange={async (e) => {
                        await onUpdateDealStage(d.id, e.target.value as DealStage);
                        onRefresh();
                      }}
                      className="bg-gray-900 border border-gray-800 text-gray-200 rounded px-2 py-1 text-xs focus:outline-none"
                    >
                      <option value="proposal">Proposal</option>
                      <option value="negotiation">Negotiation</option>
                      <option value="won">Won ✓ (Converts Customer)</option>
                      <option value="lost">Lost ✕</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Won Customers Table */}
      <div className="bg-gray-950 border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800 bg-gray-900/60 flex items-center justify-between">
          <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider font-mono">
            Active Converted Customers ({customers.length})
          </h3>
          <span className="text-[11px] text-gray-400 font-mono">
            Original discovery & audit provenance preserved
          </span>
        </div>
        <table className="w-full text-left text-xs text-gray-300">
          <thead>
            <tr className="border-b border-gray-800 text-[11px] text-gray-500 uppercase font-mono">
              <th className="p-3">Company</th>
              <th className="p-3">Location</th>
              <th className="p-3">Services Sold</th>
              <th className="p-3 text-right">Closed Revenue</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {customers.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-500">
                  No won customers yet. Close a deal to convert!
                </td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-900/30">
                  <td className="p-3 font-semibold text-white">{c.companyName}</td>
                  <td className="p-3 text-gray-400">
                    📍 {c.city || "Vadodara"}, {c.country || "India"}
                  </td>
                  <td className="p-3 text-gray-300">
                    {c.servicesSold?.join(", ") || "Clinic Infrastructure"}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-400">
                    ₹{c.totalRevenue.toLocaleString()}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                      {c.status}
                    </span>
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

