export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode = 500,
    code = "INTERNAL_SERVER_ERROR",
    details?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation error", details?: unknown) {
    super(message, 400, "VALIDATION_ERROR", details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found", details?: unknown) {
    super(message, 404, "NOT_FOUND", details);
  }
}

export class ProviderError extends AppError {
  public readonly provider: string;

  constructor(provider: string, message = "Provider error", details?: unknown) {
    super(`Provider [${provider}] failed: ${message}`, 502, "PROVIDER_ERROR", details);
    this.provider = provider;
  }
}

export class DatabaseError extends AppError {
  constructor(message = "Database operation failed", details?: unknown) {
    super(message, 500, "DATABASE_ERROR", details);
  }
}

export class TimeoutError extends AppError {
  constructor(operation = "Operation", timeoutMs?: number) {
    const msg = timeoutMs
      ? `${operation} timed out after ${timeoutMs}ms`
      : `${operation} timed out`;
    super(msg, 504, "TIMEOUT_ERROR");
  }
}

