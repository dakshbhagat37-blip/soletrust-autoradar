"use client";

import React, { useState } from "react";
import type { Business } from "../lib/types/business.ts";
import { generateAiSalesStrategy } from "../lib/crm/ai-strategy.ts";

type LeadCardProps = {
  business: Business;
  onViewDossier: (business: Business) => void;
  onReverify?: (id: string) => Promise<void>;
};

export function LeadCard({ business, onViewDossier, onReverify }: LeadCardProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [showOutreach, setShowOutreach] = useState(false);
  const [activeOutreachTab, setActiveOutreachTab] = useState<"email" | "linkedin" | "call">("email");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const qual = business.qualification;
  const overallScore = business.qualificationScore || qual?.overallScore || 0;
  const status = business.status || qual?.status || "discovered";
  const strategy = generateAiSalesStrategy(business);

  // Decision maker highlight
  const primaryDm = business.decisionMakers && business.decisionMakers.length > 0
    ? business.decisionMakers[0]
    : null;

  // Phone highlight (prefer reception or business main)
  const phoneContact = (business.contacts || []).find((c) => c.contactType === "phone");
  // Email highlight
  const emailContact = (business.contacts || []).find((c) => c.contactType === "email");

  const effectivePhone = primaryDm?.phone || phoneContact?.value || null;
  const effectiveEmail = primaryDm?.email || emailContact?.value || null;

  const handleCopy = (key: string, text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    }
  };

  const handleReverifyClick = async () => {
    if (!onReverify) return;
    try {
      setIsVerifying(true);
      await onReverify(business.id);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 shadow-lg hover:border-gray-700 transition flex flex-col justify-between">
      <div>
        {/* Top Header: Name, Website, Status & Score */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-white truncate">{business.canonicalName}</h3>
              {/* Status Badge */}
              {status === "qualified" ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Qualified
                </span>
              ) : status === "review" ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Needs Review
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  Rejected
                </span>
              )}
            </div>

            {/* Domain & Location */}
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-400 flex-wrap">
              {business.website ? (
                <a
                  href={business.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1"
                >
                  {business.domain || business.website}
                  <svg className="w-3 h-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ) : (
                <span className="text-gray-500 font-mono">Domain: unverified</span>
              )}
              <span>•</span>
              <span>{business.city || "Global Location"}{business.country ? `, ${business.country}` : ""}</span>
              {business.industry && (
                <>
                  <span>•</span>
                  <span className="text-gray-300">{business.industry}</span>
                </>
              )}
            </div>
          </div>

          {/* Qualification Score Gauge */}
          <div className="text-right shrink-0">
            <div className="text-xs font-mono uppercase text-gray-400">AutoRadar Fit</div>
            <div className={`text-2xl font-black ${
              overallScore >= 65 ? "text-emerald-400" : overallScore >= 45 ? "text-amber-400" : "text-gray-500"
            }`}>
              {overallScore}
              <span className="text-xs font-normal text-gray-500">/100</span>
            </div>
          </div>
        </div>

        {/* 6-Factor Micro Breakdown */}
        {qual && (
          <div className="mt-4 grid grid-cols-6 gap-1 bg-gray-950 p-2.5 rounded-xl border border-gray-800/80 text-center">
            <div>
              <div className="text-[9px] uppercase font-mono text-gray-500">Identity</div>
              <div className="text-xs font-bold text-gray-200">{qual.identityScore}</div>
            </div>
            <div>
              <div className="text-[9px] uppercase font-mono text-gray-500">Industry</div>
              <div className="text-xs font-bold text-gray-200">{qual.industryScore}</div>
            </div>
            <div>
              <div className="text-[9px] uppercase font-mono text-gray-500">Location</div>
              <div className="text-xs font-bold text-gray-200">{qual.locationScore}</div>
            </div>
            <div>
              <div className="text-[9px] uppercase font-mono text-gray-500">Contacts</div>
              <div className="text-xs font-bold text-gray-200">{qual.contactabilityScore}</div>
            </div>
            <div>
              <div className="text-[9px] uppercase font-mono text-gray-500">D-Maker</div>
              <div className="text-xs font-bold text-gray-200">{qual.decisionMakerScore}</div>
            </div>
            <div>
              <div className="text-[9px] uppercase font-mono text-gray-500">Fit</div>
              <div className="text-xs font-bold text-gray-200">{qual.serviceFitScore}</div>
            </div>
          </div>
        )}

        {/* Intelligence Highlights Grid */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Decision-Maker Box */}
          <div className="p-3 rounded-xl border border-gray-800 bg-gray-950/50">
            <div className="text-[10px] uppercase font-mono text-gray-500 mb-1 flex items-center justify-between">
              <span>Decision-Maker</span>
              {primaryDm && (
                <span className="text-[10px] text-purple-400 font-semibold uppercase">{primaryDm.verificationStatus}</span>
              )}
            </div>
            {primaryDm ? (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="font-semibold text-white truncate">{primaryDm.fullName}</p>
                  {primaryDm.credentials && primaryDm.credentials.length > 0 && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
                      {primaryDm.credentials.join(", ")}
                    </span>
                  )}
                  {primaryDm.profileUrl && (
                    <a
                      href={primaryDm.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 font-mono text-[10px] bg-indigo-500/10 px-1 rounded"
                    >
                      LinkedIn
                    </a>
                  )}
                </div>
                <p className="text-gray-400 text-[11px] truncate">{primaryDm.roleLabel}</p>
                {/* Decision Maker Direct / Practice Phone */}
                <div className="flex items-center gap-1.5 text-gray-300 pt-0.5">
                  <span className="text-[10px] font-mono text-indigo-400">Phone:</span>
                  <span className="font-mono text-[11px] text-white">
                    {effectivePhone || "Not listed (UNKNOWN > WRONG)"}
                  </span>
                </div>
                {/* Decision Maker Direct / Domain Email */}
                <div className="flex items-center gap-1.5 text-gray-300 truncate">
                  <span className="text-[10px] font-mono text-cyan-400">Email:</span>
                  <span className="font-mono text-[11px] text-white truncate">
                    {effectiveEmail || "Not listed (UNKNOWN > WRONG)"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-gray-500 italic">No named director verified</p>
                {effectivePhone && (
                  <p className="text-gray-300 text-[11px] font-mono">
                    <span className="text-indigo-400">Clinic Phone:</span> {effectivePhone}
                  </p>
                )}
                {effectiveEmail && (
                  <p className="text-gray-300 text-[11px] font-mono truncate">
                    <span className="text-cyan-400">Clinic Email:</span> {effectiveEmail}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Contact Channels Box */}
          <div className="p-3 rounded-xl border border-gray-800 bg-gray-950/50">
            <div className="text-[10px] uppercase font-mono text-gray-500 mb-1">
              Verified Business Contacts
            </div>
            <div className="space-y-1">
              {phoneContact ? (
                <p className="text-gray-300 flex items-center gap-1.5 truncate">
                  <span className="text-indigo-400 font-mono text-[10px]">
                    {phoneContact.ownershipType === "reception" ? "Reception" : "Business"}:
                  </span>
                  <span className="font-mono">{phoneContact.value}</span>
                </p>
              ) : (
                <p className="text-gray-500 italic">Phone: Not found</p>
              )}
              {emailContact ? (
                <p className="text-gray-300 flex items-center gap-1.5 truncate">
                  <span className="text-cyan-400 font-mono text-[10px]">Email:</span>
                  <span className="truncate font-mono">{emailContact.value}</span>
                </p>
              ) : (
                <p className="text-gray-500 italic">Email: Not found</p>
              )}
              <div className="pt-1 text-[10px] text-gray-500 flex items-center gap-2">
                <span>Domain: {business.domain || "None"}</span>
                <span>•</span>
                <span>Sources: {business.sources?.length || 1}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Why Reach Out & Recommended Channel */}
        <div className="mt-3.5 p-3 rounded-xl border border-indigo-500/20 bg-indigo-950/20 text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-mono text-indigo-300 font-bold flex items-center gap-1">
              <span>💡</span> Why Reach Out
            </span>
            <span className="text-[10px] font-mono text-indigo-400">
              Angle: {strategy.whatOffer.openingAngle.slice(0, 36)}...
            </span>
          </div>
          <p className="text-gray-300 text-[11px] leading-relaxed line-clamp-2">
            {strategy.whyContact.opportunityIdentified || qual?.explanation}
          </p>
        </div>

        {/* How to Reach Out Toggle */}
        <div className="mt-2 flex items-center justify-between gap-2 p-2.5 rounded-xl border border-gray-800 bg-gray-950/40 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] uppercase font-mono text-gray-500">How to Reach Out:</span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono uppercase font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {strategy.howApproach.recommendedChannel === "email" ? "✉️ Email (Recommended)" : strategy.howApproach.recommendedChannel === "linkedin" ? "💼 LinkedIn DM" : "📞 Direct Phone Call"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowOutreach(!showOutreach)}
            className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer transition shrink-0"
          >
            {showOutreach ? "Hide Framed Outreach ▲" : "View Framed Email & DM ▼"}
          </button>
        </div>

        {/* Expandable Framed Email & DM Box */}
        {showOutreach && (
          <div className="mt-3 p-3.5 rounded-xl border border-indigo-500/30 bg-gray-950 space-y-3 text-xs">
            {/* Outreach Sub-Tabs */}
            <div className="flex items-center gap-1.5 border-b border-gray-800 pb-2">
              <button
                type="button"
                onClick={() => setActiveOutreachTab("email")}
                className={`text-[11px] px-2.5 py-1 rounded-md transition cursor-pointer font-medium ${
                  activeOutreachTab === "email"
                    ? "bg-indigo-600 text-white font-semibold"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                📧 Framed Email
              </button>
              <button
                type="button"
                onClick={() => setActiveOutreachTab("linkedin")}
                className={`text-[11px] px-2.5 py-1 rounded-md transition cursor-pointer font-medium ${
                  activeOutreachTab === "linkedin"
                    ? "bg-indigo-600 text-white font-semibold"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                💼 LinkedIn DM
              </button>
              <button
                type="button"
                onClick={() => setActiveOutreachTab("call")}
                className={`text-[11px] px-2.5 py-1 rounded-md transition cursor-pointer font-medium ${
                  activeOutreachTab === "call"
                    ? "bg-indigo-600 text-white font-semibold"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                📞 Phone Script
              </button>
            </div>

            {/* Email Tab */}
            {activeOutreachTab === "email" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-gray-400 uppercase">Subject Line:</span>
                  <button
                    type="button"
                    onClick={() => handleCopy("email", `Subject: ${strategy.howApproach.emailDraft.subject}\n\n${strategy.howApproach.emailDraft.body}`)}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 transition cursor-pointer"
                  >
                    {copiedKey === "email" ? "✓ Copied Email!" : "📋 Copy Email"}
                  </button>
                </div>
                <p className="font-semibold text-white bg-gray-900 p-2 rounded border border-gray-800">
                  {strategy.howApproach.emailDraft.subject}
                </p>
                <pre className="text-gray-300 whitespace-pre-wrap font-sans text-xs bg-gray-900 p-2.5 rounded border border-gray-800 leading-relaxed max-h-48 overflow-y-auto">
                  {strategy.howApproach.emailDraft.body}
                </pre>
              </div>
            )}

            {/* LinkedIn Tab */}
            {activeOutreachTab === "linkedin" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-gray-400 uppercase">Connection Note:</span>
                  <button
                    type="button"
                    onClick={() => handleCopy("linkedin", strategy.howApproach.linkedinDraft.connectionNote)}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 border border-cyan-500/40 transition cursor-pointer"
                  >
                    {copiedKey === "linkedin" ? "✓ Copied Note!" : "📋 Copy Note"}
                  </button>
                </div>
                <p className="text-gray-300 italic bg-gray-900 p-2.5 rounded border border-gray-800">
                  {strategy.howApproach.linkedinDraft.connectionNote}
                </p>
                <div className="pt-1">
                  <span className="text-[10px] font-mono text-gray-400 uppercase block mb-1">Follow-up Message:</span>
                  <p className="text-gray-300 text-xs bg-gray-900 p-2.5 rounded border border-gray-800">
                    {strategy.howApproach.linkedinDraft.followupMessage}
                  </p>
                </div>
              </div>
            )}

            {/* Phone Tab */}
            {activeOutreachTab === "call" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-gray-400 uppercase">Phone Introduction:</span>
                  <button
                    type="button"
                    onClick={() => handleCopy("call", `Opener: ${strategy.howApproach.phoneScript.opener}\nHook: ${strategy.howApproach.phoneScript.hook}`)}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/40 transition cursor-pointer"
                  >
                    {copiedKey === "call" ? "✓ Copied Script!" : "📋 Copy Script"}
                  </button>
                </div>
                <p className="text-gray-300 text-xs bg-gray-900 p-2.5 rounded border border-gray-800">
                  <strong className="text-gray-400">Opener:</strong> {strategy.howApproach.phoneScript.opener}
                </p>
                <p className="text-gray-300 text-xs bg-gray-900 p-2.5 rounded border border-gray-800">
                  <strong className="text-gray-400">Hook:</strong> {strategy.howApproach.phoneScript.hook}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card Actions */}
      <div className="mt-5 pt-4 border-t border-gray-800/80 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onViewDossier(business)}
          className="flex-1 rounded-xl bg-gray-800 hover:bg-gray-700 px-4 py-2.5 text-xs font-semibold text-white transition text-center cursor-pointer"
        >
          View Full Lead Dossier &rarr;
        </button>
        {onReverify && (
          <button
            type="button"
            disabled={isVerifying}
            onClick={handleReverifyClick}
            className="rounded-xl border border-gray-700 hover:bg-gray-800 px-3 py-2.5 text-xs text-gray-300 transition cursor-pointer disabled:opacity-50"
          >
            {isVerifying ? "Verifying..." : "Re-Verify"}
          </button>
        )}
      </div>
    </div>
  );
}
