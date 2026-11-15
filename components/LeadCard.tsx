"use client";

import React, { useState } from "react";
import type { Business } from "../lib/types/business.ts";

type LeadCardProps = {
  business: Business;
  onViewDossier: (business: Business) => void;
  onReverify?: (id: string) => Promise<void>;
};

export function LeadCard({ business, onViewDossier, onReverify }: LeadCardProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const qual = business.qualification;
  const overallScore = business.qualificationScore || qual?.overallScore || 0;
  const status = business.status || qual?.status || "discovered";

  // Decision maker highlight
  const primaryDm = business.decisionMakers && business.decisionMakers.length > 0
    ? business.decisionMakers[0]
    : null;

  // Phone highlight (prefer reception or business main)
  const phoneContact = (business.contacts || []).find((c) => c.contactType === "phone");
  // Email highlight
  const emailContact = (business.contacts || []).find((c) => c.contactType === "email");

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
              <span>{business.city || "Vadodara"}, {business.country || "India"}</span>
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
                {primaryDm.specialization && (
                  <p className="text-gray-500 text-[10px] truncate">{primaryDm.specialization}</p>
                )}
                {primaryDm.email && (
                  <p className="text-cyan-400 font-mono text-[10px] truncate">{primaryDm.email}</p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 italic">Not found (UNKNOWN &gt; WRONG)</p>
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
                  <span>{phoneContact.value}</span>
                </p>
              ) : (
                <p className="text-gray-500 italic">Phone: Not found</p>
              )}
              {emailContact ? (
                <p className="text-gray-300 flex items-center gap-1.5 truncate">
                  <span className="text-cyan-400 font-mono text-[10px]">Email:</span>
                  <span className="truncate">{emailContact.value}</span>
                </p>
              ) : (
                <p className="text-gray-500 italic">Email: Not found</p>
              )}
            </div>
          </div>
        </div>

        {/* Explanation snippet */}
        {qual?.explanation && (
          <p className="mt-3 text-xs text-gray-400 line-clamp-2 bg-gray-950/30 p-2.5 rounded-lg border border-gray-800/40">
            {qual.explanation}
          </p>
        )}
      </div>

      {/* Card Actions */}
      <div className="mt-5 pt-4 border-t border-gray-800/80 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onViewDossier(business)}
          className="flex-1 rounded-xl bg-gray-800 hover:bg-gray-700 px-4 py-2.5 text-xs font-semibold text-white transition text-center cursor-pointer"
        >
          View Lead Dossier &rarr;
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

