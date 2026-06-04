import { describe, expect, it } from "vitest";

import { combineAbortSignals } from "../src/sdk/requestTimeout.js";

describe("combineAbortSignals", () => {
  it("returns timeout signal directly when upstream is undefined", () => {
    const tc = new AbortController();
    const { signal, cleanup } = combineAbortSignals(tc.signal, undefined);

    expect(signal).toBe(tc.signal);
    cleanup();
  });

  it("returns timeout signal directly when upstream is null", () => {
    const tc = new AbortController();
    const { signal, cleanup } = combineAbortSignals(tc.signal, null);

    expect(signal).toBe(tc.signal);
    cleanup();
  });

  it("returns already-aborted signal when timeout is pre-aborted", () => {
    const tc = new AbortController();
    const up = new AbortController();
    tc.abort("timeout-reason");

    const { signal, cleanup } = combineAbortSignals(tc.signal, up.signal);

    expect(signal.aborted).toBe(true);
    expect(signal.reason).toBe("timeout-reason");
    cleanup();
  });

  it("returns already-aborted signal when upstream is pre-aborted", () => {
    const tc = new AbortController();
    const up = new AbortController();
    up.abort("upstream-reason");

    const { signal, cleanup } = combineAbortSignals(tc.signal, up.signal);

    expect(signal.aborted).toBe(true);
    expect(signal.reason).toBe("upstream-reason");
    cleanup();
  });

  it("aborts combined signal when timeout fires", () => {
    const tc = new AbortController();
    const up = new AbortController();
    const { signal, cleanup } = combineAbortSignals(tc.signal, up.signal);

    expect(signal.aborted).toBe(false);
    tc.abort("timed-out");

    expect(signal.aborted).toBe(true);
    expect(signal.reason).toBe("timed-out");
    cleanup();
  });

  it("aborts combined signal when upstream fires", () => {
    const tc = new AbortController();
    const up = new AbortController();
    const { signal, cleanup } = combineAbortSignals(tc.signal, up.signal);

    expect(signal.aborted).toBe(false);
    up.abort("user-cancelled");

    expect(signal.aborted).toBe(true);
    expect(signal.reason).toBe("user-cancelled");
    cleanup();
  });

  it("does not abort combined signal after cleanup removes listeners", () => {
    const tc = new AbortController();
    const up = new AbortController();
    const { signal, cleanup } = combineAbortSignals(tc.signal, up.signal);

    cleanup();
    tc.abort("late");

    expect(signal.aborted).toBe(false);
  });

  it("does not double-abort when both signals fire after first", () => {
    const tc = new AbortController();
    const up = new AbortController();
    const { signal, cleanup } = combineAbortSignals(tc.signal, up.signal);

    tc.abort("first");
    up.abort("second");

    expect(signal.aborted).toBe(true);
    expect(signal.reason).toBe("first");
    cleanup();
  });
});
