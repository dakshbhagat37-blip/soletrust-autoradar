"use client";

import React, { useState } from "react";
import {
  analyzeBusinessAndGenerateIcps,
  type BusinessStrategyAnalysis,
  type IdealCustomerProfile,
} from "../lib/intelligence/icp-architect.ts";

interface StrategyArchitectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchSearchPrompt: (prompt: string) => void;
}

export function StrategyArchitectModal({
  isOpen,
  onClose,
  onLaunchSearchPrompt,
}: StrategyArchitectModalProps) {
  const [businessName, setBusinessName] = useState("SoleTrust Studio");
  const [serviceDescription, setServiceDescription] = useState(
    "We own a creative and technical studio that designs bespoke high-converting digital flagships and headless commerce solutions for consumer brands."
  );
  const [skills, setSkills] = useState("Creative UI/UX, Next.js, Headless Shopify, 3D Visualizers, Performance Optimization");
  const [pricingModel, setPricingModel] = useState("$8,000 - $25,000 project + retainer");
  const [targetGeography, setTargetGeography] = useState("Australia");
  const [capacity, setCapacity] = useState("4 clients / month");

  const [analysis, setAnalysis] = useState<BusinessStrategyAnalysis | null>(() =>
    analyzeBusinessAndGenerateIcps({
      businessName: "SoleTrust Studio",
      serviceOrProductDescription:
        "We own a creative and technical studio that designs bespoke high-converting digital flagships and headless commerce solutions for consumer brands.",
      skills: ["Creative UI/UX", "Next.js", "Headless Shopify", "3D Visualizers"],
      pricingModel: "$8,000 - $25,000 project + retainer",
      targetGeography: "Australia",
    })
  );

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedIcpId, setSelectedIcpId] = useState<string | null>("icp-1-dtc-lifestyle-apparel");

  if (!isOpen) return null;

  const handleRunAnalysis = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnalyzing(true);
    setTimeout(() => {
      const skillsArray = skills.split(",").map((s) => s.trim()).filter(Boolean);
      const res = analyzeBusinessAndGenerateIcps({
        businessName,
        serviceOrProductDescription: serviceDescription,
        skills: skillsArray,
        pricingModel,
        targetGeography,
      });
      setAnalysis(res);
      setSelectedIcpId(res.icps[0]?.id || null);
      setIsAnalyzing(false);
    }, 250);
  };

  const handleApplyPrompt = (prompt: string) => {
    onLaunchSearchPrompt(prompt);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl border border-gray-800 bg-gray-950 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-800/80 bg-gray-900/40 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">In-House Business & ICP Strategy Studio</h2>
                <span className="text-[10px] font-mono tracking-widest uppercase bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                  Pre-Search Architect v3.0
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Define your offer, generate high-margin positioning, and discover 3 ranked ICPs with instant 1-click AutoRadar prompts.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Input Form Section */}
          <form onSubmit={handleRunAnalysis} className="p-5 rounded-2xl border border-gray-800 bg-gray-900/60 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Your Business Name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Apex Creative Studio"
                  className="w-full rounded-xl border border-gray-700/80 bg-gray-950 px-3 py-2 text-sm text-gray-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Target Country / Geography</label>
                <input
                  type="text"
                  value={targetGeography}
                  onChange={(e) => setTargetGeography(e.target.value)}
                  placeholder="e.g. Australia, United States, Germany"
                  className="w-full rounded-xl border border-gray-700/80 bg-gray-950 px-3 py-2 text-sm text-gray-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Pricing Model / Capacity</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={pricingModel}
                    onChange={(e) => setPricingModel(e.target.value)}
                    placeholder="e.g. $5,000 retainer"
                    className="flex-1 rounded-xl border border-gray-700/80 bg-gray-950 px-3 py-2 text-sm text-gray-100 focus:border-cyan-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    placeholder="Capacity"
                    className="w-28 rounded-xl border border-gray-700/80 bg-gray-950 px-3 py-2 text-sm text-gray-100 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">What you do / sell (Offer Description)</label>
                <textarea
                  rows={2}
                  value={serviceDescription}
                  onChange={(e) => setServiceDescription(e.target.value)}
                  placeholder="Describe your capabilities, tech stack, or product lines in plain English..."
                  className="w-full rounded-xl border border-gray-700/80 bg-gray-950 px-3 py-2 text-xs text-gray-100 focus:border-cyan-500 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Key Skills & Differentiators</label>
                <textarea
                  rows={2}
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="Comma-separated: Next.js, Headless, Shopify Plus, 3D Graphics..."
                  className="w-full rounded-xl border border-gray-700/80 bg-gray-950 px-3 py-2 text-xs text-gray-100 focus:border-cyan-500 focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-400">Quick Presets:</span>
                <button
                  type="button"
                  onClick={() => {
                    setBusinessName("Craft & Code Studio");
                    setServiceDescription("Creative and technical studio designing digital flagships and high-conversion mobile stores for Australian D2C eCommerce brands.");
                    setSkills("Shopify Plus, Headless UI, Three.js, Core Web Vitals, Checkout CRO");
                    setTargetGeography("Australia");
                    setPricingModel("$10,000 - $30,000 project");
                  }}
                  className="text-[11px] px-2 py-0.5 rounded-lg border border-gray-700 bg-gray-800 text-gray-300 hover:text-white transition cursor-pointer"
                >
                  🇦🇺 Studio (AU D2C)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBusinessName("Summit Direct Wholesale");
                    setServiceDescription("Specialty food & beverage wholesale distributor supplying high-margin gourmet, functional drinks and craft snacks to supermarket grocers.");
                    setSkills("Direct-Store Delivery (DSD), Category Resets, 30%+ Retail Margins, Gourmet Snacks");
                    setTargetGeography("China");
                    setPricingModel("$3,000 - $12,000 wholesale orders");
                  }}
                  className="text-[11px] px-2 py-0.5 rounded-lg border border-gray-700 bg-gray-800 text-gray-300 hover:text-white transition cursor-pointer"
                >
                  🇨🇳 F&B Wholesale (China Grocers)
                </button>
              </div>

              <button
                type="submit"
                disabled={isAnalyzing}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Synthesizing Positioning...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Architect Positioning & 3 ICPs
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Analysis Results */}
          {analysis && (
            <div className="space-y-6">
              {/* Positioning & Core Packaging */}
              <div className="p-5 rounded-2xl border border-indigo-500/30 bg-indigo-950/20 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                      Strategic Market Positioning
                    </span>
                    <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      {analysis.coreOfferStructure.marginTier}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    Est. Value: <strong className="text-white">{analysis.coreOfferStructure.suggestedPricing}</strong>
                  </span>
                </div>

                <h3 className="text-base font-bold text-white">{analysis.positioning}</h3>
                <p className="text-xs text-gray-300 leading-relaxed">{analysis.coreOfferStructure.valueProposition}</p>

                <div className="pt-2 border-t border-indigo-900/40">
                  <div className="text-[11px] font-semibold text-indigo-300 mb-1.5">Packaged Core Deliverables:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-300">
                    {analysis.coreOfferStructure.deliverables.map((d, idx) => (
                      <div key={idx} className="flex items-start gap-2 bg-gray-900/60 p-2 rounded-xl border border-gray-800">
                        <span className="text-cyan-400 mt-0.5 font-bold">✓</span>
                        <span>{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3 Ranked ICPs */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>3 Ranked Ideal Customer Profiles (ICPs)</span>
                    <span className="text-xs font-normal text-gray-400">Prioritized by conversion velocity</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {analysis.icps.map((icp: IdealCustomerProfile) => {
                    const isSelected = selectedIcpId === icp.id;
                    return (
                      <div
                        key={icp.id}
                        onClick={() => setSelectedIcpId(icp.id)}
                        className={`rounded-2xl border p-4 transition cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? "border-cyan-500/80 bg-gray-900 shadow-xl shadow-cyan-500/10"
                            : "border-gray-800 bg-gray-900/40 hover:border-gray-700"
                        }`}
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              icp.rank === 1
                                ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                                : icp.rank === 2
                                ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/30"
                                : "bg-purple-500/15 text-purple-300 border-purple-500/30"
                            }`}>
                              RANK #{icp.rank} • {icp.conversionProbability}% PROBABILITY
                            </span>
                            <span className="text-[10px] text-gray-400">{icp.targetGeography}</span>
                          </div>

                          <h5 className="text-sm font-bold text-white leading-tight">{icp.title}</h5>
                          <div className="text-xs text-cyan-400 font-medium">{icp.subNiche}</div>
                          <div className="text-[11px] text-gray-400">{icp.companySize}</div>

                          <div className="pt-2 border-t border-gray-800 space-y-1 text-xs">
                            <div className="text-gray-400 text-[10px] uppercase font-mono tracking-wider">Decision Makers:</div>
                            <div className="text-gray-200 font-medium text-[11px]">
                              {icp.decisionMakerTitles.slice(0, 3).join(", ")}
                            </div>
                          </div>

                          <div className="space-y-1 text-xs">
                            <div className="text-gray-400 text-[10px] uppercase font-mono tracking-wider">Deal Size:</div>
                            <div className="text-emerald-400 font-bold">{icp.estimatedDealSize}</div>
                          </div>
                        </div>

                        {/* 1-Click Launch Button */}
                        <div className="pt-4 mt-3 border-t border-gray-800">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApplyPrompt(icp.searchQueryPrompt);
                            }}
                            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 transition cursor-pointer"
                          >
                            <span>⚡ Launch AutoRadar</span>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
