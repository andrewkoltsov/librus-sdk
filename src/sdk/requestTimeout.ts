import type { FetchLike } from "./models/common.js";
import {
  LibrusConfigurationError,
  LibrusNetworkTimeoutError,
} from "./models/errors.js";

export const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;

export function validateRequestTimeoutMs(
  requestTimeoutMs: number,
  source = "requestTimeoutMs",
): number {
  if (!Number.isSafeInteger(requestTimeoutMs) || requestTimeoutMs <= 0) {
    throw new LibrusConfigurationError(
      `Invalid ${source}. Expected a positive integer number of milliseconds.`,
    );
  }

  return requestTimeoutMs;
}

export function validateOptionalRequestTimeoutMs(
  requestTimeoutMs: number | undefined,
  source = "requestTimeoutMs",
): number | undefined {
  if (requestTimeoutMs === undefined) {
    return undefined;
  }

  return validateRequestTimeoutMs(requestTimeoutMs, source);
}

export function resolveRequestTimeoutMs(
  requestTimeoutMs: number | undefined,
  source = "requestTimeoutMs",
): number {
  if (requestTimeoutMs === undefined) {
    return DEFAULT_REQUEST_TIMEOUT_MS;
  }

  return validateRequestTimeoutMs(requestTimeoutMs, source);
}

export function parseRequestTimeoutMsFromEnv(
  rawValue: string | undefined,
  envName = "LIBRUS_TIMEOUT_MS",
): number | undefined {
  if (rawValue === undefined) {
    return undefined;
  }

  const trimmedValue = rawValue.trim();

  if (!/^\d+$/u.test(trimmedValue)) {
    throw new LibrusConfigurationError(
      `Invalid ${envName}. Expected a positive integer number of milliseconds.`,
    );
  }

  return validateRequestTimeoutMs(Number.parseInt(trimmedValue, 10), envName);
}

export function wrapFetchWithTimeout(
  baseFetch: FetchLike,
  requestTimeoutMs: number,
): FetchLike {
  return async (input, init) => {
    const timeoutController = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      timeoutController.abort();
    }, requestTimeoutMs);
    const { cleanup, signal } = combineAbortSignals(
      timeoutController.signal,
      init?.signal,
    );

    try {
      return await baseFetch(input, {
        ...init,
        signal,
      });
    } catch (error) {
      if (timedOut && isAbortError(error)) {
        throw new LibrusNetworkTimeoutError(
          getRequestUrl(input),
          requestTimeoutMs,
        );
      }

      throw error;
    } finally {
      clearTimeout(timer);
      cleanup();
    }
  };
}

function combineAbortSignals(
  timeoutSignal: AbortSignal,
  upstreamSignal: AbortSignal | null | undefined,
): { cleanup: () => void; signal: AbortSignal } {
  if (!upstreamSignal) {
    return {
      cleanup: () => undefined,
      signal: timeoutSignal,
    };
  }

  const controller = new AbortController();
  const abortFrom = (source: AbortSignal) => {
    if (!controller.signal.aborted) {
      controller.abort(source.reason);
    }
  };

  if (timeoutSignal.aborted) {
    abortFrom(timeoutSignal);

    return {
      cleanup: () => undefined,
      signal: controller.signal,
    };
  }

  if (upstreamSignal.aborted) {
    abortFrom(upstreamSignal);

    return {
      cleanup: () => undefined,
      signal: controller.signal,
    };
  }

  const onTimeoutAbort = () => abortFrom(timeoutSignal);
  const onUpstreamAbort = () => abortFrom(upstreamSignal);

  timeoutSignal.addEventListener("abort", onTimeoutAbort, { once: true });
  upstreamSignal.addEventListener("abort", onUpstreamAbort, { once: true });

  return {
    cleanup: () => {
      timeoutSignal.removeEventListener("abort", onTimeoutAbort);
      upstreamSignal.removeEventListener("abort", onUpstreamAbort);
    },
    signal: controller.signal,
  };
}

function getRequestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return input.url;
}

function isAbortError(error: unknown): error is Error {
  return error instanceof Error && error.name === "AbortError";
}
