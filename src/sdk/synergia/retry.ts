import type { FetchLike } from "../models/common.js";
import {
  LibrusConfigurationError,
  LibrusNetworkTimeoutError,
} from "../models/errors.js";
import { noopLogger, type Logger } from "../logger.js";

/**
 * Public retry configuration accepted by `SynergiaApiClientOptions.retry`.
 *
 * Pass `false` to disable retries entirely (a single attempt is made).
 */
export type RetryOption = RetryOptions | false;

export interface RetryOptions {
  /** Total attempts including the first. Default 3. */
  maxAttempts?: number;
  /** Base delay for exponential backoff, in ms. Default 250. */
  baseDelayMs?: number;
  /** Upper bound for a single backoff delay, in ms. Default 5000. */
  maxDelayMs?: number;
  /** HTTP statuses that trigger a retry. Default [408,425,429,500,502,503,504]. */
  retriableStatuses?: number[];
  /** HTTP methods eligible for retry. Default ["GET","HEAD"]. */
  retriableMethods?: string[];
  /** Apply full jitter to backoff delays. Default true. */
  jitter?: boolean;
}

/** Fully-resolved retry configuration with all defaults applied. */
export interface ResolvedRetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  retriableStatuses: ReadonlySet<number>;
  retriableMethods: ReadonlySet<string>;
  jitter: boolean;
}

export const DEFAULT_RETRY_MAX_ATTEMPTS = 3;
export const DEFAULT_RETRY_BASE_DELAY_MS = 250;
export const DEFAULT_RETRY_MAX_DELAY_MS = 5_000;
export const DEFAULT_RETRIABLE_STATUSES: readonly number[] = [
  408, 425, 429, 500, 502, 503, 504,
];
export const DEFAULT_RETRIABLE_METHODS: readonly string[] = ["GET", "HEAD"];

/** Injectable source of randomness for jitter (overridable in tests). */
export type RandomFn = () => number;

function validatePositiveInteger(
  value: number,
  source: string,
  { allowZero = false }: { allowZero?: boolean } = {},
): number {
  const lowerBoundOk = allowZero ? value >= 0 : value > 0;

  if (!Number.isSafeInteger(value) || !lowerBoundOk) {
    throw new LibrusConfigurationError(
      `Invalid ${source}. Expected a ${
        allowZero ? "non-negative" : "positive"
      } integer.`,
    );
  }

  return value;
}

/**
 * Validate and normalize a {@link RetryOption} into a {@link ResolvedRetryConfig}.
 *
 * Throws {@link LibrusConfigurationError} for malformed values. Mirrors the
 * `resolveRequestTimeoutMs` / `validateRequestTimeoutMs` pattern in
 * `requestTimeout.ts`.
 */
export function resolveRetryConfig(
  option: RetryOption | undefined,
): ResolvedRetryConfig {
  const options: RetryOptions =
    option === false || option === undefined ? {} : option;

  const maxAttempts = validatePositiveInteger(
    options.maxAttempts ?? DEFAULT_RETRY_MAX_ATTEMPTS,
    "retry.maxAttempts",
  );
  const baseDelayMs = validatePositiveInteger(
    options.baseDelayMs ?? DEFAULT_RETRY_BASE_DELAY_MS,
    "retry.baseDelayMs",
    { allowZero: true },
  );
  const maxDelayMs = validatePositiveInteger(
    options.maxDelayMs ?? DEFAULT_RETRY_MAX_DELAY_MS,
    "retry.maxDelayMs",
    { allowZero: true },
  );

  if (maxDelayMs < baseDelayMs) {
    throw new LibrusConfigurationError(
      "Invalid retry config. retry.maxDelayMs must be >= retry.baseDelayMs.",
    );
  }

  const retriableStatuses =
    options.retriableStatuses ?? DEFAULT_RETRIABLE_STATUSES;

  for (const status of retriableStatuses) {
    validatePositiveInteger(status, "retry.retriableStatuses entry");
  }

  const retriableMethods =
    options.retriableMethods ?? DEFAULT_RETRIABLE_METHODS;

  return {
    maxAttempts,
    baseDelayMs,
    maxDelayMs,
    retriableStatuses: new Set(retriableStatuses),
    retriableMethods: new Set(
      retriableMethods.map((method) => method.toUpperCase()),
    ),
    jitter: options.jitter ?? true,
  };
}

/** Compute the (capped, optionally jittered) backoff delay for an attempt. */
export function computeBackoffDelay(
  attempt: number,
  config: Pick<ResolvedRetryConfig, "baseDelayMs" | "maxDelayMs" | "jitter">,
  random: RandomFn = Math.random,
): number {
  const exponential = config.baseDelayMs * 2 ** (attempt - 1);
  const capped = Math.min(config.maxDelayMs, exponential);

  if (!config.jitter) {
    return capped;
  }

  // Full jitter: a uniformly random delay in [0, capped], so the realized
  // delay never exceeds the capped value (relied upon by the property test).
  return random() * capped;
}

/**
 * Parse an HTTP `Retry-After` header value into milliseconds.
 *
 * Supports both the delta-seconds form (`"2"`) and the HTTP-date form
 * (`"Wed, 21 Oct 2026 07:28:00 GMT"`). Returns `undefined` when the value is
 * absent or unparseable.
 */
export function parseRetryAfter(
  headerValue: string | null | undefined,
  now: number = Date.now(),
): number | undefined {
  if (headerValue === null || headerValue === undefined) {
    return undefined;
  }

  const trimmed = headerValue.trim();

  if (trimmed === "") {
    return undefined;
  }

  if (/^\d+$/u.test(trimmed)) {
    return Number.parseInt(trimmed, 10) * 1_000;
  }

  const dateMs = Date.parse(trimmed);

  if (Number.isNaN(dateMs)) {
    return undefined;
  }

  return Math.max(0, dateMs - now);
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function createAbortError(signal: AbortSignal): Error {
  const reason = signal.reason as unknown;

  if (reason instanceof Error) {
    return reason;
  }

  const error = new Error(
    typeof reason === "string" ? reason : "The operation was aborted.",
  );
  error.name = "AbortError";

  return error;
}

/**
 * Resolve after `ms`, or reject with an `AbortError` if `signal` aborts during
 * the wait. Always clears its timer and listener (no dangling handles).
 */
export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(createAbortError(signal));

      return;
    }

    const onAbort = () => {
      clearTimeout(timer);
      reject(createAbortError(signal as AbortSignal));
    };

    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

/** Describes how a single attempt should be retried (or not). */
export interface RetryDecision {
  retry: boolean;
  /** Explicit delay override (e.g. honoring `Retry-After`), in ms. */
  delayMs?: number;
  /** Short machine-readable reason, surfaced in retry log events. */
  reason?: string;
}

export interface WithRetryConfig<T> extends Pick<
  ResolvedRetryConfig,
  "maxAttempts" | "baseDelayMs" | "maxDelayMs" | "jitter"
> {
  /** Inspect a resolved value to decide whether to retry. */
  shouldRetry: (value: T) => RetryDecision;
  /** Inspect a thrown error to decide whether to retry. */
  shouldRetryError: (error: unknown) => RetryDecision;
  signal?: AbortSignal | undefined;
  random?: RandomFn;
  /** Invoked before each backoff sleep, for structured logging. */
  onRetry?: (info: {
    attempt: number;
    delayMs: number;
    reason?: string;
  }) => void;
}

/**
 * Generic retry primitive with exponential backoff + jitter.
 *
 * Retries when either the resolved value (`shouldRetry`) or a thrown error
 * (`shouldRetryError`) is flagged. Honors an `AbortSignal`: an abort before or
 * during a backoff wait rejects immediately with no further attempts.
 *
 * Shaped for reuse beyond HTTP — e.g. LIB-9's 401 auth refresh, where the
 * retriable condition is a thrown error rather than a resolved response.
 */
export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  config: WithRetryConfig<T>,
): Promise<T> {
  const random = config.random ?? Math.random;
  let attempt = 0;

  for (;;) {
    attempt += 1;

    if (config.signal?.aborted) {
      throw createAbortError(config.signal);
    }

    let decision: RetryDecision;
    let outcome:
      | { kind: "value"; value: T }
      | { kind: "error"; error: unknown };

    try {
      const value = await fn(attempt);
      decision = config.shouldRetry(value);
      outcome = { kind: "value", value };
    } catch (error) {
      // A caller-driven abort is terminal and never retried.
      if (isAbortError(error)) {
        throw error;
      }

      decision = config.shouldRetryError(error);
      outcome = { kind: "error", error };
    }

    const isLastAttempt = attempt >= config.maxAttempts;

    if (!decision.retry || isLastAttempt) {
      if (outcome.kind === "value") {
        return outcome.value;
      }

      throw outcome.error;
    }

    const delayMs =
      decision.delayMs ?? computeBackoffDelay(attempt, config, random);

    config.onRetry?.({
      attempt,
      delayMs,
      ...(decision.reason !== undefined ? { reason: decision.reason } : {}),
    });

    await sleep(delayMs, config.signal);
  }
}

function getRequestMethod(init: RequestInit | undefined): string {
  return (init?.method ?? "GET").toUpperCase();
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

/**
 * Wrap a fetch implementation with retry/backoff for transient HTTP failures.
 *
 * Composes with `wrapFetchWithTimeout`: place retry on the outside so each
 * attempt receives a fresh per-attempt timeout. Only retries methods in
 * `config.retriableMethods` (idempotent by default) and statuses in
 * `config.retriableStatuses`; honors `Retry-After` for 429 responses; respects
 * the caller's `AbortSignal` during backoff.
 */
export function wrapFetchWithRetry(
  baseFetch: FetchLike,
  config: ResolvedRetryConfig,
  logger: Logger = noopLogger,
): FetchLike {
  return async (input, init) => {
    const method = getRequestMethod(init);
    const endpoint = getRequestUrl(input);
    const methodIsRetriable = config.retriableMethods.has(method);
    const signal = init?.signal ?? undefined;

    const decideForResponse = (response: Response): RetryDecision => {
      if (
        !methodIsRetriable ||
        !config.retriableStatuses.has(response.status)
      ) {
        return { retry: false };
      }

      const retryAfterMs =
        response.status === 429
          ? parseRetryAfter(response.headers.get("retry-after"))
          : undefined;

      return {
        retry: true,
        ...(retryAfterMs !== undefined ? { delayMs: retryAfterMs } : {}),
        reason: `status_${response.status}`,
      };
    };

    return withRetry<Response>(() => baseFetch(input, init), {
      maxAttempts: config.maxAttempts,
      baseDelayMs: config.baseDelayMs,
      maxDelayMs: config.maxDelayMs,
      jitter: config.jitter,
      signal,
      shouldRetry: (response) => {
        const decision = decideForResponse(response);

        // Release the discarded response so the socket is not held open.
        if (decision.retry) {
          void response.body?.cancel();
        }

        return decision;
      },
      shouldRetryError: (error) =>
        // Genuine network rejections (e.g. ECONNRESET) are transient and
        // retriable. Per-attempt timeouts are terminal: retrying them only
        // multiplies the caller's worst-case wait, so they pass straight
        // through (matching the standalone timeout contract).
        methodIsRetriable && !(error instanceof LibrusNetworkTimeoutError)
          ? { retry: true, reason: "network_error" }
          : { retry: false },
      onRetry: ({ attempt, delayMs, reason }) => {
        logger.log("warn", "synergia.retry", {
          attempt,
          delayMs,
          endpoint,
          method,
          reason,
        });
      },
    });
  };
}
