import type { Business } from "../types/business.ts";
import type { WebsiteIntelligence } from "../intelligence/types.ts";
import type { QualificationContext, ServiceFitResult, ServiceFitSignal } from "./types.ts";

/**
 * Evaluates prospect fit for SoleTrust Media's Creative + Technical services.
 * Note: Sub-optimal existing digital presence is scored positively as an "Opportunity Signal".
 */
export function evaluateServiceFit(
  business: Business,
  intelligence?: WebsiteIntelligence | null,
  context?: QualificationContext
): ServiceFitResult {
  const serviceTrack = (context?.requestedServiceTrack || business.serviceTrack || "creative+technical").toLowerCase();
  const signals: ServiceFitSignal[] = [];
  const reasons: string[] = [];
  let score = 30; // Baseline opportunity score for active business

  // 1. Technical Opportunity Signals
  if (serviceTrack.includes("technical") || serviceTrack.includes("both")) {
    // Missing HTTPS
    if (intelligence?.hasHttps === false || (business.website && !business.website.startsWith("https://"))) {
      signals.push({
        id: "no_https",
        label: "Lacks HTTPS Security",
        points: 20,
        type: "opportunity",
        evidenceText: "Official website is served over unencrypted HTTP.",
      });
      score += 20;
      reasons.push("Technical Opportunity: Website lacks HTTPS encryption (+20).");
    }

    // Missing SEO Title or Description
    if (intelligence?.signals.includes("missing_title") || !intelligence?.title) {
      signals.push({
        id: "missing_title",
        label: "Missing Page Title",
        points: 10,
        type: "opportunity",
        evidenceText: "Website does not expose a clear SEO title tag.",
      });
      score += 10;
      reasons.push("Technical Opportunity: Missing SEO title tag (+10).");
    }

    if (intelligence?.signals.includes("missing_meta_description") || !intelligence?.description) {
      signals.push({
        id: "missing_meta_desc",
        label: "Missing Meta Description",
        points: 10,
        type: "opportunity",
        evidenceText: "Website lacks meta description tag for search engines.",
      });
      score += 10;
      reasons.push("Technical Opportunity: Missing meta description tag (+10).");
    }
  }

  // 2. Creative & Conversion Opportunity Signals
  if (serviceTrack.includes("creative") || serviceTrack.includes("both")) {
    // Lacks Online Booking / Call To Action
    if (intelligence && !intelligence.hasCallToAction) {
      signals.push({
        id: "weak_cta",
        label: "No Online Booking CTA",
        points: 20,
        type: "opportunity",
        evidenceText: "No appointment booking CTA or conversion widgets detected on homepage.",
      });
      score += 20;
      reasons.push("Creative Opportunity: No online consultation or booking CTA (+20).");
    }

    // Missing Social Media Presence
    if (intelligence && intelligence.socialLinks.length === 0) {
      signals.push({
        id: "missing_social",
        label: "Lacks Connected Social Links",
        points: 10,
        type: "opportunity",
        evidenceText: "No linked Instagram, Facebook, or LinkedIn profiles on website.",
      });
      score += 10;
      reasons.push("Creative Opportunity: No social media profiles linked (+10).");
    }

    // Sparse Content
    if (intelligence && intelligence.links.length < 5) {
      signals.push({
        id: "sparse_website",
        label: "Sparse Website Content",
        points: 10,
        type: "opportunity",
        evidenceText: "Website has minimal subpages and limited marketing content.",
      });
      score += 10;
      reasons.push("Creative Opportunity: Minimal web content structure (+10).");
    }
  }

  // 3. Business Readiness & Commercial Viability
  // Established local practice with team/doctors is able to invest in professional digital services
  const hasDoctorsOrTeam =
    (business.decisionMakers && business.decisionMakers.length > 0) ||
    intelligence?.hasTeamPage;

  if (hasDoctorsOrTeam) {
    signals.push({
      id: "established_practice",
      label: "Established Practice / Medical Leadership",
      points: 15,
      type: "readiness",
      evidenceText: "Practice features dedicated doctors/leadership with commercial viability.",
    });
    score += 15;
    reasons.push("Readiness: Identified medical leadership indicates commercial viability (+15).");
  }

  // Active phone lines and physical clinic address indicate a real operating business
  if (business.address && business.contacts && business.contacts.length > 0) {
    signals.push({
      id: "active_operation",
      label: "Active Local Operation",
      points: 10,
      type: "readiness",
      evidenceText: "Physical clinic premises and operating telephone lines verified.",
    });
    score += 10;
    reasons.push("Readiness: Verified physical address and active communication channels (+10).");
  }

  const clampedScore = Math.min(100, Math.max(0, score));

  return {
    score: clampedScore,
    signals,
    reasons,
  };
}

