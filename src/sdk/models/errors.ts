export interface LibrusErrorDetails {
  endpoint?: string;
  issues?: string[];
  status?: number;
  timeoutMs?: number;
  matches?: Array<Record<string, string | number>>;
  [key: string]: unknown;
}

export class LibrusSdkError extends Error {
  readonly code: string;
  readonly details: LibrusErrorDetails | undefined;

  constructor(code: string, message: string, details?: LibrusErrorDetails) {
    super(message);
    this.name = "LibrusSdkError";
    this.code = code;
    this.details = details;
  }
}

export class LibrusApiError extends LibrusSdkError {
  constructor(
    endpoint: string,
    status: number,
    message = "Librus API request failed",
  ) {
    super("API_REQUEST_FAILED", message, { endpoint, status });
    this.name = "LibrusApiError";
  }
}

export class LibrusAuthenticationError extends LibrusSdkError {
  constructor(message = "Portal authentication failed") {
    super("AUTHENTICATION_FAILED", message);
    this.name = "LibrusAuthenticationError";
  }
}

export class LibrusConfigurationError extends LibrusSdkError {
  constructor(message: string) {
    super("CONFIGURATION_ERROR", message);
    this.name = "LibrusConfigurationError";
  }
}

export class LibrusNetworkTimeoutError extends LibrusSdkError {
  constructor(endpoint: string, timeoutMs: number) {
    super("NETWORK_TIMEOUT", `Librus request timed out after ${timeoutMs}ms.`, {
      endpoint,
      timeoutMs,
    });
    this.name = "LibrusNetworkTimeoutError";
  }
}

export class LibrusPortalPageError extends LibrusSdkError {
  constructor(
    message = "Portal login page no longer contains the expected CSRF token.",
  ) {
    super("PORTAL_LOGIN_PAGE_INVALID", message);
    this.name = "LibrusPortalPageError";
  }
}

export class LibrusResponseValidationError extends LibrusSdkError {
  constructor(endpoint: string, issues: string[]) {
    super(
      "RESPONSE_VALIDATION_FAILED",
      "Received an unexpected response from Librus.",
      {
        endpoint,
        issues,
      },
    );
    this.name = "LibrusResponseValidationError";
  }
}
