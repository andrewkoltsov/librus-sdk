import { describe, expect, it, vi } from "vitest";

import type { Logger, LogLevel } from "../src/sdk/index.js";
import { LibrusSession, PortalClient } from "../src/sdk/index.js";
import { SynergiaApiClient } from "../src/sdk/synergia/SynergiaApiClient.js";

interface LogRecord {
  level: LogLevel;
  event: string;
  fields?: Record<string, unknown>;
}

function createLogger(): { logger: Logger; records: LogRecord[] } {
  const records: LogRecord[] = [];

  return {
    logger: {
      log: (level, event, fields) => records.push({ level, event, fields }),
    },
    records,
  };
}

function createAbortAwareHangingFetch() {
  return vi.fn<typeof fetch>((_input, init) => {
    return new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener(
        "abort",
        () => {
          reject(new DOMException("This operation was aborted", "AbortError"));
        },
        { once: true },
      );
    });
  });
}

function createGradesResponse(): Response {
  return new Response(
    JSON.stringify({
      Grades: [],
      Resources: {},
      Url: "https://api.librus.pl/3.0/Grades",
    }),
    {
      status: 200,
      headers: { "content-type": "application/json" },
    },
  );
}

function expectNoSecrets(records: LogRecord[]): void {
  const serialized = JSON.stringify(records);

  expect(serialized).not.toContain("super-secret");
  expect(serialized).not.toContain("token-secret");
  expect(serialized).not.toContain("Bearer");
  expect(serialized).not.toContain("set-cookie");
  expect(serialized).not.toContain("password=");
}

describe("SDK logging hooks", () => {
  it("emits secret-safe Synergia request lifecycle events", async () => {
    const { logger, records } = createLogger();
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(createGradesResponse());
    const client = new SynergiaApiClient("token-secret", {
      fetch: fetchMock,
      logger,
    });

    await client.getGrades();

    expect(records.map((record) => record.event)).toEqual([
      "synergia.request.start",
      "synergia.request.success",
    ]);
    expect(records[0]?.fields).toMatchObject({
      authMode: "bearer",
      endpoint: "https://api.librus.pl/3.0/Grades",
      method: "GET",
      path: "/Grades",
    });
    expect(records[1]?.fields).toMatchObject({
      status: 200,
    });
    expectNoSecrets(records);
  });

  it("emits secret-safe Synergia failure and timeout events", async () => {
    vi.useFakeTimers();

    try {
      const { logger, records } = createLogger();
      const fetchMock = createAbortAwareHangingFetch();
      const client = new SynergiaApiClient("token-secret", {
        fetch: fetchMock,
        logger,
        requestTimeoutMs: 5,
      });
      const requestPromise = client
        .getGrades()
        .catch((error: unknown) => error);

      await vi.advanceTimersByTimeAsync(5);
      await expect(requestPromise).resolves.toMatchObject({
        code: "NETWORK_TIMEOUT",
      });

      expect(records.map((record) => record.event)).toEqual([
        "synergia.request.start",
        "synergia.timeout",
        "synergia.request.failure",
      ]);
      expect(records[1]?.fields).toMatchObject({
        timeoutMs: 5,
      });
      expect(records[2]?.fields).toMatchObject({
        errorCode: "NETWORK_TIMEOUT",
      });
      expectNoSecrets(records);
    } finally {
      vi.useRealTimers();
    }
  });

  it("emits secret-safe Portal login events", async () => {
    const { logger, records } = createLogger();
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          '<input type="hidden" name="_token" value="csrf-token-123">',
          {
            status: 200,
          },
        ),
      )
      .mockResolvedValueOnce(new Response("", { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            identifier: 1,
            email: "parent@example.com",
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
      );
    const client = new PortalClient({ fetch: fetchMock, logger });

    await client.login({
      email: "parent@example.com",
      password: "super-secret",
    });

    expect(records.map((record) => record.event)).toEqual([
      "portal.login.start",
      "portal.login.success",
    ]);
    expectNoSecrets(records);
  });

  it("uses the noop logger by default", async () => {
    const consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(createGradesResponse());
    const client = new SynergiaApiClient("token-secret", { fetch: fetchMock });

    await client.getGrades();

    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("propagates the session logger to internally created clients", async () => {
    const { logger, records } = createLogger();
    const child = {
      id: 1,
      accountIdentifier: "child-1",
      group: "parent",
      login: "child-login",
      studentName: "Child Name",
      accessToken: "token-secret",
      state: "active",
    };
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(createGradesResponse());
    const session = new LibrusSession({
      apiBackend: "api_v3",
      credentials: {
        email: "parent@example.com",
        password: "super-secret",
      },
      logger,
      synergiaClientOptions: {
        fetch: fetchMock,
      },
    });
    const client = await session.forChild(child);

    await client.getGrades();

    expect(records.map((record) => record.event)).toEqual([
      "synergia.request.start",
      "synergia.request.success",
    ]);
    expectNoSecrets(records);
  });

  it("preserves explicit nested Synergia logger overrides", async () => {
    const sessionLogger = createLogger();
    const nestedLogger = createLogger();
    const child = {
      id: 1,
      accountIdentifier: "child-1",
      group: "parent",
      login: "child-login",
      studentName: "Child Name",
      accessToken: "token-secret",
      state: "active",
    };
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(createGradesResponse());
    const session = new LibrusSession({
      apiBackend: "api_v3",
      credentials: {
        email: "parent@example.com",
        password: "super-secret",
      },
      logger: sessionLogger.logger,
      synergiaClientOptions: {
        fetch: fetchMock,
        logger: nestedLogger.logger,
      },
    });
    const client = await session.forChild(child);

    await client.getGrades();

    expect(sessionLogger.records).toEqual([]);
    expect(nestedLogger.records.map((record) => record.event)).toEqual([
      "synergia.request.start",
      "synergia.request.success",
    ]);
    expectNoSecrets(nestedLogger.records);
  });
});
