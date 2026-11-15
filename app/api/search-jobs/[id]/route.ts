import {
  getSearchJob,
  getJobBusinesses,
  cancelSearchJob,
  retrySearchJob,
} from "../../../../lib/jobs/store.ts";
import { createSuccessResponse, createErrorResponse } from "../../../../lib/types/api.ts";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const requestId = crypto.randomUUID();

  if (!id) {
    return Response.json(
      createErrorResponse("INVALID_ID", "Job ID is required", undefined, requestId),
      { status: 400 },
    );
  }

  const job = await getSearchJob(id);
  if (!job) {
    return Response.json(
      createErrorResponse("NOT_FOUND", `Search job with ID [${id}] not found`, undefined, requestId),
      { status: 404 },
    );
  }

  const businesses = getJobBusinesses(id);

  return Response.json(
    createSuccessResponse(
      {
        ...job,
        leads: businesses,
        businesses,
      },
      undefined,
      requestId
    ),
    { status: 200 },
  );
}

/**
 * DELETE /api/search-jobs/[id]
 * Cancels an active or queued search job.
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const requestId = crypto.randomUUID();

  if (!id) {
    return Response.json(
      createErrorResponse("INVALID_ID", "Job ID is required", undefined, requestId),
      { status: 400 },
    );
  }

  const cancelled = await cancelSearchJob(id);
  if (!cancelled) {
    return Response.json(
      createErrorResponse("NOT_FOUND", `Search job with ID [${id}] not found`, undefined, requestId),
      { status: 404 },
    );
  }

  return Response.json(
    createSuccessResponse(cancelled, undefined, requestId),
    { status: 200 },
  );
}

/**
 * POST /api/search-jobs/[id]
 * Retries a failed or cancelled search job.
 */
export async function POST(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const requestId = crypto.randomUUID();

  if (!id) {
    return Response.json(
      createErrorResponse("INVALID_ID", "Job ID is required", undefined, requestId),
      { status: 400 },
    );
  }

  const retried = await retrySearchJob(id);
  if (!retried) {
    return Response.json(
      createErrorResponse("NOT_FOUND", `Search job with ID [${id}] not found`, undefined, requestId),
      { status: 404 },
    );
  }

  return Response.json(
    createSuccessResponse(retried, undefined, requestId),
    { status: 200 },
  );
}
