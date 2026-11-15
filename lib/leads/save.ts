import type { DiscoveredCompany } from "@/lib/discovery/types";
import { qualifyCompany, type QualificationContext } from "@/lib/qualification";
import { isSupabaseServerConfigured, createSupabaseServerClient } from "@/lib/supabase/server";
import { findExistingLead, type LeadDedupeRecord } from "./dedupe";
import { logger } from "@/lib/logging/logger";

export class DatabaseError extends Error {
  constructor(message = "Database error") {
    super(message);
    this.name = "DatabaseError";
  }
}

export type SavedLead = {
  id: string;
  companyName: string;
  website: string | null;
  industry: string | null;
  city: string | null;
  country: string | null;
  employeeRange: string | null;
  serviceTrack: string | null;
  score: number | null;
  status: string;
  source: string | null;
};

export type SaveDiscoveredCompaniesResult = {
  inserted: SavedLead[];
  duplicates: SavedLead[];
  leads: SavedLead[];
};

const LEAD_SELECT =
  "id, company_name, website, industry, city, country, employee_range, service_track, score, status, source";

// In-memory fallback for offline/development mode when Supabase is not configured
const inMemoryLeads: LeadDedupeRecord[] = [];

function toSavedLead(row: LeadDedupeRecord): SavedLead {
  return {
    id: row.id,
    companyName: row.company_name,
    website: row.website,
    industry: row.industry,
    city: row.city,
    country: row.country,
    employeeRange: row.employee_range,
    serviceTrack: row.service_track,
    score: row.score,
    status: row.status ?? "new",
    source: row.source,
  };
}

function developmentNotes(source: string): string | null {
  return source === "mock"
    ? "Development/test data from the mock discovery provider. Not a real prospect."
    : null;
}

export async function saveDiscoveredCompanies(
  companies: DiscoveredCompany[],
  context: QualificationContext,
): Promise<SaveDiscoveredCompaniesResult> {
  const isConfigured = isSupabaseServerConfigured();

  let existingLeads: LeadDedupeRecord[] = [];

  if (isConfigured) {
    try {
      const supabase = createSupabaseServerClient();
      const names = companies.map((c) => c.companyName.trim()).filter((n) => n.length > 0);

      // Targeted query instead of unbounded full table scan
      const existingResult = await supabase
        .from("leads")
        .select(LEAD_SELECT)
        .in("company_name", names)
        .limit(100);

      if (!existingResult.error && existingResult.data) {
        existingLeads = existingResult.data as LeadDedupeRecord[];
      }
    } catch (err) {
      logger.warn("Database lookup failed, falling back to local deduplication", {
        context: "saveDiscoveredCompanies",
        error: err,
      });
    }
  } else {
    existingLeads = [...inMemoryLeads];
  }

  const inserted: SavedLead[] = [];
  const duplicates: SavedLead[] = [];
  const leads: SavedLead[] = [];

  for (const company of companies) {
    const match = findExistingLead(company, existingLeads);
    if (match) {
      const saved = toSavedLead(match);
      duplicates.push(saved);
      leads.push(saved);
      continue;
    }

    const qualification = qualifyCompany(company, context);

    if (isConfigured) {
      try {
        const supabase = createSupabaseServerClient();
        const insertResult = await supabase
          .from("leads")
          .insert({
            company_name: company.companyName,
            website: company.website,
            industry: company.industry,
            country: company.country,
            city: company.city,
            employee_range: company.employeeRange,
            service_track: context.requestedServiceTrack,
            score: qualification.score,
            status: qualification.status,
            source: company.source,
            source_url: company.sourceUrl,
            score_reason: qualification.reasons.join("; "),
            notes: developmentNotes(company.source),
          })
          .select(LEAD_SELECT)
          .single();

        if (insertResult.data) {
          const row = insertResult.data as LeadDedupeRecord;
          existingLeads.push(row);
          const saved = toSavedLead(row);
          inserted.push(saved);
          leads.push(saved);
          continue;
        }
      } catch (err) {
        logger.warn("Supabase lead insert failed, recording in local store", {
          context: "saveDiscoveredCompanies",
          data: { company: company.companyName },
          error: err,
        });
      }
    }

    // Fallback in-memory lead record
    const mockRow: LeadDedupeRecord = {
      id: crypto.randomUUID(),
      company_name: company.companyName,
      website: company.website,
      industry: company.industry,
      country: company.country,
      city: company.city,
      employee_range: company.employeeRange,
      service_track: context.requestedServiceTrack || null,
      score: qualification.score,
      status: qualification.status,
      source: company.source,
    };

    inMemoryLeads.push(mockRow);
    existingLeads.push(mockRow);
    const saved = toSavedLead(mockRow);
    inserted.push(saved);
    leads.push(saved);
  }

  return { inserted, duplicates, leads };
}
