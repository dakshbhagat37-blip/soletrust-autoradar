import { createSearchJobSchema } from "../../../lib/schemas/search-job.ts";
import { createInitialSearchJob, listRecentSearchJobs, saveSearchJob } from "../../../lib/jobs/store.ts";
import { createSuccessResponse, createErrorResponse } from "../../../lib/types/api.ts";
import { logger } from "../../../lib/logging/logger.ts";

export async function GET() {
  const jobs = listRecentSearchJobs();
  return Response.json(createSuccessResponse(jobs, { total: jobs.length }));
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      createErrorResponse("INVALID_JSON", "Request body must be valid JSON", undefined, requestId),
      { status: 400 },
    );
  }

  const parsed = createSearchJobSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      createErrorResponse("VALIDATION_ERROR", "Invalid search parameters", parsed.error.format(), requestId),
      { status: 400 },
    );
  }

  try {
    const job = createInitialSearchJob(parsed.data);
    await saveSearchJob(job);

    logger.info("Search job initialized", {
      context: "POST /api/search-jobs",
      requestId,
      searchJobId: job.id,
      data: parsed.data,
    });

    return Response.json(
      createSuccessResponse(job, undefined, requestId),
      { status: 201 },
    );
  } catch (error) {
    logger.error("Failed to create search job", {
      context: "POST /api/search-jobs",
      requestId,
      error,
    });

    return Response.json(
      createErrorResponse("INTERNAL_ERROR", "Failed to initialize search job", undefined, requestId),
      { status: 500 },
    );
  }
}
