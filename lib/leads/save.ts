import type { DiscoveredCompany } from "@/lib/discovery/types";
import { qualifyCompany, type QualificationContext } from "@/lib/qualification";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { findExistingLead, type LeadDedupeRecord } from "./dedupe";

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
  let supabase;
  try {
    supabase = createSupabaseServerClient();
  } catch {
    console.error("leads save failed: server database client is not configured");
    throw new DatabaseError();
  }

  const existingResult = await supabase.from("leads").select(LEAD_SELECT);
  if (existingResult.error) {
    console.error("leads select failed", existingResult.error.code);
    throw new DatabaseError();
  }

  const existingLeads = (existingResult.data ?? []) as LeadDedupeRecord[];
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

    if (insertResult.error || !insertResult.data) {
      console.error("leads insert failed", insertResult.error?.code);
      throw new DatabaseError();
    }

    const row = insertResult.data as LeadDedupeRecord;
    existingLeads.push(row);
    const saved = toSavedLead(row);
    inserted.push(saved);
    leads.push(saved);
  }

  return { inserted, duplicates, leads };
}
