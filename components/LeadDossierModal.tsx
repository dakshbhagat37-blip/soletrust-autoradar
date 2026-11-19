"use client";

import React, { useState } from "react";
import type { Business } from "../lib/types/business.ts";
import type { LeadStage } from "../lib/types/lead.ts";
import { generateAiSalesStrategy } from "../lib/crm/ai-strategy.ts";
import { generatePitchDeck } from "../lib/closing/pitch-deck-generator.ts";
import { generateContractAgreement } from "../lib/closing/contract-generator.ts";

type LeadDossierModalProps = {
  business: Business | null;
  onClose: () => void;
  onOpenOutreach?: (business: Business) => void;
  onAdvanceStage?: (stage: LeadStage) => void;
};

type DossierTab = "breakdown" | "strategy" | "pitch" | "contract" | "people" | "contacts" | "evidence";

export function LeadDossierModal({ business, onClose, onAdvanceStage }: LeadDossierModalProps) {
  const [activeTab, setActiveTab] = useState<DossierTab>("breakdown");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedTouch, setSelectedTouch] = useState<number>(1);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);

  if (!business) return null;

  const qual = business.qualification;
  const overallScore = business.qualificationScore || qual?.overallScore || 0;
  const status = business.status || qual?.status || "discovered";
  const strategy = generateAiSalesStrategy(business);
  const pitchDeck = generatePitchDeck(business);
  const contract = generateContractAgreement(business);

  const handleCopy = (key: string, text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-gray-800 bg-gray-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex items-start justify-between gap-4 bg-gray-950/60">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-bold text-white">{business.canonicalName}</h2>
              {status === "qualified" ? (
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                  Qualified
                </span>
              ) : status === "review" ? (
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-300">
                  Needs Review
                </span>
              ) : (
                <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-400">
                  Rejected
                </span>
              )}
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
              <span>{business.domain || "No domain"}</span>
              <span>•</span>
              <span>{business.city || "Global Location"}{business.country ? `, ${business.country}` : ""}</span>
              <span>•</span>
              <span className="text-gray-300">{business.industry}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[10px] font-mono uppercase text-gray-400">Score</div>
              <div className="text-2xl font-black text-indigo-400">{overallScore}/100</div>
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
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-800 bg-gray-950 px-6 gap-2 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("breakdown")}
            className={`py-3 px-3 font-medium border-b-2 transition cursor-pointer ${
              activeTab === "breakdown"
                ? "border-indigo-500 text-indigo-400 font-semibold"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            6-Factor Breakdown
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("strategy")}
            className={`py-3 px-3 font-medium border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "strategy"
                ? "border-indigo-500 text-indigo-400 font-semibold"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <span>🎯</span> AI Sales Strategy
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("pitch")}
            className={`py-3 px-3 font-medium border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "pitch"
                ? "border-cyan-500 text-cyan-400 font-semibold"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <span>📊</span> 8-Slide Pitch Deck
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("contract")}
            className={`py-3 px-3 font-medium border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "contract"
                ? "border-emerald-500 text-emerald-400 font-semibold"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <span>📝</span> Contract & SOW
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("people")}
            className={`py-3 px-3 font-medium border-b-2 transition cursor-pointer ${
              activeTab === "people"
                ? "border-indigo-500 text-indigo-400 font-semibold"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            Decision Makers ({business.decisionMakers?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("contacts")}
            className={`py-3 px-3 font-medium border-b-2 transition cursor-pointer ${
              activeTab === "contacts"
                ? "border-indigo-500 text-indigo-400 font-semibold"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            Contacts & Channels ({business.contacts?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("evidence")}
            className={`py-3 px-3 font-medium border-b-2 transition cursor-pointer ${
              activeTab === "evidence"
                ? "border-indigo-500 text-indigo-400 font-semibold"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            Audit Evidence ({business.sources?.length || 0})
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === "breakdown" && (
            <div className="space-y-6">
              {/* Explanation Box */}
              {qual?.explanation && (
                <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-sm text-gray-300">
                  <h4 className="font-semibold text-indigo-400 mb-1 text-xs uppercase font-mono">
                    Transparent Intelligence Assessment
                  </h4>
                  <p>{qual.explanation}</p>
                </div>
              )}

              {/* Hard Gate Status */}
              <div>
                <h4 className="text-xs uppercase font-mono text-gray-400 mb-3">Hard Verification Gates</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className={`p-3 rounded-xl border ${
                    (qual?.identityScore || 0) >= 60 ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-300" : "border-red-500/30 bg-red-500/5 text-red-300"
                  }`}>
                    <div className="text-[10px] uppercase font-mono font-bold">1. Identity Gate</div>
                    <div className="text-lg font-bold mt-1">{(qual?.identityScore || 0) >= 60 ? "PASSED" : "FAILED"}</div>
                    <p className="text-[11px] opacity-80 mt-1">Score: {qual?.identityScore ?? 0} (Min: 60)</p>
                  </div>
                  <div className={`p-3 rounded-xl border ${
                    (qual?.industryScore || 0) >= 50 ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-300" : "border-red-500/30 bg-red-500/5 text-red-300"
                  }`}>
                    <div className="text-[10px] uppercase font-mono font-bold">2. Industry Gate</div>
                    <div className="text-lg font-bold mt-1">{(qual?.industryScore || 0) >= 50 ? "PASSED" : "FAILED"}</div>
                    <p className="text-[11px] opacity-80 mt-1">Score: {qual?.industryScore ?? 0} (Min: 50)</p>
                  </div>
                  <div className={`p-3 rounded-xl border ${
                    (qual?.locationScore || 0) >= 50 ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-300" : "border-red-500/30 bg-red-500/5 text-red-300"
                  }`}>
                    <div className="text-[10px] uppercase font-mono font-bold">3. Location Gate</div>
                    <div className="text-lg font-bold mt-1">{(qual?.locationScore || 0) >= 50 ? "PASSED" : "FAILED"}</div>
                    <p className="text-[11px] opacity-80 mt-1">Score: {qual?.locationScore ?? 0} (Min: 50)</p>
                  </div>
                </div>
              </div>

              {/* 6-Factor Dimension Cards */}
              <div>
                <h4 className="text-xs uppercase font-mono text-gray-400 mb-3">6-Factor Score Breakdown</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl border border-gray-800 bg-gray-950">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Identity (20%)</span>
                      <span className="font-bold text-white">{qual?.identityScore ?? 0}/100</span>
                    </div>
                    <div className="w-full bg-gray-900 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-cyan-500 h-full" style={{ width: `${qual?.identityScore ?? 0}%` }} />
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl border border-gray-800 bg-gray-950">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Industry (20%)</span>
                      <span className="font-bold text-white">{qual?.industryScore ?? 0}/100</span>
                    </div>
                    <div className="w-full bg-gray-900 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-indigo-500 h-full" style={{ width: `${qual?.industryScore ?? 0}%` }} />
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl border border-gray-800 bg-gray-950">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Location (15%)</span>
                      <span className="font-bold text-white">{qual?.locationScore ?? 0}/100</span>
                    </div>
                    <div className="w-full bg-gray-900 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-purple-500 h-full" style={{ width: `${qual?.locationScore ?? 0}%` }} />
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl border border-gray-800 bg-gray-950">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Contactability (15%)</span>
                      <span className="font-bold text-white">{qual?.contactabilityScore ?? 0}/100</span>
                    </div>
                    <div className="w-full bg-gray-900 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-emerald-500 h-full" style={{ width: `${qual?.contactabilityScore ?? 0}%` }} />
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl border border-gray-800 bg-gray-950">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Decision-Maker (15%)</span>
                      <span className="font-bold text-white">{qual?.decisionMakerScore ?? 0}/100</span>
                    </div>
                    <div className="w-full bg-gray-900 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-pink-500 h-full" style={{ width: `${qual?.decisionMakerScore ?? 0}%` }} />
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl border border-gray-800 bg-gray-950">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Service Fit (15%)</span>
                      <span className="font-bold text-white">{qual?.serviceFitScore ?? 0}/100</span>
                    </div>
                    <div className="w-full bg-gray-900 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-amber-500 h-full" style={{ width: `${qual?.serviceFitScore ?? 0}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Reasons Breakdown List */}
              {qual?.reasons && qual.reasons.length > 0 && (
                <div>
                  <h4 className="text-xs uppercase font-mono text-gray-400 mb-2">Audit Factor Log</h4>
                  <ul className="space-y-1.5 text-xs text-gray-300">
                    {qual.reasons.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 bg-gray-950 p-2.5 rounded-lg border border-gray-800/60">
                        <span className="text-indigo-400 font-mono text-[10px] mt-0.5">&bull;</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === "strategy" && (
            <div className="space-y-5">
              {/* Question 1: Why contact? */}
              <div className="p-4 rounded-xl border border-indigo-500/30 bg-gray-950">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-mono font-bold text-[10px] uppercase">
                    1. Why Contact This Business?
                  </span>
                </div>
                <p className="text-xs text-gray-200 font-medium mb-2">{strategy.whyContact.summary}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-400">
                  <div className="bg-gray-900/60 p-2.5 rounded-lg border border-gray-800">
                    <span className="text-[10px] uppercase text-gray-500 font-mono block">Industry & Location Fit</span>
                    <span className="text-gray-300">{strategy.whyContact.industryFit}</span>
                  </div>
                  <div className="bg-gray-900/60 p-2.5 rounded-lg border border-gray-800">
                    <span className="text-[10px] uppercase text-gray-500 font-mono block">Commercial Rationale</span>
                    <span className="text-gray-300">{strategy.whyContact.commercialRationale}</span>
                  </div>
                </div>
              </div>

              {/* Question 2: Who to contact? */}
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-gray-950">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold text-[10px] uppercase">
                    2. Who Should We Contact?
                  </span>
                </div>
                {strategy.whoContact.recommendedPerson ? (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gray-900/60 p-3 rounded-lg border border-gray-800">
                    <div>
                      <h4 className="text-sm font-bold text-white">{strategy.whoContact.recommendedPerson}</h4>
                      <p className="text-xs text-indigo-400 font-medium">{strategy.whoContact.role}</p>
                      <p className="text-[11px] text-gray-400 mt-1">{strategy.whoContact.relevanceReason}</p>
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <span className="text-[10px] font-mono text-gray-500 uppercase block">Confidence</span>
                      <span className="text-sm font-mono font-bold text-emerald-400">
                        {strategy.whoContact.confidence}%
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-amber-300 italic p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                    Decision-maker not found with high confidence. Approach practice manager or official business channel.
                  </p>
                )}
              </div>

              {/* Question 3: What should we offer? */}
              <div className="p-4 rounded-xl border border-cyan-500/30 bg-gray-950">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-mono font-bold text-[10px] uppercase">
                    3. What Should We Offer?
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white mb-1">{strategy.whatOffer.primaryService}</h4>
                <p className="text-xs text-gray-300 mb-2">{strategy.whatOffer.valueProposition}</p>
                <div className="p-2.5 rounded-lg bg-gray-900/60 border border-gray-800 text-xs text-gray-400">
                  <span className="text-[10px] font-mono uppercase text-gray-500 block">Recommended Opening Angle</span>
                  <span className="text-cyan-300 font-medium">{strategy.whatOffer.openingAngle}</span>
                </div>
              </div>

              {/* Question 4: How should we approach them? */}
              <div className="p-4 rounded-xl border border-purple-500/30 bg-gray-950 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 font-mono font-bold text-[10px] uppercase">
                    4. How Should We Approach Them?
                  </span>
                  <span className="text-[10px] font-mono text-gray-400">
                    Recommended: <strong className="text-white uppercase">{strategy.howApproach.recommendedChannel}</strong>
                  </span>
                </div>

                {/* Multi-Touch Cold Email Sequence (Touch 1, 2, 3) */}
                <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 text-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800 pb-2.5">
                    <span className="text-[11px] font-mono uppercase text-indigo-400 font-bold flex items-center gap-1.5">
                      <span>📧</span> 3-Touch Multichannel Campaign Sequence
                    </span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setSelectedTouch(t)}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition cursor-pointer ${
                            selectedTouch === t
                              ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                              : "bg-gray-800 text-gray-400 hover:text-white"
                          }`}
                        >
                          {t === 1 ? "Touch 1 (Day 1)" : t === 2 ? "Touch 2 (Day 4)" : "Touch 3 (Day 8)"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {(() => {
                    const currentTouch = strategy.howApproach.sequence?.find((s) => s.touchNumber === selectedTouch) || {
                      touchNumber: 1,
                      dayOffset: 1,
                      label: "Touch 1 • Value Teardown",
                      subject: strategy.howApproach.emailDraft.subject,
                      body: strategy.howApproach.emailDraft.body,
                    };

                    return (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-400 font-medium">
                            {currentTouch.label}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(`email-touch-${selectedTouch}`, `Subject: ${currentTouch.subject}\n\n${currentTouch.body}`)}
                            className="text-[10px] font-mono px-2.5 py-1 rounded-md bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 transition flex items-center gap-1 cursor-pointer"
                          >
                            {copiedKey === `email-touch-${selectedTouch}` ? "✓ Copied Email" : "📋 Copy This Email"}
                          </button>
                        </div>
                        <p className="font-semibold text-white">Subject: {currentTouch.subject}</p>
                        <pre className="text-gray-300 whitespace-pre-wrap font-sans text-xs bg-gray-950 p-3.5 rounded-lg border border-gray-800/80 leading-relaxed max-h-56 overflow-y-auto">
                          {currentTouch.body}
                        </pre>
                      </div>
                    );
                  })()}
                </div>

                {/* LinkedIn Draft */}
                <div className="bg-gray-900 p-3.5 rounded-xl border border-gray-800 text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold flex items-center gap-1">
                      <span>💼</span> LinkedIn Connection Note
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy("linkedin", strategy.howApproach.linkedinDraft.connectionNote)}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 border border-cyan-500/40 transition flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === "linkedin" ? "✓ Copied Note" : "📋 Copy Note"}
                    </button>
                  </div>
                  <p className="text-gray-300 italic bg-gray-950 p-2.5 rounded-lg border border-gray-800/60">{strategy.howApproach.linkedinDraft.connectionNote}</p>
                </div>

                {/* WhatsApp / SMS Quick Touchpoint */}
                {strategy.howApproach.whatsappDraft && (
                  <div className="bg-gray-900 p-3.5 rounded-xl border border-gray-800 text-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold flex items-center gap-1">
                        <span>💬</span> WhatsApp / SMS Direct One-Liner
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy("whatsapp", strategy.howApproach.whatsappDraft!)}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 transition flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === "whatsapp" ? "✓ Copied SMS" : "📋 Copy Message"}
                      </button>
                    </div>
                    <p className="text-gray-300 italic bg-gray-950 p-2.5 rounded-lg border border-gray-800/60">{strategy.howApproach.whatsappDraft}</p>
                  </div>
                )}

                {/* Phone Call Script & Objection Handling Battlecard */}
                <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 text-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-amber-400 font-bold flex items-center gap-1">
                      <span>📞</span> Phone Calling Script & Objection Battlecard
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy("phone", `Opener: ${strategy.howApproach.phoneScript.opener}\nHook: ${strategy.howApproach.phoneScript.hook}\nQuestions:\n${strategy.howApproach.phoneScript.qualifyingQuestions.map((q) => "- " + q).join("\n")}\nCTA: ${strategy.howApproach.phoneScript.callToAction}`)}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/40 transition flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === "phone" ? "✓ Copied Battlecard" : "📋 Copy Battlecard"}
                    </button>
                  </div>
                  <p className="text-gray-300"><strong className="text-gray-400">Opener:</strong> {strategy.howApproach.phoneScript.opener}</p>
                  <p className="text-gray-300"><strong className="text-gray-400">Hook:</strong> {strategy.howApproach.phoneScript.hook}</p>
                  <div className="pt-1">
                    <strong className="text-gray-400 text-[11px] block">Diagnostic Questions:</strong>
                    <ul className="list-disc list-inside text-gray-400 text-[11px] space-y-0.5 mt-0.5">
                      {strategy.howApproach.phoneScript.qualifyingQuestions.map((q, idx) => (
                        <li key={idx}>{q}</li>
                      ))}
                    </ul>
                  </div>

                  {strategy.howApproach.phoneScript.objectionHandlers && (
                    <div className="pt-2 border-t border-gray-800 space-y-1.5">
                      <strong className="text-amber-300 text-[11px] block uppercase font-mono">Objection Responses:</strong>
                      {Object.entries(strategy.howApproach.phoneScript.objectionHandlers).map(([objection, response]) => (
                        <div key={objection} className="bg-gray-950 p-2.5 rounded-lg border border-gray-800 text-[11px]">
                          <span className="text-amber-400 font-semibold block">&ldquo;{objection}&rdquo;</span>
                          <span className="text-gray-300 mt-0.5 block">&rarr; {response}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Behavioral Brain & Timing Windows */}
                {strategy.brainSuite && (
                  <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold flex items-center gap-1.5">
                        <span>⚡</span> In-House Outreach Brain: Timing & Channel Matrix
                      </span>
                      <span className="text-[10px] font-mono text-gray-400">
                        Local Timezone: <strong className="text-white">{strategy.brainSuite.timing.timezone}</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-gray-950/80 p-3 rounded-xl border border-gray-800 space-y-1">
                        <span className="text-[10px] uppercase font-mono text-cyan-400 block">Optimal Send Window</span>
                        <div className="text-sm font-bold text-white">
                          {strategy.brainSuite.timing.bestDays.join(", ")} • {strategy.brainSuite.timing.bestTimeLocal}
                        </div>
                        <p className="text-[11px] text-gray-400">{strategy.brainSuite.timing.industryRhythmExplanation}</p>
                      </div>

                      <div className="bg-gray-950/80 p-3 rounded-xl border border-gray-800 space-y-1">
                        <span className="text-[10px] uppercase font-mono text-cyan-400 block">Highest-Reply Channel</span>
                        <div className="text-sm font-bold text-emerald-400 capitalize">
                          {strategy.brainSuite.primaryChannel} Direct ({strategy.brainSuite.rankedChannels[0]?.label || "Verified Email"})
                        </div>
                        <p className="text-[11px] text-gray-400">{strategy.brainSuite.rankedChannels[0]?.rationale || "Highest verified engagement probability"}</p>
                      </div>
                    </div>

                    {/* WhatsApp Voice Note & Instagram DM Hooks */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-cyan-900/40 text-xs">
                      <div className="bg-gray-950 p-2.5 rounded-lg border border-gray-800">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] uppercase font-mono text-emerald-400 font-semibold">🎙️ WhatsApp Voice Note Script</span>
                          <span className="text-[10px] text-gray-500">{strategy.brainSuite.whatsAppVoiceNote.durationEst}</span>
                        </div>
                        <p className="text-gray-300 italic text-[11px]">{strategy.brainSuite.whatsAppVoiceNote.script}</p>
                      </div>

                      <div className="bg-gray-950 p-2.5 rounded-lg border border-gray-800">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] uppercase font-mono text-purple-400 font-semibold">📸 Instagram DM Opener</span>
                          <span className="text-[10px] text-gray-500">Brand Direct</span>
                        </div>
                        <p className="text-gray-300 italic text-[11px]">{strategy.brainSuite.instagramDmScript.dmMessage}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 8-Slide Custom Pitch Deck Tab */}
          {activeTab === "pitch" && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border border-cyan-500/30 bg-cyan-950/20">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-md border border-cyan-500/30">
                      In-House Pitch Engine v3.0
                    </span>
                    <h3 className="text-sm font-bold text-white">{pitchDeck.deckTitle}</h3>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Tailored presentation for {pitchDeck.decisionMaker} in {pitchDeck.city}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy("pitch-md", pitchDeck.markdownExport)}
                    className="px-3 py-1.5 rounded-xl border border-gray-700 bg-gray-800 hover:bg-gray-700 text-xs text-gray-200 transition cursor-pointer"
                  >
                    {copiedKey === "pitch-md" ? "✓ Copied Deck" : "📋 Copy Markdown"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const blob = new Blob([pitchDeck.htmlExport], { type: "text/html" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `${business.canonicalName.replace(/\s+/g, "_")}_Pitch_Deck.html`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-500/20 transition cursor-pointer"
                  >
                    🌐 Export Presentation HTML
                  </button>
                  {onAdvanceStage && (
                    <button
                      type="button"
                      onClick={() => onAdvanceStage("pitch_sent")}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-cyan-500/20 transition cursor-pointer"
                    >
                      🚀 Mark Pitch Sent
                    </button>
                  )}
                </div>
              </div>

              {/* Slide Navigation Header */}
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {pitchDeck.slides.map((s, idx) => (
                    <button
                      key={s.slideNumber}
                      type="button"
                      onClick={() => setActiveSlideIndex(idx)}
                      className={`px-3 py-1 rounded-xl text-xs font-mono font-semibold transition cursor-pointer ${
                        activeSlideIndex === idx
                          ? "bg-cyan-500 text-gray-950 shadow-md shadow-cyan-500/20"
                          : "bg-gray-900 text-gray-400 hover:text-white border border-gray-800"
                      }`}
                    >
                      Slide {s.slideNumber}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={activeSlideIndex === 0}
                    onClick={() => setActiveSlideIndex((prev) => Math.max(0, prev - 1))}
                    className="p-1.5 rounded-lg bg-gray-900 border border-gray-800 text-gray-300 hover:text-white disabled:opacity-30 cursor-pointer"
                  >
                    ◀
                  </button>
                  <span className="text-xs font-mono text-gray-400">
                    {activeSlideIndex + 1} / {pitchDeck.slides.length}
                  </span>
                  <button
                    type="button"
                    disabled={activeSlideIndex === pitchDeck.slides.length - 1}
                    onClick={() => setActiveSlideIndex((prev) => Math.min(pitchDeck.slides.length - 1, prev + 1))}
                    className="p-1.5 rounded-lg bg-gray-900 border border-gray-800 text-gray-300 hover:text-white disabled:opacity-30 cursor-pointer"
                  >
                    ▶
                  </button>
                </div>
              </div>

              {/* Active Slide Presentation Canvas */}
              {(() => {
                const slide = pitchDeck.slides[activeSlideIndex];
                if (!slide) return null;
                return (
                  <div className="p-8 rounded-3xl border border-gray-800 bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900 shadow-2xl space-y-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-400 font-bold block mb-1">
                          Slide {slide.slideNumber} • {pitchDeck.companyName}
                        </span>
                        <h2 className="text-2xl font-black text-white tracking-tight">{slide.title}</h2>
                        <p className="text-sm text-gray-300 mt-1">{slide.subtitle}</p>
                      </div>

                      {slide.calloutMetric && (
                        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl p-4 text-right min-w-[140px]">
                          <div className="text-2xl font-black text-cyan-400 font-mono">{slide.calloutMetric}</div>
                          <div className="text-[10px] uppercase font-mono text-gray-400 mt-0.5">{slide.calloutLabel}</div>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-gray-800/80">
                      <ul className="space-y-3">
                        {slide.bulletPoints.map((point, pIdx) => (
                          <li key={pIdx} className="flex items-start gap-3 text-sm text-gray-200">
                            <span className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0 shadow-sm shadow-cyan-400/80" />
                            <span className="leading-relaxed">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Contract, SOW & Agreement Generator Tab */}
          {activeTab === "contract" && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/20">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/30">
                      Commercial SOW & Legal Suite
                    </span>
                    <h3 className="text-sm font-bold text-white">Agreement #{contract.agreementNumber}</h3>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Client: <strong className="text-white">{contract.clientLegalName}</strong> • Signer: <strong className="text-white">{contract.clientSignerName}</strong> ({contract.clientSignerRole})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy("contract-md", contract.markdownDocument)}
                    className="px-3 py-1.5 rounded-xl border border-gray-700 bg-gray-800 hover:bg-gray-700 text-xs text-gray-200 transition cursor-pointer"
                  >
                    {copiedKey === "contract-md" ? "✓ Copied SOW" : "📋 Copy Markdown"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const blob = new Blob([contract.htmlDocument], { type: "text/html" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `SOW_${contract.agreementNumber}_${contract.clientLegalName.replace(/\s+/g, "_")}.html`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 transition cursor-pointer"
                  >
                    🖨️ Export Printable SOW
                  </button>
                  {onAdvanceStage && (
                    <button
                      type="button"
                      onClick={() => onAdvanceStage("contract_sent")}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 transition cursor-pointer"
                    >
                      📝 Mark Contract Sent
                    </button>
                  )}
                </div>
              </div>

              {/* SOW Document Preview Canvas */}
              <div className="p-6 rounded-2xl border border-gray-800 bg-gray-950 space-y-6 text-xs text-gray-300 max-h-[60vh] overflow-y-auto">
                <div className="border-b border-gray-800 pb-4">
                  <h2 className="text-lg font-bold text-white">STATEMENT OF WORK & SERVICE AGREEMENT</h2>
                  <div className="text-[11px] text-gray-400 mt-1 font-mono">
                    Agreement #{contract.agreementNumber} • Effective: {contract.effectiveDate} • Governing Law: {contract.governingLaw}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-900/60 p-4 rounded-xl border border-gray-800">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-gray-500 block">Service Provider</span>
                    <strong className="text-white text-sm block">{contract.providerName}</strong>
                    <span className="text-gray-400">{contract.providerEmail}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-gray-500 block">Client Entity</span>
                    <strong className="text-white text-sm block">{contract.clientLegalName}</strong>
                    <span className="text-gray-400">{contract.clientAddress}</span>
                    <div className="text-emerald-400 text-[11px] mt-0.5">Signer: {contract.clientSignerName} ({contract.clientSignerRole})</div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs uppercase font-mono text-gray-400 mb-2">1. Scope of Deliverables</h4>
                  <ul className="space-y-1.5">
                    {contract.scopeOfWork.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 bg-gray-900/40 p-2.5 rounded-lg border border-gray-800/80">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs uppercase font-mono text-gray-400">2. Milestones & Commercial Compensation</h4>
                    <span className="text-xs font-mono font-bold text-emerald-400">Total: {contract.totalAgreementValue}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border border-gray-800 rounded-lg overflow-hidden">
                      <thead className="bg-gray-900 text-gray-400 font-mono text-[10px] uppercase">
                        <tr>
                          <th className="p-2.5">Milestone</th>
                          <th className="p-2.5">Deliverable</th>
                          <th className="p-2.5">Timeline</th>
                          <th className="p-2.5 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {contract.milestones.map((m, idx) => (
                          <tr key={idx} className="bg-gray-950/60 hover:bg-gray-900/40">
                            <td className="p-2.5 font-semibold text-white">{m.phase}</td>
                            <td className="p-2.5 text-gray-300">{m.deliverable}</td>
                            <td className="p-2.5 text-gray-400 font-mono">{m.estimatedWeeks} Wks</td>
                            <td className="p-2.5 text-right text-emerald-400 font-mono font-bold">{m.paymentAmount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-900/40 rounded-xl border border-gray-800">
                    <span className="text-[10px] uppercase font-mono text-gray-400 block mb-1">Provider Execution</span>
                    <div className="h-8 border-b border-gray-700 mb-1" />
                    <span className="text-[11px] text-gray-300">Authorized Partner • {contract.effectiveDate}</span>
                  </div>
                  <div className="p-3 bg-gray-900/40 rounded-xl border border-gray-800">
                    <span className="text-[10px] uppercase font-mono text-gray-400 block mb-1">Client Authorized Acceptance</span>
                    <div className="h-8 border-b border-gray-700 mb-1" />
                    <span className="text-[11px] text-emerald-400">{contract.clientSignerName} • {contract.clientSignerRole}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "people" && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs text-amber-300">
                <strong>UNKNOWN &gt; WRONG Principle:</strong> Only individuals explicitly corroborated with the business are listed. Reception desk lines are never assigned to individuals.
              </div>

              {business.decisionMakers && business.decisionMakers.length > 0 ? (
                <div className="space-y-4">
                  {business.decisionMakers.map((dm, i) => (
                    <div key={i} className="p-5 rounded-xl border border-gray-800 bg-gray-950 space-y-4">
                      {/* Top Header: Name, Credentials, Role, Confidence & Profile */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-base font-bold text-white">{dm.fullName}</h4>
                            {dm.credentials && dm.credentials.length > 0 && (
                              <div className="flex gap-1 flex-wrap">
                                {dm.credentials.map((cred, cIdx) => (
                                  <span key={cIdx} className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-semibold">
                                    {cred}
                                  </span>
                                ))}
                              </div>
                            )}
                            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 uppercase font-semibold">
                              {dm.roleLabel}
                            </span>
                          </div>

                          {dm.specialization && (
                            <p className="text-xs text-gray-300 font-medium">
                              Specialization: <span className="text-white">{dm.specialization}</span>
                              {dm.department && <span className="text-gray-400"> • {dm.department}</span>}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full border ${
                            dm.verificationStatus === "verified"
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                              : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                          } uppercase font-semibold`}>
                            {dm.verificationStatus} ({dm.confidenceScore}%)
                          </span>

                          {dm.profileUrl && (
                            <a
                              href={dm.profileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-lg flex items-center gap-1 font-mono transition"
                            >
                              LinkedIn &rarr;
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Direct Professional Contacts (if verified) */}
                      {(dm.email || dm.phone) && (
                        <div className="p-3 rounded-lg border border-gray-800/80 bg-gray-900/60 flex flex-wrap gap-4 text-xs">
                          {dm.email && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] uppercase font-mono text-cyan-400">Direct Email:</span>
                              <a href={`mailto:${dm.email}`} className="text-gray-200 hover:text-white font-mono">{dm.email}</a>
                            </div>
                          )}
                          {dm.phone && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] uppercase font-mono text-emerald-400">Direct Line:</span>
                              <span className="text-gray-200 font-mono">{dm.phone}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Corroboration Evidence & Provenance */}
                      {dm.reason && (
                        <div className="text-xs text-gray-400 bg-gray-900/40 p-3 rounded-lg border border-gray-800/40">
                          <div className="text-[10px] uppercase font-mono text-gray-500 mb-0.5">Corroborated Evidence Provenance</div>
                          <p>{dm.reason}</p>
                          {dm.sourceUrl && (
                            <a
                              href={dm.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-indigo-400 hover:underline mt-1 inline-block font-mono"
                            >
                              Source: {dm.sourceUrl}
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500 text-sm border border-gray-800 rounded-xl bg-gray-950">
                  No verified decision-maker found for this business. Field marked as unknown.
                </div>
              )}
            </div>
          )}

          {activeTab === "contacts" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Phones */}
                <div className="space-y-2">
                  <h4 className="text-xs uppercase font-mono text-gray-400">Verified Telephone Lines</h4>
                  {business.contacts?.filter((c) => c.contactType === "phone").length ? (
                    business.contacts
                      .filter((c) => c.contactType === "phone")
                      .map((p, i) => (
                        <div key={i} className="p-3 rounded-xl border border-gray-800 bg-gray-950 text-xs">
                          <div className="flex justify-between items-center text-[10px] text-gray-500 mb-1">
                            <span className="uppercase font-mono text-indigo-400 font-semibold">{p.ownershipType}</span>
                            <span className="text-emerald-400">{p.verificationStatus}</span>
                          </div>
                          <div className="text-sm font-mono text-white">{p.value}</div>
                        </div>
                      ))
                  ) : (
                    <p className="text-xs text-gray-500 italic p-3 bg-gray-950 rounded-xl border border-gray-800">
                      No verified phone line found.
                    </p>
                  )}
                </div>

                {/* Emails */}
                <div className="space-y-2">
                  <h4 className="text-xs uppercase font-mono text-gray-400">Verified Email Addresses</h4>
                  {business.contacts?.filter((c) => c.contactType === "email").length ? (
                    business.contacts
                      .filter((c) => c.contactType === "email")
                      .map((e, i) => (
                        <div key={i} className="p-3 rounded-xl border border-gray-800 bg-gray-950 text-xs">
                          <div className="flex justify-between items-center text-[10px] text-gray-500 mb-1">
                            <span className="uppercase font-mono text-cyan-400 font-semibold">{e.ownershipType}</span>
                            <span className="text-emerald-400">{e.verificationStatus}</span>
                          </div>
                          <div className="text-sm font-mono text-white truncate">{e.value}</div>
                        </div>
                      ))
                  ) : (
                    <p className="text-xs text-gray-500 italic p-3 bg-gray-950 rounded-xl border border-gray-800">
                      No corporate email found.
                    </p>
                  )}
                </div>
              </div>

              {business.address && (
                <div className="p-3.5 rounded-xl border border-gray-800 bg-gray-950 text-xs">
                  <span className="text-[10px] uppercase font-mono text-gray-500 block mb-1">Physical Premises Address</span>
                  <span className="text-gray-200">{business.address}</span>
                </div>
              )}
            </div>
          )}

          {activeTab === "evidence" && (
            <div className="space-y-3">
              <h4 className="text-xs uppercase font-mono text-gray-400 mb-2">Source Evidence Audit Trail</h4>
              {business.sources && business.sources.length > 0 ? (
                <div className="space-y-2">
                  {business.sources.map((src, i) => (
                    <div key={i} className="p-3 rounded-xl border border-gray-800 bg-gray-950 text-xs">
                      <div className="flex justify-between items-center text-[10px] text-gray-500 mb-1">
                        <span className="font-mono text-indigo-400">{src.sourceType}</span>
                        <span>{src.sourceHost}</span>
                      </div>
                      <p className="text-gray-300 mt-1">{src.evidenceText}</p>
                      {src.sourceUrl && (
                        <a
                          href={src.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 block truncate text-[11px] text-indigo-400 hover:text-indigo-300"
                        >
                          {src.sourceUrl} &rarr;
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic p-4 text-center border border-gray-800 rounded-xl bg-gray-950">
                  No source evidence records attached.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 bg-gray-950/80 flex justify-between items-center">
          <div className="text-[11px] text-gray-500 font-mono">
            AutoRadar ID: {business.id}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-white transition cursor-pointer"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
}

