"use client";

import React from "react";
import type { Business } from "../lib/types/business.ts";

type ExportModalProps = {
  businesses: Business[];
  isOpen: boolean;
  onClose: () => void;
};

export function ExportModal({ businesses, isOpen, onClose }: ExportModalProps) {
  if (!isOpen) return null;

  const downloadCsv = () => {
    const headers = [
      "Company Name",
      "Website",
      "Domain",
      "Industry",
      "City",
      "Country",
      "Address",
      "Reception / Business Phone",
      "Corporate Email",
      "Decision Maker Name",
      "Decision Maker Role",
      "Decision Maker Credentials",
      "Decision Maker Specialization",
      "Decision Maker Direct Email",
      "Decision Maker Verification Status",
      "Decision Maker LinkedIn",
      "Qualification Score",
      "Status",
      "Explanation",
    ];

    const escapeCsv = (val: string | number | null | undefined) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = businesses.map((b) => {
      const phone = (b.contacts || []).find((c) => c.contactType === "phone")?.value || "";
      const email = (b.contacts || []).find((c) => c.contactType === "email")?.value || "";
      const dm = b.decisionMakers?.[0];

      return [
        escapeCsv(b.canonicalName),
        escapeCsv(b.website),
        escapeCsv(b.domain),
        escapeCsv(b.industry),
        escapeCsv(b.city),
        escapeCsv(b.country),
        escapeCsv(b.address),
        escapeCsv(phone),
        escapeCsv(email),
        escapeCsv(dm?.fullName),
        escapeCsv(dm?.roleLabel),
        escapeCsv(dm?.credentials?.join("; ")),
        escapeCsv(dm?.specialization),
        escapeCsv(dm?.email),
        escapeCsv(dm?.verificationStatus),
        escapeCsv(dm?.profileUrl),
        escapeCsv(b.qualificationScore),
        escapeCsv(b.status),
        escapeCsv(b.qualification?.explanation),
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `soletrust-autoradar-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadJson = () => {
    const jsonStr = JSON.stringify(businesses, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `soletrust-autoradar-leads-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-white mb-2">Export Prospecting Intelligence</h3>
        <p className="text-xs text-gray-400 mb-6">
          Download {businesses.length} discovered lead records with full score breakdowns and evidence provenance.
        </p>

        <div className="space-y-3">
          <button
            type="button"
            onClick={downloadCsv}
            className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-800 bg-gray-950 hover:border-gray-700 transition text-left cursor-pointer"
          >
            <div>
              <div className="text-sm font-semibold text-white">Download CSV Spreadsheet</div>
              <div className="text-xs text-gray-500">Structured columns compatible with CRM, Excel, or Google Sheets</div>
            </div>
            <span className="text-indigo-400 font-bold">&darr;</span>
          </button>

          <button
            type="button"
            onClick={downloadJson}
            className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-800 bg-gray-950 hover:border-gray-700 transition text-left cursor-pointer"
          >
            <div>
              <div className="text-sm font-semibold text-white">Download Full Canonical JSON</div>
              <div className="text-xs text-gray-500">Complete JSON payload with nested SourceEvidence and contacts</div>
            </div>
            <span className="text-cyan-400 font-bold">&darr;</span>
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white transition cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

