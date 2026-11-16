"use client";

import React, { useState } from "react";

export type SearchFormData = {
  industry: string;
  city: string;
  country: string;
  limit: number;
  serviceTrack: string;
  provider: "waterfall" | "overpass" | "searxng" | "mock";
};

type SearchFormProps = {
  onSubmit: (data: SearchFormData) => void;
  isLoading: boolean;
};

const PRESETS = [
  { label: "Vadodara (Dermatology)", industry: "Dermatology clinics", city: "Vadodara", country: "India" },
  { label: "Ahmedabad (Dermatology)", industry: "Dermatology clinics", city: "Ahmedabad", country: "India" },
  { label: "Surat (Dermatology)", industry: "Dermatology clinics", city: "Surat", country: "India" },
  { label: "Jaipur (Dental)", industry: "Dental clinics", city: "Jaipur", country: "India" },
  { label: "Jammu (Hospitals)", industry: "Hospitals", city: "Jammu", country: "India" },
  { label: "Delhi (Automotive)", industry: "Automotive dealerships", city: "Delhi", country: "India" },
];

export function SearchForm({ onSubmit, isLoading }: SearchFormProps) {
  const [formData, setFormData] = useState<SearchFormData>({
    industry: "Dermatology clinics",
    city: "Vadodara",
    country: "India",
    limit: 10,
    serviceTrack: "creative+technical",
    provider: "waterfall",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/70 p-6 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-base font-semibold text-white">Prospecting Search Parameters</h2>
          <p className="text-xs text-gray-400">Configure target industry, location, and intelligence filters.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-500">Quick Presets:</span>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    industry: p.industry,
                    city: p.city,
                    country: p.country,
                  }))
                }
                className={`text-[11px] px-2 py-0.5 rounded-md border transition ${
                  formData.city.toLowerCase() === p.city.toLowerCase() &&
                  formData.industry.toLowerCase() === p.industry.toLowerCase()
                    ? "bg-indigo-600/30 border-indigo-500 text-indigo-200"
                    : "border-gray-800 bg-gray-950/60 text-gray-400 hover:text-gray-200 hover:border-gray-700"
                }`}
              >
                {p.city}
              </button>
            ))}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Industry */}
          <div>
            <label htmlFor="industry-input" className="block text-xs font-medium text-gray-300 mb-1.5">
              Target Industry / Sector
            </label>
            <input
              id="industry-input"
              type="text"
              required
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              placeholder="e.g. Dermatology clinics, Dental"
              className="w-full rounded-xl border border-gray-700 bg-gray-950 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
            />
          </div>

          {/* City */}
          <div>
            <label htmlFor="city-input" className="block text-xs font-medium text-gray-300 mb-1.5">
              City / Metropolitan Area
            </label>
            <input
              id="city-input"
              type="text"
              required
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="e.g. Vadodara, Ahmedabad, Mumbai"
              className="w-full rounded-xl border border-gray-700 bg-gray-950 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
            />
          </div>

          {/* Country */}
          <div>
            <label htmlFor="country-input" className="block text-xs font-medium text-gray-300 mb-1.5">
              Country
            </label>
            <input
              id="country-input"
              type="text"
              required
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              placeholder="e.g. India, United States"
              className="w-full rounded-xl border border-gray-700 bg-gray-950 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
            />
          </div>

          {/* Target Leads */}
          <div>
            <label htmlFor="limit-select" className="block text-xs font-medium text-gray-300 mb-1.5">
              Target Lead Quota
            </label>
            <select
              id="limit-select"
              value={formData.limit}
              onChange={(e) => setFormData({ ...formData, limit: Number(e.target.value) })}
              className="w-full rounded-xl border border-gray-700 bg-gray-950 px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
            >
              <option value={5}>5 Verified Leads</option>
              <option value={10}>10 Verified Leads (Standard)</option>
              <option value={20}>20 Verified Leads</option>
              <option value={30}>30 Verified Leads</option>
            </select>
          </div>

          {/* Service Track */}
          <div>
            <label htmlFor="track-select" className="block text-xs font-medium text-gray-300 mb-1.5">
              SoleTrust Service Track
            </label>
            <select
              id="track-select"
              value={formData.serviceTrack}
              onChange={(e) => setFormData({ ...formData, serviceTrack: e.target.value })}
              className="w-full rounded-xl border border-gray-700 bg-gray-950 px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
            >
              <option value="creative+technical">Creative + Technical (Full Stack)</option>
              <option value="technical">Technical Only (Web, SEO, Booking)</option>
              <option value="creative">Creative Only (Branding, Media, Design)</option>
            </select>
          </div>

          {/* Provider Selection */}
          <div>
            <label htmlFor="provider-select" className="block text-xs font-medium text-gray-300 mb-1.5">
              Discovery Engine Strategy
            </label>
            <select
              id="provider-select"
              value={formData.provider}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value as SearchFormData["provider"] })}
              className="w-full rounded-xl border border-gray-700 bg-gray-950 px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition font-mono text-xs"
            >
              <option value="waterfall">AutoRadar Waterfall (Overpass &rarr; SearXNG &rarr; Mock)</option>
              <option value="overpass">OpenStreetMap / Overpass Direct</option>
              <option value="searxng">SearXNG Self-Hosted Direct</option>
              <option value="mock">Mock Offline Deterministic Provider</option>
            </select>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition cursor-pointer"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Executing Intelligence Pipeline...</span>
              </>
            ) : (
              <>
                <span>Launch AutoRadar Intelligence</span>
                <span className="font-mono text-xs opacity-75">&rarr;</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

