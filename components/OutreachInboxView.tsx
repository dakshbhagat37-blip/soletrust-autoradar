"use client";

import React, { useState } from "react";
import type { CrmLead } from "../lib/types/lead";
import type { OutreachChannel } from "../lib/types/crm";

type OutreachInboxViewProps = {
  leads: CrmLead[];
  onSendOutreach: (
    leadId: string,
    params: { channel: OutreachChannel; subject: string; body: string; action: "send" | "log" }
  ) => Promise<void>;
  onRecordReply: (
    leadId: string,
    params: { channel: OutreachChannel; body: string; classification: "positive" | "neutral" | "negative" | "unsubscribe" }
  ) => Promise<void>;
  onRefresh: () => void;
};

export function OutreachInboxView({
  leads,
  onSendOutreach,
  onRecordReply,
  onRefresh,
}: OutreachInboxViewProps) {
  const [selectedLeadId, setSelectedLeadId] = useState<string>(leads[0]?.id || "");
  const [channel, setChannel] = useState<OutreachChannel>("email");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Reply simulation state
  const [replyBody, setReplyBody] = useState("");
  const [replyClassification, setReplyClassification] = useState<"positive" | "neutral" | "negative" | "unsubscribe">("positive");
  const [isRecordingReply, setIsRecordingReply] = useState(false);

  const activeLead = leads.find((l) => l.id === selectedLeadId) || leads[0];

  const handleSend = async (action: "send" | "log") => {
    if (!activeLead || !body) return;
    setIsSending(true);
    try {
      await onSendOutreach(activeLead.id, {
        channel,
        subject: subject || `Patient Inquiries & Appointment Booking for ${activeLead.companyName}`,
        body,
        action,
      });
      setBody("");
      setSubject("");
      onRefresh();
    } finally {
      setIsSending(false);
    }
  };

  const handleReply = async () => {
    if (!activeLead || !replyBody) return;
    setIsRecordingReply(true);
    try {
      await onRecordReply(activeLead.id, {
        channel,
        body: replyBody,
        classification: replyClassification,
      });
      setReplyBody("");
      onRefresh();
    } finally {
      setIsRecordingReply(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <span>💬</span> Outreach & Conversation Management
          </h2>
          <p className="text-xs text-gray-400">
            Draft, approve, dispatch outreach and record authenticated prospect replies with automated CRM status progression
          </p>
        </div>
      </div>

      {/* Main 3-column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Lead Selector */}
        <div className="lg:col-span-4 bg-gray-950 border border-gray-800 rounded-xl p-3 flex flex-col gap-2 max-h-[70vh] overflow-y-auto">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 py-1 font-mono">
            Leads for Outreach ({leads.length})
          </h3>
          {leads.length === 0 ? (
            <div className="p-4 text-center text-xs text-gray-500">No leads available</div>
          ) : (
            leads.map((l) => (
              <button
                key={l.id}
                onClick={() => setSelectedLeadId(l.id)}
                className={`p-3 rounded-lg text-left transition-all border ${
                  activeLead?.id === l.id
                    ? "bg-indigo-950/40 border-indigo-500/60 shadow-sm"
                    : "bg-gray-900/40 border-gray-800/80 hover:border-gray-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-white line-clamp-1">{l.companyName}</span>
                  <span className="text-[10px] font-mono text-indigo-400 uppercase">{l.stage}</span>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  📍 {l.city} • Score: {l.qualificationScore}/100
                </p>
              </button>
            ))
          )}
        </div>

        {/* Center: Compose Outreach & Thread */}
        <div className="lg:col-span-5 bg-gray-950 border border-gray-800 rounded-xl p-4 flex flex-col gap-3">
          <div className="border-b border-gray-800 pb-2">
            <h3 className="text-sm font-semibold text-white">
              {activeLead ? activeLead.companyName : "Select a Lead"}
            </h3>
            <p className="text-xs text-gray-400">
              Stage: <span className="font-semibold text-indigo-400 uppercase">{activeLead?.stage}</span>
            </p>
          </div>

          {/* Compose Form */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-400">Channel:</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as OutreachChannel)}
                className="bg-gray-900 border border-gray-800 text-xs text-gray-200 rounded px-2 py-1 focus:outline-none"
              >
                <option value="email">📧 Email</option>
                <option value="linkedin">💼 LinkedIn</option>
                <option value="phone">📞 Phone / Call</option>
                <option value="whatsapp">📱 WhatsApp</option>
                <option value="manual">📝 Manual Outreach</option>
              </select>
            </div>

            {channel === "email" && (
              <input
                type="text"
                placeholder="Subject Line"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
            )}

            <textarea
              rows={6}
              placeholder={`Write personalized ${channel} outreach message...`}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="px-3 py-2 rounded-lg bg-gray-900 border border-gray-800 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 leading-relaxed font-sans"
            />

            <div className="flex items-center justify-between pt-1">
              <button
                disabled={!body || isSending}
                onClick={() => handleSend("log")}
                className="px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 text-xs font-medium transition-colors disabled:opacity-40"
              >
                Log Past Message
              </button>
              <button
                disabled={!body || isSending}
                onClick={() => handleSend("send")}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 text-xs font-semibold shadow-sm shadow-indigo-600/30 transition-all disabled:opacity-40 flex items-center gap-1.5"
              >
                <span>🚀</span> {isSending ? "Sending..." : "Dispatch Outreach"}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Record Inbound Reply */}
        <div className="lg:col-span-3 bg-gray-950 border border-gray-800 rounded-xl p-4 flex flex-col gap-3">
          <div className="border-b border-gray-800 pb-2">
            <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider font-mono">
              Inbound Reply Logging
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Record prospect responses with verified classification
            </p>
          </div>

          <div className="flex flex-col gap-2 text-xs">
            <label className="text-gray-400">Response Classification:</label>
            <select
              value={replyClassification}
              onChange={(e) =>
                setReplyClassification(e.target.value as "positive" | "neutral" | "negative" | "unsubscribe")
              }
              className="bg-gray-900 border border-gray-800 text-xs text-gray-200 rounded px-2 py-1.5 focus:outline-none"
            >
              <option value="positive">🟢 Positive (Wants Demo / Meeting)</option>
              <option value="neutral">⚪ Neutral / Question</option>
              <option value="negative">🔴 Objection / Not Interested</option>
              <option value="unsubscribe">⛔ Unsubscribe / Opt-Out</option>
            </select>

            <label className="text-gray-400 mt-1">Reply Excerpt / Text:</label>
            <textarea
              rows={4}
              placeholder="Paste exact prospect reply..."
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            />

            <button
              disabled={!replyBody || isRecordingReply}
              onClick={handleReply}
              className="mt-2 w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors disabled:opacity-40 shadow-sm shadow-emerald-600/30"
            >
              {isRecordingReply ? "Recording..." : "Record Inbound Reply"}
            </button>

            <div className="p-2.5 rounded-lg bg-gray-900/60 border border-gray-800/80 text-[10px] text-gray-400 flex flex-col gap-1 mt-2">
              <p className="font-semibold text-gray-300">⚡ Automated Reply Effects:</p>
              <p>• Positive reply advances stage to <span className="text-indigo-400">ENGAGED</span></p>
              <p>• Automatically pauses pending follow-up sequences</p>
              <p>• Unsubscribe suppresses contact and disqualifies lead</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
