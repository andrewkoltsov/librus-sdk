export type LogLevel = "debug" | "info" | "warn" | "error";

export interface Logger {
  log(level: LogLevel, event: string, fields?: Record<string, unknown>): void;
}

export const noopLogger: Logger = {
  log: () => undefined,
};

export function getErrorLogFields(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    const fields: Record<string, unknown> = {
      errorName: error.name,
      errorMessage: error.message,
    };

    if ("code" in error && typeof error.code === "string") {
      fields.errorCode = error.code;
    }

    if (
      "details" in error &&
      error.details !== null &&
      typeof error.details === "object"
    ) {
      if (
        "status" in error.details &&
        typeof error.details.status === "number"
      ) {
        fields.status = error.details.status;
      }

      if (
        "timeoutMs" in error.details &&
        typeof error.details.timeoutMs === "number"
      ) {
        fields.timeoutMs = error.details.timeoutMs;
      }
    }

    return fields;
  }

  return {
    errorName: typeof error,
  };
}
