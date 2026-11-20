"use client";

import React, { useState, useEffect } from "react";
import type { StudioSettings } from "../lib/dispatch/types.ts";
import { DEFAULT_STUDIO_SETTINGS } from "../lib/dispatch/types.ts";

interface StudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (settings: StudioSettings) => void;
}

export function StudioSettingsModal({ isOpen, onClose, onSaved }: StudioSettingsModalProps) {
  const [settings, setSettings] = useState<StudioSettings>(DEFAULT_STUDIO_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookTestStatus, setWebhookTestStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let isCancelled = false;
    fetch("/api/crm/settings")
      .then((res) => res.json())
      .then((data) => {
        if (!isCancelled && data.success && data.data) {
          setSettings(data.data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/crm/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccessMsg(true);
        onSaved?.(data.data);
        setTimeout(() => setSaveSuccessMsg(false), 2500);
      }
    } catch {
      // Save error
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!settings.webhookUrl) return;
    setIsTestingWebhook(true);
    setWebhookTestStatus(null);
    try {
      const res = await fetch("/api/crm/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test_webhook",
          webhookUrl: settings.webhookUrl,
          webhookAuthHeader: settings.webhookAuthHeader,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setWebhookTestStatus(data.data);
      } else {
        setWebhookTestStatus({ success: false, message: data.error?.message || "Test ping failed" });
      }
    } catch (err) {
      setWebhookTestStatus({ success: false, message: (err as Error).message });
    } finally {
      setIsTestingWebhook(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl flex flex-col rounded-3xl border border-gray-800 bg-gray-950 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-800 bg-gray-900/40 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">Studio & Dispatch Settings</h2>
                <span className="text-[10px] font-mono tracking-widest uppercase bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30">
                  v3.0 Control Hub
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Configure your agency branding, default legal contract terms, and outbound sequencer webhook sync.
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

        {/* Body Form */}
        <form onSubmit={handleSave} className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-gray-400">Loading settings...</div>
          ) : (
            <>
              {/* Studio Branding & Credentials */}
              <div className="space-y-4">
                <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-1.5">
                  <span>🏢</span> Studio Branding & Legal Identity
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Company / Studio Legal Name</label>
                    <input
                      type="text"
                      value={settings.studioName}
                      onChange={(e) => setSettings({ ...settings, studioName: e.target.value })}
                      className="w-full rounded-xl border border-gray-700 bg-gray-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Contact Email</label>
                    <input
                      type="email"
                      value={settings.contactEmail}
                      onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                      className="w-full rounded-xl border border-gray-700 bg-gray-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Default Currency</label>
                    <select
                      value={settings.defaultCurrency}
                      onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value as StudioSettings["defaultCurrency"] })}
                      className="w-full rounded-xl border border-gray-700 bg-gray-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none cursor-pointer"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="AUD">AUD (A$)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="INR">INR (₹)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-300 mb-1">Governing Jurisdiction (Contracts)</label>
                    <input
                      type="text"
                      value={settings.governingJurisdiction}
                      onChange={(e) => setSettings({ ...settings, governingJurisdiction: e.target.value })}
                      placeholder="e.g. State of Victoria, Australia or State of Delaware, USA"
                      className="w-full rounded-xl border border-gray-700 bg-gray-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Default Agreement Payment Terms</label>
                  <input
                    type="text"
                    value={settings.paymentTerms}
                    onChange={(e) => setSettings({ ...settings, paymentTerms: e.target.value })}
                    placeholder="e.g. 50% upfront deposit upon signing, 50% upon final deliverable"
                    className="w-full rounded-xl border border-gray-700 bg-gray-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">Pre-filled automatically into every generated SOW & service contract.</p>
                </div>
              </div>

              {/* Webhook Dispatch & Sequencer Integration */}
              <div className="pt-4 border-t border-gray-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
                    <span>📡</span> Outbound Sequencer & Webhook Dispatch
                  </h3>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
                    <input
                      type="checkbox"
                      checked={settings.webhookEnabled}
                      onChange={(e) => setSettings({ ...settings, webhookEnabled: e.target.checked })}
                      className="rounded border-gray-700 text-emerald-500 focus:ring-0"
                    />
                    <span>Enable Auto-Dispatch</span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Webhook URL (Instantly / Smartlead / Make / Zapier)</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={settings.webhookUrl || ""}
                      onChange={(e) => setSettings({ ...settings, webhookUrl: e.target.value })}
                      placeholder="https://api.instantly.ai/v1/webhook or https://hook.eu1.make.com/..."
                      className="flex-1 rounded-xl border border-gray-700 bg-gray-900 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={isTestingWebhook || !settings.webhookUrl}
                      onClick={handleTestWebhook}
                      className="px-3 py-2 rounded-xl border border-emerald-500/40 bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-300 text-xs font-semibold disabled:opacity-50 transition cursor-pointer"
                    >
                      {isTestingWebhook ? "Pinging..." : "⚡ Test Ping"}
                    </button>
                  </div>

                  {webhookTestStatus && (
                    <div className={`mt-2 p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                      webhookTestStatus.success
                        ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                        : "bg-red-950/40 border-red-500/40 text-red-300"
                    }`}>
                      <span>{webhookTestStatus.success ? "✓" : "⚠"}</span>
                      <span>{webhookTestStatus.message}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Optional Auth Header</label>
                  <input
                    type="text"
                    value={settings.webhookAuthHeader || ""}
                    onChange={(e) => setSettings({ ...settings, webhookAuthHeader: e.target.value })}
                    placeholder="Bearer eyJhbGciOi..."
                    className="w-full rounded-xl border border-gray-700 bg-gray-900 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-gray-800 flex items-center justify-between">
            {saveSuccessMsg ? (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <span>✓</span> Settings saved successfully!
              </span>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 transition cursor-pointer disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
