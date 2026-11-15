export type ApiResponseSuccess<T> = {
  success: true;
  data: T;
  meta?: {
    total?: number;
    limit?: number;
    offset?: number;
    page?: number;
    timestamp: string;
    requestId?: string;
  };
};

export type ApiResponseError = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta: {
    timestamp: string;
    requestId?: string;
  };
};

export type ApiResponse<T> = ApiResponseSuccess<T> | ApiResponseError;

export function createSuccessResponse<T>(
  data: T,
  meta?: Omit<ApiResponseSuccess<T>["meta"], "timestamp">,
  requestId?: string,
): ApiResponseSuccess<T> {
  return {
    success: true,
    data,
    meta: {
      ...meta,
      timestamp: new Date().toISOString(),
      requestId,
    },
  };
}

export function createErrorResponse(
  code: string,
  message: string,
  details?: unknown,
  requestId?: string,
): ApiResponseError {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
    },
  };
}

