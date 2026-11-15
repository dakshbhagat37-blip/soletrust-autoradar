type LogLevel = "debug" | "info" | "warn" | "error";

interface LogPayload {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  requestId?: string;
  searchJobId?: string;
  data?: unknown;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private formatLog(
    level: LogLevel,
    message: string,
    meta?: {
      context?: string;
      requestId?: string;
      searchJobId?: string;
      data?: unknown;
      error?: Error | unknown;
    },
  ): string {
    const payload: LogPayload = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: meta?.context,
      requestId: meta?.requestId,
      searchJobId: meta?.searchJobId,
      data: meta?.data,
    };

    if (meta?.error) {
      if (meta.error instanceof Error) {
        payload.error = {
          name: meta.error.name,
          message: meta.error.message,
          stack: process.env.NODE_ENV !== "production" ? meta.error.stack : undefined,
        };
      } else {
        payload.error = {
          name: "UnknownError",
          message: String(meta.error),
        };
      }
    }

    return JSON.stringify(payload);
  }

  debug(message: string, meta?: Parameters<Logger["formatLog"]>[2]) {
    if (process.env.NODE_ENV !== "production") {
      console.debug(this.formatLog("debug", message, meta));
    }
  }

  info(message: string, meta?: Parameters<Logger["formatLog"]>[2]) {
    console.info(this.formatLog("info", message, meta));
  }

  warn(message: string, meta?: Parameters<Logger["formatLog"]>[2]) {
    console.warn(this.formatLog("warn", message, meta));
  }

  error(message: string, meta?: Parameters<Logger["formatLog"]>[2]) {
    console.error(this.formatLog("error", message, meta));
  }
}

export const logger = new Logger();

