export interface LibrusErrorDetails {
  endpoint?: string;
  status?: number;
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
  constructor(endpoint: string, status: number, message = "Librus API request failed") {
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
