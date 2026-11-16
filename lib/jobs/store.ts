import type { SearchJob, SearchJobQuery, SearchStage } from "../types/search-job.ts";
import type { Business } from "../types/business.ts";
import { isSupabaseServerConfigured, createSupabaseServerClient } from "../supabase/server.ts";
import { logger } from "../logging/logger.ts";
import { loadJsonFromFile, saveJsonToFile } from "../persistence/file-store.ts";

type PersistedJobsData = {
  jobs: Record<string, SearchJob>;
  businesses: Record<string, Business>;
  jobBusinesses: Record<string, string[]>;
};

const INITIAL_DATA: PersistedJobsData = {
  jobs: {},
  businesses: {},
  jobBusinesses: {},
};

// Hydrate from persistent disk store if available
const loadedData = loadJsonFromFile<PersistedJobsData>("jobs-store.json", INITIAL_DATA);

const inMemoryJobs = new Map<string, SearchJob>(Object.entries(loadedData.jobs || {}));
const inMemoryBusinesses = new Map<string, Business>(Object.entries(loadedData.businesses || {}));
const inMemoryJobBusinesses = new Map<string, string[]>(Object.entries(loadedData.jobBusinesses || {}));

function persistJobsData() {
  const data: PersistedJobsData = {
    jobs: Object.fromEntries(inMemoryJobs.entries()),
    businesses: Object.fromEntries(inMemoryBusinesses.entries()),
    jobBusinesses: Object.fromEntries(inMemoryJobBusinesses.entries()),
  };
  saveJsonToFile("jobs-store.json", data);
}

export function saveJobBusinesses(jobId: string, businesses: Business[]): void {
  const ids: string[] = [];
  for (const b of businesses) {
    b.searchJobId = jobId;
    inMemoryBusinesses.set(b.id, b);
    ids.push(b.id);
  }
  inMemoryJobBusinesses.set(jobId, ids);
  persistJobsData();
}

export function getJobBusinesses(jobId: string): Business[] {
  const ids = inMemoryJobBusinesses.get(jobId);
  if (!ids) return [];
  return ids.map((id) => inMemoryBusinesses.get(id)).filter(Boolean) as Business[];
}

export function getBusinessById(id: string): Business | null {
  return inMemoryBusinesses.get(id) || null;
}

export function saveBusiness(business: Business): Business {
  inMemoryBusinesses.set(business.id, business);
  persistJobsData();
  return business;
}

export function getAllBusinesses(): Business[] {
  return Array.from(inMemoryBusinesses.values());
}

export function findExistingActiveJob(query: SearchJobQuery): SearchJob | null {
  for (const job of inMemoryJobs.values()) {
    const isActive =
      job.status === "pending" ||
      job.status === "discovering" ||
      job.status === "verifying" ||
      job.status === "enriching";

    if (
      isActive &&
      job.query.industry.toLowerCase().trim() === query.industry.toLowerCase().trim() &&
      job.query.city.toLowerCase().trim() === query.city.toLowerCase().trim() &&
      job.query.country.toLowerCase().trim() === query.country.toLowerCase().trim()
    ) {
      return job;
    }
  }
  return null;
}

export function createInitialSearchJob(query: SearchJobQuery): SearchJob {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const job: SearchJob = {
    id,
    query,
    status: "pending",
    progress: 0,
    currentStage: "queued",
    stageStats: {
      candidatesFound: 0,
      uniqueBusinesses: 0,
      identityVerified: 0,
      industryVerified: 0,
      locationVerified: 0,
      officialWebsitesFound: 0,
      businessContactsFound: 0,
      decisionMakersFound: 0,
      decisionMakersVerified: 0,
      qualifiedLeads: 0,
      rejectedLeads: 0,
    },
    startedAt: now,
    createdAt: now,
    updatedAt: now,
  };

  inMemoryJobs.set(id, job);
  persistJobsData();
  return job;
}

export async function saveSearchJob(job: SearchJob): Promise<SearchJob> {
  job.updatedAt = new Date().toISOString();
  inMemoryJobs.set(job.id, job);
  persistJobsData();

  if (!isSupabaseServerConfigured()) {
    return job;
  }

  try {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.from("search_jobs").upsert({
      id: job.id,
      industry: job.query.industry,
      city: job.query.city,
      region: job.query.region ?? null,
      country: job.query.country,
      service_track: job.query.serviceTrack ?? "general",
      requested_limit: job.query.limit,
      status: job.status,
      progress: job.progress,
      current_stage: job.currentStage,
      stage_stats: job.stageStats,
      error_message: job.errorMessage ?? null,
      started_at: job.startedAt,
      completed_at: job.completedAt ?? null,
      updated_at: job.updatedAt,
    });

    if (error) {
      logger.warn("Failed to persist search job to Supabase, retained in memory and local file", {
        context: "saveSearchJob",
        searchJobId: job.id,
        error,
      });
    }
  } catch (err) {
    logger.warn("Supabase upsert error, falling back to local persistent store", {
      context: "saveSearchJob",
      searchJobId: job.id,
      error: err,
    });
  }

  return job;
}

export async function getSearchJob(id: string): Promise<SearchJob | null> {
  const cached = inMemoryJobs.get(id);
  if (cached) {
    return cached;
  }

  if (!isSupabaseServerConfigured()) {
    return null;
  }

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("search_jobs")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return null;
    }

    const job: SearchJob = {
      id: data.id,
      query: {
        industry: data.industry,
        city: data.city,
        region: data.region ?? undefined,
        country: data.country,
        serviceTrack: data.service_track,
        limit: data.requested_limit,
      },
      status: data.status,
      progress: data.progress,
      currentStage: data.current_stage as SearchStage,
      stageStats: data.stage_stats,
      errorMessage: data.error_message,
      startedAt: data.started_at,
      completedAt: data.completed_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    inMemoryJobs.set(id, job);
    persistJobsData();
    return job;
  } catch {
    return null;
  }
}

export async function cancelSearchJob(id: string): Promise<SearchJob | null> {
  const job = await getSearchJob(id);
  if (!job) return null;

  if (job.status === "completed" || job.status === "failed") {
    return job; // Cannot cancel finished job
  }

  job.status = "cancelled";
  job.currentStage = "cancelled";
  job.completedAt = new Date().toISOString();
  job.updatedAt = new Date().toISOString();

  inMemoryJobs.set(id, job);
  persistJobsData();

  if (isSupabaseServerConfigured()) {
    try {
      const supabase = createSupabaseServerClient();
      await supabase
        .from("search_jobs")
        .update({
          status: "cancelled",
          current_stage: "cancelled",
          completed_at: job.completedAt,
          updated_at: job.updatedAt,
        })
        .eq("id", id);
    } catch (e) {
      logger.warn("Supabase cancel update failed", { error: e });
    }
  }

  return job;
}

export async function retrySearchJob(id: string): Promise<SearchJob | null> {
  const job = await getSearchJob(id);
  if (!job) return null;

  job.status = "pending";
  job.progress = 0;
  job.currentStage = "queued";
  job.errorMessage = undefined;
  job.startedAt = new Date().toISOString();
  job.completedAt = undefined;
  job.updatedAt = new Date().toISOString();

  inMemoryJobs.set(id, job);
  persistJobsData();

  if (isSupabaseServerConfigured()) {
    try {
      const supabase = createSupabaseServerClient();
      await supabase
        .from("search_jobs")
        .update({
          status: "pending",
          progress: 0,
          current_stage: "queued",
          error_message: null,
          started_at: job.startedAt,
          completed_at: null,
          updated_at: job.updatedAt,
        })
        .eq("id", id);
    } catch (e) {
      logger.warn("Supabase retry update failed", { error: e });
    }
  }

  return job;
}

export function listRecentSearchJobs(): SearchJob[] {
  return Array.from(inMemoryJobs.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}
