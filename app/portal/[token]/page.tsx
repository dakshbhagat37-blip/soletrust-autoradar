"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import type {
  ClientRelationship,
  ClientProject,
  InvoiceRecord,
  ClientPortalSession,
} from "../../../server/db/schema.ts";

export default function ClientPortalPage() {
  const params = useParams();
  const token = params?.token as string;

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<ClientPortalSession | null>(null);
  const [client, setClient] = useState<ClientRelationship | null>(null);
  const [project, setProject] = useState<ClientProject | null>(null);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [signerName, setSignerName] = useState("");
  const [signedSuccess, setSignedSuccess] = useState(false);
  const [feedbackNote, setFeedbackNote] = useState("");
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const fetchPortalData = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/portal/${token}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setSession(json.data.session);
          setClient(json.data.client);
          setProject(json.data.project);
          setInvoices(json.data.invoices || []);
          setSignedSuccess(json.data.session?.contractSigned || false);
        }
      }
    } catch (err) {
      console.error("Portal fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!ignore) {
        await fetchPortalData();
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [fetchPortalData]);

  const handleSignContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signerName.trim() || !session) return;

    try {
      const res = await fetch(`/api/portal/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sign_contract",
          signerName: signerName.trim(),
        }),
      });
      if (res.ok) {
        setSignedSuccess(true);
        setActionMsg(`SOW Agreement legally e-signed by ${signerName.trim()}.`);
        await fetchPortalData();
      }
    } catch (err) {
      console.error("Contract sign error:", err);
    }
  };

  const handleApproveDeliverable = async (deliverableId: string) => {
    if (!project) return;
    try {
      const res = await fetch(`/api/portal/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve_deliverable",
          projectId: project.id,
          deliverableId,
          approvedBy: client?.primaryContactName || "Client Authorizer",
          feedback: feedbackNote || "Approved via Client Portal",
        }),
      });
      if (res.ok) {
        setActionMsg("Deliverable approved. Project milestone updated.");
        setFeedbackNote("");
        await fetchPortalData();
      }
    } catch (err) {
      console.error("Approve deliverable error:", err);
    }
  };

  const handlePayInvoice = async (invoiceId: string, amountCents: number) => {
    try {
      const res = await fetch(`/api/portal/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "pay_invoice",
          invoiceId,
          amountCents,
        }),
      });
      if (res.ok) {
        setActionMsg("Payment settled successfully. Receipt generated.");
        await fetchPortalData();
      }
    } catch (err) {
      console.error("Pay invoice error:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-xs text-gray-400 font-mono">
            Verifying secure passwordless portal token...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Portal Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gray-900/90 border border-indigo-500/30 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-indigo-500/20">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">
                  {client?.companyName || "Client"} — Executive Collaboration Portal
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Verified Portal Access
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Review deliverables, e-sign agreements, and settle milestone invoices securely.
              </p>
            </div>
          </div>

          <div className="text-right text-xs text-gray-400 font-mono">
            Session: <span className="text-indigo-400">{token ? `${token.slice(0, 16)}...` : ""}</span>
          </div>
        </header>

        {/* Action Message Feedback */}
        {actionMsg && (
          <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-between">
            <span>✓ {actionMsg}</span>
            <button
              onClick={() => setActionMsg(null)}
              className="text-emerald-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        {/* Section 1: Statement of Work (SOW) E-Signing */}
        <div className="p-6 rounded-2xl bg-gray-900/60 border border-gray-800 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>✍️</span> Commercial Service Agreement &amp; SOW Contract
            </h2>
            <span
              className={`text-xs font-mono px-2.5 py-0.5 rounded-full ${
                signedSuccess
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              }`}
            >
              {signedSuccess ? "✓ Legally E-Signed" : "Pending Signature"}
            </span>
          </div>

          <p className="text-xs text-gray-300 leading-relaxed">
            Please review the scope of work and milestones. By providing your authorized full legal name below, you execute this agreement electronically under the applicable governing jurisdiction laws.
          </p>

          {signedSuccess ? (
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-200 flex items-center justify-between">
              <div>
                <span className="font-bold">E-Signed by:</span> {session?.contractSignerName || client?.primaryContactName}<br />
                <span className="text-[11px] text-emerald-400">Timestamp: {session?.contractSignedAt ? new Date(session.contractSignedAt).toLocaleString() : "Verified"}</span>
              </div>
              <span className="text-2xl">🔒</span>
            </div>
          ) : (
            <form onSubmit={handleSignContract} className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <input
                type="text"
                placeholder="Type your Full Legal Name to E-Sign..."
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                required
                className="flex-1 w-full px-4 py-2 bg-gray-950 border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
              >
                E-Sign Agreement
              </button>
            </form>
          )}
        </div>

        {/* Section 2: Deliverables & Approval */}
        {project && (
          <div className="p-6 rounded-2xl bg-gray-900/60 border border-gray-800 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>🚀</span> Project Deliverables &amp; Approval
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Review and sign off on project phases to authorize subsequent milestone releases.
                </p>
              </div>
              <span className="text-xs font-mono text-cyan-300 font-bold">
                {project.progressPercent}% Complete
              </span>
            </div>

            <div className="space-y-3">
              {project.milestones.map((m) => (
                <div key={m.id} className="p-4 rounded-xl bg-gray-950/70 border border-gray-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-300">
                      Phase {m.phaseNumber}: {m.title}
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                      {project.currency} {(m.allocatedValueCents / 100).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs text-gray-400">{m.description}</p>

                  {m.deliverables.map((d) => (
                    <div
                      key={d.id}
                      className="p-3 rounded-lg bg-gray-900 border border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-semibold text-white">{d.title}</div>
                        <div className="text-[11px] text-gray-400">{d.description}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        {d.status === "approved" ? (
                          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-semibold">
                            ✓ Approved by {d.approvedBy || "Client"}
                          </span>
                        ) : (
                          <button
                            onClick={() => handleApproveDeliverable(d.id)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow transition cursor-pointer"
                          >
                            Approve Deliverable
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 3: Invoices & Online Payment */}
        <div className="p-6 rounded-2xl bg-gray-900/60 border border-gray-800 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>💳</span> Milestone Invoices &amp; Settlements
            </h2>
            <span className="text-xs text-gray-400">Net 14 Days Payment Terms</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 uppercase text-[10px]">
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">Due Date</th>
                  <th className="py-2.5 px-3 text-right">Amount Due</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-gray-300">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-500 italic">
                      No invoices currently outstanding.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="py-3 px-3 font-mono font-medium text-white">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 px-3 text-gray-400">
                        {new Date(inv.dueDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                        {inv.currency} {(inv.balanceDueCents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-semibold ${
                            inv.status === "paid"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {inv.status !== "paid" ? (
                          <button
                            onClick={() => handlePayInvoice(inv.id, inv.balanceDueCents)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold shadow transition cursor-pointer"
                          >
                            Pay Now ➔
                          </button>
                        ) : (
                          <span className="text-emerald-400 font-bold">✓ Settled</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
