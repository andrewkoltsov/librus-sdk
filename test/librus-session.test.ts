import { describe, expect, it, vi } from "vitest";

import {
  LibrusConfigurationError,
  LibrusSession,
  type ChildAccount,
} from "../src/sdk/index.js";
import { PortalClient } from "../src/sdk/portal/PortalClient.js";

function createChild(overrides: Partial<ChildAccount> = {}): ChildAccount {
  return {
    id: 101,
    accountIdentifier: "child-101",
    group: "parent",
    login: "child-login",
    studentName: "Child Name",
    accessToken: "token-101",
    state: "active",
    ...overrides,
  };
}

function createPortalClientStub(
  options: {
    accounts?: ChildAccount[];
    isLoggedIn?: boolean;
    me?: Record<string, unknown>;
  } = {},
): {
  getMe: ReturnType<typeof vi.fn>;
  getSynergiaAccounts: ReturnType<typeof vi.fn>;
  login: ReturnType<typeof vi.fn>;
  portalClient: PortalClient;
} {
  const login = vi.fn().mockResolvedValue(undefined);
  const getMe = vi.fn().mockResolvedValue(
    options.me ?? {
      email: "parent@example.com",
      identifier: 1,
    },
  );
  const getSynergiaAccounts = vi.fn().mockResolvedValue({
    accounts: options.accounts ?? [],
    lastModification: 456,
  });

  return {
    getMe,
    getSynergiaAccounts,
    login,
    portalClient: {
      isLoggedIn: () => options.isLoggedIn ?? true,
      login,
      getMe,
      getSynergiaAccounts,
    } as unknown as PortalClient,
  };
}

function readSessionCredentials(session: LibrusSession): {
  email: string;
  password: string;
} {
  return (
    session as unknown as {
      credentials: { email: string; password: string };
    }
  ).credentials;
}

function readPortalClientRequestTimeoutMs(session: LibrusSession): number {
  return (
    session as unknown as {
      portalClient: {
        requestTimeoutMs: number;
      };
    }
  ).portalClient.requestTimeoutMs;
}

function readSynergiaClientRequestTimeoutMs(client: unknown): number {
  return (
    client as {
      requestTimeoutMs: number;
    }
  ).requestTimeoutMs;
}

function captureConfigurationError(
  callback: () => unknown,
): LibrusConfigurationError {
  try {
    callback();
  } catch (error) {
    expect(error).toBeInstanceOf(LibrusConfigurationError);
    return error as LibrusConfigurationError;
  }

  throw new Error("Expected LibrusConfigurationError to be thrown.");
}

function withTemporaryPortalEnv<T>(
  env: Partial<
    Record<
      | "LIBRUS_EMAIL"
      | "LIBRUS_PASSWORD"
      | "LIBRUS_PORTAL_EMAIL"
      | "LIBRUS_PORTAL_PASSWORD"
      | "LIBRUS_TIMEOUT_MS",
      string | undefined
    >
  >,
  callback: () => T,
): T {
  const previous = {
    LIBRUS_EMAIL: process.env.LIBRUS_EMAIL,
    LIBRUS_PASSWORD: process.env.LIBRUS_PASSWORD,
    LIBRUS_PORTAL_EMAIL: process.env.LIBRUS_PORTAL_EMAIL,
    LIBRUS_PORTAL_PASSWORD: process.env.LIBRUS_PORTAL_PASSWORD,
    LIBRUS_TIMEOUT_MS: process.env.LIBRUS_TIMEOUT_MS,
  };

  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) {
      delete process.env[key];
      continue;
    }

    process.env[key] = value;
  }

  try {
    return callback();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[key];
        continue;
      }

      process.env[key] = value;
    }
  }
}

describe("LibrusSession.fromEnv", () => {
  it("prefers portal-prefixed environment variables", () => {
    const session = LibrusSession.fromEnv({
      LIBRUS_EMAIL: "compat@example.com",
      LIBRUS_PASSWORD: "compat-secret",
      LIBRUS_PORTAL_EMAIL: "portal@example.com",
      LIBRUS_PORTAL_PASSWORD: "portal-secret",
    });

    expect(readSessionCredentials(session)).toEqual({
      email: "portal@example.com",
      password: "portal-secret",
    });
  });

  it("falls back to compatibility environment variables", () => {
    const session = LibrusSession.fromEnv({
      LIBRUS_EMAIL: "compat@example.com",
      LIBRUS_PASSWORD: "compat-secret",
    });

    expect(readSessionCredentials(session)).toEqual({
      email: "compat@example.com",
      password: "compat-secret",
    });
  });

  it("reads credentials from process.env when no env argument is provided", () => {
    const session = withTemporaryPortalEnv(
      {
        LIBRUS_EMAIL: undefined,
        LIBRUS_PASSWORD: undefined,
        LIBRUS_PORTAL_EMAIL: "process@example.com",
        LIBRUS_PORTAL_PASSWORD: "process-secret",
      },
      () => LibrusSession.fromEnv(),
    );

    expect(readSessionCredentials(session)).toEqual({
      email: "process@example.com",
      password: "process-secret",
    });
  });

  it("reads LIBRUS_TIMEOUT_MS from env and applies it to portal and child clients", async () => {
    const session = LibrusSession.fromEnv({
      LIBRUS_PORTAL_EMAIL: "portal@example.com",
      LIBRUS_PORTAL_PASSWORD: "portal-secret",
      LIBRUS_TIMEOUT_MS: "250",
    });
    const childClient = await session.forChild(createChild());

    expect(readPortalClientRequestTimeoutMs(session)).toBe(250);
    expect(readSynergiaClientRequestTimeoutMs(childClient)).toBe(250);
  });

  it("fails when the email is missing", () => {
    const error = captureConfigurationError(() =>
      LibrusSession.fromEnv({
        LIBRUS_PORTAL_PASSWORD: "portal-secret",
      }),
    );

    expect(error).toMatchObject({
      code: "CONFIGURATION_ERROR",
      message:
        "Missing portal credentials. Email: LIBRUS_PORTAL_EMAIL is unset; fallback LIBRUS_EMAIL is unset.",
    });
  });

  it("fails when the password is missing", () => {
    const error = captureConfigurationError(() =>
      LibrusSession.fromEnv({
        LIBRUS_PORTAL_EMAIL: "portal@example.com",
      }),
    );

    expect(error).toMatchObject({
      code: "CONFIGURATION_ERROR",
      message:
        "Missing portal credentials. Password: LIBRUS_PORTAL_PASSWORD is unset; fallback LIBRUS_PASSWORD is unset.",
    });
  });

  it("reports all credential env names when all credentials are unset", () => {
    const error = captureConfigurationError(() => LibrusSession.fromEnv({}));

    expect(error.message).toBe(
      "Missing portal credentials. Email: LIBRUS_PORTAL_EMAIL is unset; fallback LIBRUS_EMAIL is unset. Password: LIBRUS_PORTAL_PASSWORD is unset; fallback LIBRUS_PASSWORD is unset.",
    );
  });

  it("reports empty primary credential env vars without falling back", () => {
    const error = captureConfigurationError(() =>
      LibrusSession.fromEnv({
        LIBRUS_EMAIL: "compat@example.com",
        LIBRUS_PASSWORD: "compat-secret",
        LIBRUS_PORTAL_EMAIL: "",
        LIBRUS_PORTAL_PASSWORD: "",
      }),
    );

    expect(error.message).toBe(
      "Missing portal credentials. Email: LIBRUS_PORTAL_EMAIL is empty; fallback LIBRUS_EMAIL is ignored because LIBRUS_PORTAL_EMAIL is set. Password: LIBRUS_PORTAL_PASSWORD is empty; fallback LIBRUS_PASSWORD is ignored because LIBRUS_PORTAL_PASSWORD is set.",
    );
  });

  it("does not include credential values in missing credential errors", () => {
    const error = captureConfigurationError(() =>
      LibrusSession.fromEnv({
        LIBRUS_EMAIL: "compat.secret@example.com",
        LIBRUS_PASSWORD: "compat-password-secret",
        LIBRUS_PORTAL_EMAIL: "",
      }),
    );

    expect(error.message).not.toContain("compat.secret@example.com");
    expect(error.message).not.toContain("compat-password-secret");
  });

  it("fails when LIBRUS_TIMEOUT_MS is invalid", () => {
    expect(() =>
      LibrusSession.fromEnv({
        LIBRUS_PORTAL_EMAIL: "portal@example.com",
        LIBRUS_PORTAL_PASSWORD: "portal-secret",
        LIBRUS_TIMEOUT_MS: "0",
      }),
    ).toThrowError(
      expect.objectContaining({
        code: "CONFIGURATION_ERROR",
        message:
          "Invalid LIBRUS_TIMEOUT_MS. Expected a positive integer number of milliseconds.",
      }),
    );
  });
});

describe("LibrusSession.resolveChild", () => {
  it("matches child by id first", async () => {
    const { portalClient } = createPortalClientStub({
      accounts: [
        createChild({
          accountIdentifier: "one",
          login: "duplicate",
          studentName: "One",
        }),
      ],
    });
    const session = new LibrusSession({
      credentials: { email: "parent@example.com", password: "secret" },
      portalClient,
    });

    const child = await session.resolveChild("101");

    expect(child.id).toBe(101);
  });

  it("matches child by exact login", async () => {
    const { portalClient } = createPortalClientStub({
      accounts: [
        createChild({
          accountIdentifier: "one",
          login: "child-a",
          studentName: "One",
        }),
      ],
    });
    const session = new LibrusSession({
      credentials: { email: "parent@example.com", password: "secret" },
      portalClient,
    });

    const child = await session.resolveChild("child-a");

    expect(child.login).toBe("child-a");
  });

  it("fails when no child matches", async () => {
    const { portalClient } = createPortalClientStub();
    const session = new LibrusSession({
      credentials: { email: "parent@example.com", password: "secret" },
      portalClient,
    });

    await expect(session.resolveChild("missing")).rejects.toMatchObject({
      code: "CHILD_NOT_FOUND",
    });
  });

  it("fails when login matches multiple children", async () => {
    const { portalClient } = createPortalClientStub({
      accounts: [
        createChild({
          id: 101,
          accountIdentifier: "one",
          login: "shared",
          studentName: "One",
          accessToken: "token-1",
        }),
        createChild({
          id: 202,
          accountIdentifier: "two",
          login: "shared",
          studentName: "Two",
          accessToken: "token-2",
        }),
      ],
    });
    const session = new LibrusSession({
      credentials: { email: "parent@example.com", password: "secret" },
      portalClient,
    });

    await expect(session.resolveChild("shared")).rejects.toMatchObject({
      code: "AMBIGUOUS_CHILD",
      details: {
        matches: [
          { id: 101, login: "shared", group: "parent", state: "active" },
          { id: 202, login: "shared", group: "parent", state: "active" },
        ],
      },
    });
  });

  it("logs in before reading portal profile data", async () => {
    const { getMe, login, portalClient } = createPortalClientStub({
      isLoggedIn: false,
      me: {
        email: "parent@example.com",
        identifier: 7,
      },
    });
    const session = new LibrusSession({
      credentials: { email: "parent@example.com", password: "secret" },
      portalClient,
    });

    const me = await session.getPortalMe();

    expect(login).toHaveBeenCalledWith({
      email: "parent@example.com",
      password: "secret",
    });
    expect(getMe).toHaveBeenCalledTimes(1);
    expect(me).toMatchObject({
      email: "parent@example.com",
      identifier: 7,
    });
  });

  it("caches portal child accounts after the first lookup", async () => {
    const { getSynergiaAccounts, portalClient } = createPortalClientStub({
      accounts: [createChild()],
    });
    const session = new LibrusSession({
      credentials: { email: "parent@example.com", password: "secret" },
      portalClient,
    });

    const first = await session.getSynergiaAccounts();
    const second = await session.listChildren();

    expect(getSynergiaAccounts).toHaveBeenCalledTimes(1);
    expect(first.accounts).toHaveLength(1);
    expect(second).toHaveLength(1);
  });

  it("creates a child-scoped API client when given a child object directly", async () => {
    const child = createChild({
      accessToken: "child-access-token",
    });
    const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;

      expect(url).toBe("https://api.librus.pl/3.0/Grades");
      expect(init?.headers).toMatchObject({
        accept: "application/json",
        authorization: "Bearer child-access-token",
      });

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
    });
    const session = new LibrusSession({
      credentials: { email: "parent@example.com", password: "secret" },
      synergiaClientOptions: { fetch: fetchMock },
    });

    const client = await session.forChild(child);
    const grades = await client.getGrades();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(grades.Grades).toEqual([]);
  });

  it("applies the session timeout to internally created clients by default", async () => {
    const session = new LibrusSession({
      credentials: { email: "parent@example.com", password: "secret" },
      requestTimeoutMs: 123,
    });
    const childClient = await session.forChild(createChild());

    expect(readPortalClientRequestTimeoutMs(session)).toBe(123);
    expect(readSynergiaClientRequestTimeoutMs(childClient)).toBe(123);
  });

  it("lets portal and synergia client options override the session timeout", async () => {
    const session = new LibrusSession({
      credentials: { email: "parent@example.com", password: "secret" },
      requestTimeoutMs: 123,
      portalClientOptions: {
        fetch: vi.fn<typeof fetch>(),
        requestTimeoutMs: 456,
      },
      synergiaClientOptions: {
        fetch: vi.fn<typeof fetch>(),
        requestTimeoutMs: 789,
      },
    });
    const childClient = await session.forChild(createChild());

    expect(readPortalClientRequestTimeoutMs(session)).toBe(456);
    expect(readSynergiaClientRequestTimeoutMs(childClient)).toBe(789);
  });

  it("keeps a supplied portal client timeout and still applies the session timeout to child clients", async () => {
    const portalClient = new PortalClient({
      fetch: vi.fn<typeof fetch>(),
      requestTimeoutMs: 456,
    });
    const session = new LibrusSession({
      credentials: { email: "parent@example.com", password: "secret" },
      portalClient,
      requestTimeoutMs: 123,
    });
    const childClient = await session.forChild(createChild());

    expect(readPortalClientRequestTimeoutMs(session)).toBe(456);
    expect(readSynergiaClientRequestTimeoutMs(childClient)).toBe(123);
  });
});
