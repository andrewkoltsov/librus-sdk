import fc from "fast-check";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LibrusConfigurationError } from "../src/sdk/models/errors.js";
import type { Logger } from "../src/sdk/logger.js";
import { SynergiaApiClient } from "../src/sdk/synergia/SynergiaApiClient.js";
import {
  computeBackoffDelay,
  parseRetryAfter,
  resolveRetryConfig,
  sleep,
  withRetry,
  wrapFetchWithRetry,
} from "../src/sdk/synergia/retry.js";

const FAST_CHECK_SETTINGS = {
  numRuns: 200,
  seed: 20260404,
} as const;

const ENDPOINT = "https://api.librus.pl/3.0/Me";

function jsonResponse(status: number, body: unknown = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("retry config resolution", () => {
  it("applies documented defaults", () => {
    const config = resolveRetryConfig(undefined);

    expect(config.maxAttempts).toBe(3);
    expect(config.baseDelayMs).toBe(250);
    expect(config.maxDelayMs).toBe(5_000);
    expect(config.jitter).toBe(true);
    expect([...config.retriableStatuses].sort((a, b) => a - b)).toEqual([
      408, 425, 429, 500, 502, 503, 504,
    ]);
    expect([...config.retriableMethods]).toEqual(["GET", "HEAD"]);
  });

  it("treats `false` like defaults when resolved (gating happens upstream)", () => {
    expect(resolveRetryConfig(false).maxAttempts).toBe(3);
  });

  it("normalizes retriable methods to upper case", () => {
    const config = resolveRetryConfig({ retriableMethods: ["get", "post"] });

    expect(config.retriableMethods.has("GET")).toBe(true);
    expect(config.retriableMethods.has("POST")).toBe(true);
  });

  it.each([
    { label: "maxAttempts", option: { maxAttempts: 0 } },
    { label: "maxAttempts non-integer", option: { maxAttempts: 1.5 } },
    { label: "baseDelayMs negative", option: { baseDelayMs: -1 } },
    { label: "status non-integer", option: { retriableStatuses: [1.2] } },
    {
      label: "maxDelay < baseDelay",
      option: { baseDelayMs: 1000, maxDelayMs: 100 },
    },
  ])("rejects invalid config: $label", ({ option }) => {
    expect(() => resolveRetryConfig(option)).toThrow(LibrusConfigurationError);
  });
});

describe("computeBackoffDelay", () => {
  it("grows exponentially and caps at maxDelayMs without jitter", () => {
    const config = { baseDelayMs: 100, maxDelayMs: 500, jitter: false };

    expect(computeBackoffDelay(1, config)).toBe(100);
    expect(computeBackoffDelay(2, config)).toBe(200);
    expect(computeBackoffDelay(3, config)).toBe(400);
    expect(computeBackoffDelay(4, config)).toBe(500); // capped (would be 800)
  });

  it("never exceeds the capped delay with full jitter", () => {
    const config = { baseDelayMs: 100, maxDelayMs: 500, jitter: true };

    for (const random of [0, 0.5, 0.999_999]) {
      expect(computeBackoffDelay(3, config, () => random)).toBeLessThanOrEqual(
        400,
      );
    }
  });
});

describe("parseRetryAfter", () => {
  it("parses delta-seconds into milliseconds", () => {
    expect(parseRetryAfter("2")).toBe(2_000);
    expect(parseRetryAfter("0")).toBe(0);
  });

  it("parses HTTP-date relative to now", () => {
    const now = Date.parse("Wed, 21 Oct 2026 07:28:00 GMT");
    const future = "Wed, 21 Oct 2026 07:28:05 GMT";

    expect(parseRetryAfter(future, now)).toBe(5_000);
  });

  it("clamps past HTTP-dates to zero", () => {
    const now = Date.parse("Wed, 21 Oct 2026 07:28:10 GMT");
    const past = "Wed, 21 Oct 2026 07:28:00 GMT";

    expect(parseRetryAfter(past, now)).toBe(0);
  });

  it("returns undefined for missing or unparseable values", () => {
    expect(parseRetryAfter(null)).toBeUndefined();
    expect(parseRetryAfter(undefined)).toBeUndefined();
    expect(parseRetryAfter("   ")).toBeUndefined();
    expect(parseRetryAfter("soon")).toBeUndefined();
  });
});

describe("sleep", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves after the delay", async () => {
    let resolved = false;
    const promise = sleep(100).then(() => {
      resolved = true;
    });

    await vi.advanceTimersByTimeAsync(99);
    expect(resolved).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await promise;
    expect(resolved).toBe(true);
  });

  it("rejects immediately when the signal is already aborted", async () => {
    const controller = new AbortController();
    controller.abort();

    const error = await sleep(100, controller.signal).catch((e: unknown) => e);

    expect((error as Error).name).toBe("AbortError");
  });

  it("rejects when aborted mid-wait and clears its timer", async () => {
    const controller = new AbortController();
    const promise = sleep(100, controller.signal).catch((e: unknown) => e);

    await vi.advanceTimersByTimeAsync(10);
    controller.abort();

    const error = await promise;
    expect((error as Error).name).toBe("AbortError");
  });
});

describe("withRetry (generic primitive)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("retries on a thrown error flagged by shouldRetryError (LIB-9 shape)", async () => {
    const fn = vi
      .fn<(attempt: number) => Promise<string>>()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce("ok");

    const promise = withRetry(fn, {
      maxAttempts: 3,
      baseDelayMs: 100,
      maxDelayMs: 1_000,
      jitter: false,
      shouldRetry: () => ({ retry: false }),
      shouldRetryError: () => ({ retry: true }),
    });

    await vi.advanceTimersByTimeAsync(100);
    await expect(promise).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("never retries an AbortError even if shouldRetryError says so", async () => {
    const abortError = new Error("aborted");
    abortError.name = "AbortError";
    const fn = vi
      .fn<(attempt: number) => Promise<string>>()
      .mockRejectedValue(abortError);

    const error = await withRetry(fn, {
      maxAttempts: 3,
      baseDelayMs: 100,
      maxDelayMs: 1_000,
      jitter: false,
      shouldRetry: () => ({ retry: false }),
      shouldRetryError: () => ({ retry: true }),
    }).catch((e: unknown) => e);

    expect((error as Error).name).toBe("AbortError");
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe("wrapFetchWithRetry", () => {
  const config = resolveRetryConfig({
    maxAttempts: 3,
    baseDelayMs: 100,
    maxDelayMs: 5_000,
    jitter: false,
  });

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("retries a 503 then succeeds on the 200", async () => {
    const baseFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse(503))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    const wrapped = wrapFetchWithRetry(baseFetch, config);

    const promise = wrapped(ENDPOINT, { method: "GET" });
    await vi.advanceTimersByTimeAsync(100);

    const response = await promise;
    expect(response.status).toBe(200);
    expect(baseFetch).toHaveBeenCalledTimes(2);
  });

  it("honors Retry-After seconds on a 429", async () => {
    const baseFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(null, { status: 429, headers: { "retry-after": "2" } }),
      )
      .mockResolvedValueOnce(jsonResponse(200));
    const wrapped = wrapFetchWithRetry(baseFetch, config);

    const promise = wrapped(ENDPOINT, { method: "GET" });

    await vi.advanceTimersByTimeAsync(1_999);
    expect(baseFetch).toHaveBeenCalledTimes(1); // still waiting out Retry-After
    await vi.advanceTimersByTimeAsync(1);

    await expect(promise).resolves.toMatchObject({ status: 200 });
    expect(baseFetch).toHaveBeenCalledTimes(2);
  });

  it("honors Retry-After HTTP-date on a 429", async () => {
    const base = Date.parse("Wed, 21 Oct 2026 07:28:00 GMT");
    vi.setSystemTime(base);
    const baseFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(null, {
          status: 429,
          headers: { "retry-after": "Wed, 21 Oct 2026 07:28:03 GMT" },
        }),
      )
      .mockResolvedValueOnce(jsonResponse(200));
    const wrapped = wrapFetchWithRetry(baseFetch, config);

    const promise = wrapped(ENDPOINT, { method: "GET" });

    await vi.advanceTimersByTimeAsync(2_999);
    expect(baseFetch).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);

    await expect(promise).resolves.toMatchObject({ status: 200 });
    expect(baseFetch).toHaveBeenCalledTimes(2);
  });

  it("aborts during backoff and makes no further attempts", async () => {
    const controller = new AbortController();
    const baseFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse(503));
    const wrapped = wrapFetchWithRetry(baseFetch, config);

    const promise = wrapped(ENDPOINT, {
      method: "GET",
      signal: controller.signal,
    }).catch((e: unknown) => e);

    await vi.advanceTimersByTimeAsync(0); // flush first attempt, enter backoff
    expect(baseFetch).toHaveBeenCalledTimes(1);
    controller.abort();

    const error = await promise;
    expect((error as Error).name).toBe("AbortError");
    expect(baseFetch).toHaveBeenCalledTimes(1);
  });

  it("does not retry non-idempotent methods by default", async () => {
    const baseFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse(503));
    const wrapped = wrapFetchWithRetry(baseFetch, config);

    const response = await wrapped(ENDPOINT, { method: "POST" });

    expect(response.status).toBe(503);
    expect(baseFetch).toHaveBeenCalledTimes(1);
  });

  it("retries non-idempotent methods when explicitly opted in", async () => {
    const optInConfig = resolveRetryConfig({
      maxAttempts: 2,
      baseDelayMs: 100,
      maxDelayMs: 5_000,
      jitter: false,
      retriableMethods: ["GET", "POST"],
    });
    const baseFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse(503))
      .mockResolvedValueOnce(jsonResponse(200));
    const wrapped = wrapFetchWithRetry(baseFetch, optInConfig);

    const promise = wrapped(ENDPOINT, { method: "POST" });
    await vi.advanceTimersByTimeAsync(100);

    await expect(promise).resolves.toMatchObject({ status: 200 });
    expect(baseFetch).toHaveBeenCalledTimes(2);
  });

  it("retries transient network rejections", async () => {
    const baseFetch = vi
      .fn<typeof fetch>()
      .mockRejectedValueOnce(new TypeError("network error"))
      .mockResolvedValueOnce(jsonResponse(200));
    const wrapped = wrapFetchWithRetry(baseFetch, config);

    const promise = wrapped(ENDPOINT, { method: "GET" });
    await vi.advanceTimersByTimeAsync(100);

    await expect(promise).resolves.toMatchObject({ status: 200 });
    expect(baseFetch).toHaveBeenCalledTimes(2);
  });

  it("returns the last response after exhausting attempts", async () => {
    const exhaustConfig = resolveRetryConfig({
      maxAttempts: 2,
      baseDelayMs: 100,
      maxDelayMs: 5_000,
      jitter: false,
    });
    // Fresh response per call, mirroring real fetch (a discarded body on an
    // earlier attempt must not poison the final returned response).
    const baseFetch = vi
      .fn<typeof fetch>()
      .mockImplementation(async () => jsonResponse(503));
    const wrapped = wrapFetchWithRetry(baseFetch, exhaustConfig);

    const promise = wrapped(ENDPOINT, { method: "GET" });
    await vi.advanceTimersByTimeAsync(100);

    const response = await promise;
    expect(response.status).toBe(503);
    // The final response must remain readable — its body must not have been
    // cancelled as part of the (exhausted) retry decision.
    await expect(response.json()).resolves.toEqual({});
    expect(baseFetch).toHaveBeenCalledTimes(2);
  });

  it("emits a structured log event per retry", async () => {
    const log = vi.fn();
    const logger: Logger = { log };
    const baseFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse(503))
      .mockResolvedValueOnce(jsonResponse(200));
    const wrapped = wrapFetchWithRetry(baseFetch, config, logger);

    const promise = wrapped(ENDPOINT, { method: "GET" });
    await vi.advanceTimersByTimeAsync(100);
    await promise;

    expect(log).toHaveBeenCalledWith(
      "warn",
      "synergia.retry",
      expect.objectContaining({
        attempt: 1,
        endpoint: ENDPOINT,
        method: "GET",
        reason: "status_503",
      }),
    );
  });
});

describe("SynergiaApiClient retry wiring", () => {
  it("makes exactly one attempt when retry is disabled", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse(503));
    const client = new SynergiaApiClient("token", {
      fetch: fetchMock,
      retry: false,
    });

    await expect(client.getMe()).rejects.toMatchObject({
      code: "API_REQUEST_FAILED",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("maps repeated 503 maintenance to a stable error with retries enabled", async () => {
    vi.useFakeTimers();

    try {
      const fetchMock = vi.fn<typeof fetch>().mockImplementation(
        async () =>
          new Response(JSON.stringify({ Status: "Maintenance" }), {
            status: 503,
            headers: { "content-type": "application/json" },
          }),
      );
      const client = new SynergiaApiClient("token", {
        fetch: fetchMock,
        retry: {
          maxAttempts: 2,
          baseDelayMs: 100,
          maxDelayMs: 5_000,
          jitter: false,
        },
      });

      const resultPromise = client.getMe().catch((error: unknown) => error);
      await vi.advanceTimersByTimeAsync(100);
      const error = await resultPromise;

      expect(error).toMatchObject({
        code: "SERVICE_MAINTENANCE",
        details: { status: 503 },
      });
      expect(fetchMock).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not retry deterministic validation failures", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response("not-json", {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const client = new SynergiaApiClient("token", { fetch: fetchMock });

    await expect(client.getMe()).rejects.toBeInstanceOf(Error);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("retry timing properties", () => {
  it("keeps every backoff delay within its capped bound for random configs", () => {
    fc.assert(
      fc.property(
        fc.record({
          baseDelayMs: fc.integer({ min: 1, max: 2_000 }),
          maxDelayMs: fc.integer({ min: 1, max: 30_000 }),
          attempt: fc.integer({ min: 1, max: 10 }),
          random: fc.double({ min: 0, max: 1, noNaN: true }),
        }),
        ({ baseDelayMs, maxDelayMs, attempt, random }) => {
          const cap = Math.max(baseDelayMs, maxDelayMs);
          const config = { baseDelayMs, maxDelayMs: cap, jitter: true };
          const delay = computeBackoffDelay(attempt, config, () => random);
          const expectedCap = Math.min(cap, baseDelayMs * 2 ** (attempt - 1));

          expect(delay).toBeGreaterThanOrEqual(0);
          expect(delay).toBeLessThanOrEqual(expectedCap);
        },
      ),
      FAST_CHECK_SETTINGS,
    );
  });

  it("bounds total backoff by the sum of per-attempt caps", () => {
    fc.assert(
      fc.property(
        fc.record({
          baseDelayMs: fc.integer({ min: 1, max: 1_000 }),
          maxDelayMs: fc.integer({ min: 1, max: 10_000 }),
          maxAttempts: fc.integer({ min: 1, max: 6 }),
        }),
        ({ baseDelayMs, maxDelayMs, maxAttempts }) => {
          const cap = Math.max(baseDelayMs, maxDelayMs);
          const config = { baseDelayMs, maxDelayMs: cap, jitter: true };

          let total = 0;
          let bound = 0;
          for (let attempt = 1; attempt < maxAttempts; attempt += 1) {
            total += computeBackoffDelay(attempt, config, () => 1);
            bound += Math.min(cap, baseDelayMs * 2 ** (attempt - 1));
          }

          expect(total).toBeLessThanOrEqual(bound);
        },
      ),
      FAST_CHECK_SETTINGS,
    );
  });
});
