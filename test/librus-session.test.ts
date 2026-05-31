import { describe, expect, it, vi } from "vitest";

import {
  CODE_AUTH_REFRESH_FAILED,
  LibrusApiError,
  LibrusAuthenticationError,
  LibrusConfigurationError,
  LibrusSession,
  SynergiaApiClient,
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
  getFreshSynergiaAccount: ReturnType<typeof vi.fn>;
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
  const getFreshSynergiaAccount = vi
    .fn()
    .mockImplementation((login: string) =>
      Promise.resolve(
        options.accounts?.find((account) => account.login === login) ??
          createChild({ accessToken: "fresh-child-token", login }),
      ),
    );

  return {
    getFreshSynergiaAccount,
    getMe,
    getSynergiaAccounts,
    login,
    portalClient: {
      isLoggedIn: () => options.isLoggedIn ?? true,
      login,
      getMe,
      getFreshSynergiaAccount,
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
      portalCredentials: { email: string; password: string };
    }
  ).portalCredentials;
}

function readGatewayCredentials(session: LibrusSession): {
  login: string;
  password: string;
} {
  return (
    session as unknown as {
      gatewayCredentials: { login: string; password: string };
    }
  ).gatewayCredentials;
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

function captureDeprecationWarnings<T>(callback: () => T): {
  result: T;
  warnings: Parameters<typeof process.emitWarning>[];
} {
  const emitWarning = vi
    .spyOn(process, "emitWarning")
    .mockImplementation(() => undefined);

  try {
    return {
      result: callback(),
      warnings: emitWarning.mock.calls,
    };
  } finally {
    emitWarning.mockRestore();
  }
}

function expectDeprecationWarning(
  warnings: Parameters<typeof process.emitWarning>[],
  code: string,
): void {
  expect(warnings).toEqual(
    expect.arrayContaining([
      expect.arrayContaining([
        expect.any(String),
        expect.objectContaining({
          code,
          type: "DeprecationWarning",
        }),
      ]),
    ]),
  );
}

function withTemporaryPortalEnv<T>(
  env: Partial<
    Record<
      | "LIBRUS_EMAIL"
      | "LIBRUS_PASSWORD"
      | "LIBRUS_PORTAL_EMAIL"
      | "LIBRUS_PORTAL_PASSWORD"
      | "LIBRUS_TIMEOUT_MS"
      | "LIBRUS_API_BACKEND"
      | "LIBRUS_AUTH_MODE"
      | "LIBRUS_GATEWAY_LOGIN"
      | "LIBRUS_GATEWAY_PASSWORD"
      | "SYNERGIA_ID"
      | "SYNERGIA_PASSWORD",
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
    LIBRUS_API_BACKEND: process.env.LIBRUS_API_BACKEND,
    LIBRUS_AUTH_MODE: process.env.LIBRUS_AUTH_MODE,
    LIBRUS_GATEWAY_LOGIN: process.env.LIBRUS_GATEWAY_LOGIN,
    LIBRUS_GATEWAY_PASSWORD: process.env.LIBRUS_GATEWAY_PASSWORD,
    SYNERGIA_ID: process.env.SYNERGIA_ID,
    SYNERGIA_PASSWORD: process.env.SYNERGIA_PASSWORD,
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
      LIBRUS_GATEWAY_LOGIN: "1234567",
      LIBRUS_GATEWAY_PASSWORD: "gateway-secret",
    });

    expect(session.getApiBackend()).toBe("api_v3");
    expect(readSessionCredentials(session)).toEqual({
      email: "portal@example.com",
      password: "portal-secret",
    });
  });

  it("falls back to compatibility environment variables", () => {
    const { result: session, warnings } = captureDeprecationWarnings(() =>
      LibrusSession.fromEnv({
        LIBRUS_EMAIL: "compat@example.com",
        LIBRUS_PASSWORD: "compat-secret",
      }),
    );

    expectDeprecationWarning(warnings, "LIBRUS_EMAIL_ENV_DEPRECATED");
    expectDeprecationWarning(warnings, "LIBRUS_PASSWORD_ENV_DEPRECATED");

    expect(session.getApiBackend()).toBe("api_v3");
    expect(readSessionCredentials(session)).toEqual({
      email: "compat@example.com",
      password: "compat-secret",
    });
  });

  it("uses gateway credentials when portal credentials are absent", () => {
    const session = LibrusSession.fromEnv({
      LIBRUS_GATEWAY_LOGIN: "1234567",
      LIBRUS_GATEWAY_PASSWORD: "gateway-secret",
    });

    expect(session.getApiBackend()).toBe("gateway_api_20");
    expect(readGatewayCredentials(session)).toEqual({
      login: "1234567",
      password: "gateway-secret",
    });
  });

  it("lets portal credentials win when both backends are configured", () => {
    const session = LibrusSession.fromEnv({
      LIBRUS_PORTAL_EMAIL: "portal@example.com",
      LIBRUS_PORTAL_PASSWORD: "portal-secret",
      LIBRUS_GATEWAY_LOGIN: "1234567",
      LIBRUS_GATEWAY_PASSWORD: "gateway-secret",
    });

    expect(session.getApiBackend()).toBe("api_v3");
    expect(readSessionCredentials(session)).toEqual({
      email: "portal@example.com",
      password: "portal-secret",
    });
  });

  it("lets LIBRUS_API_BACKEND select gateway_api_20 when both backends are configured", () => {
    const session = LibrusSession.fromEnv({
      LIBRUS_API_BACKEND: "gateway_api_20",
      LIBRUS_PORTAL_EMAIL: "portal@example.com",
      LIBRUS_PORTAL_PASSWORD: "portal-secret",
      LIBRUS_GATEWAY_LOGIN: "1234567",
      LIBRUS_GATEWAY_PASSWORD: "gateway-secret",
    });

    expect(session.getApiBackend()).toBe("gateway_api_20");
    expect(readGatewayCredentials(session)).toEqual({
      login: "1234567",
      password: "gateway-secret",
    });
  });

  it("lets LIBRUS_API_BACKEND win over the compatibility auth mode alias", () => {
    const { result: session, warnings } = captureDeprecationWarnings(() =>
      LibrusSession.fromEnv({
        LIBRUS_API_BACKEND: "api_v3",
        LIBRUS_AUTH_MODE: "synergia",
        LIBRUS_PORTAL_EMAIL: "portal@example.com",
        LIBRUS_PORTAL_PASSWORD: "portal-secret",
        LIBRUS_GATEWAY_LOGIN: "1234567",
        LIBRUS_GATEWAY_PASSWORD: "gateway-secret",
      }),
    );

    expectDeprecationWarning(warnings, "LIBRUS_AUTH_MODE_ENV_DEPRECATED");
    expect(session.getApiBackend()).toBe("api_v3");
    expect(readSessionCredentials(session)).toEqual({
      email: "portal@example.com",
      password: "portal-secret",
    });
  });

  it("accepts the compatibility auth mode alias when LIBRUS_API_BACKEND is unset", () => {
    const session = LibrusSession.fromEnv({
      LIBRUS_AUTH_MODE: "synergia",
      LIBRUS_PORTAL_EMAIL: "portal@example.com",
      LIBRUS_PORTAL_PASSWORD: "portal-secret",
      LIBRUS_GATEWAY_LOGIN: "1234567",
      LIBRUS_GATEWAY_PASSWORD: "gateway-secret",
    });

    expect(session.getApiBackend()).toBe("gateway_api_20");
    expect(readGatewayCredentials(session)).toEqual({
      login: "1234567",
      password: "gateway-secret",
    });
  });

  it("accepts legacy Synergia credential env aliases for gateway_api_20", () => {
    const { result: session, warnings } = captureDeprecationWarnings(() =>
      LibrusSession.fromEnv({
        SYNERGIA_ID: "1234567",
        SYNERGIA_PASSWORD: "gateway-secret",
      }),
    );

    expectDeprecationWarning(warnings, "SYNERGIA_ID_ENV_DEPRECATED");
    expectDeprecationWarning(warnings, "SYNERGIA_PASSWORD_ENV_DEPRECATED");
    expect(session.getApiBackend()).toBe("gateway_api_20");
    expect(readGatewayCredentials(session)).toEqual({
      login: "1234567",
      password: "gateway-secret",
    });
  });

  it("keeps fromSynergiaCredentials as a compatibility alias", () => {
    const { result: session, warnings } = captureDeprecationWarnings(() =>
      LibrusSession.fromSynergiaCredentials({
        id: "1234567",
        password: "gateway-secret",
      }),
    );

    expectDeprecationWarning(
      warnings,
      "LIBRUS_FROM_SYNERGIA_CREDENTIALS_DEPRECATED",
    );
    expect(session.getApiBackend()).toBe("gateway_api_20");
    expect(readGatewayCredentials(session)).toEqual({
      login: "1234567",
      password: "gateway-secret",
    });
  });

  it("keeps getAuthMode as a compatibility alias with a warning", () => {
    const session = LibrusSession.fromEnv({
      LIBRUS_PORTAL_EMAIL: "portal@example.com",
      LIBRUS_PORTAL_PASSWORD: "portal-secret",
    });

    const { result: authMode, warnings } = captureDeprecationWarnings(() =>
      session.getAuthMode(),
    );

    expect(authMode).toBe("portal");
    expectDeprecationWarning(warnings, "LIBRUS_GET_AUTH_MODE_DEPRECATED");
  });

  it("accepts id-shaped gateway credentials in the constructor as a deprecated alias", () => {
    const { result: session, warnings } = captureDeprecationWarnings(
      () =>
        new LibrusSession({
          apiBackend: "gateway_api_20",
          credentials: {
            id: "1234567",
            password: "gateway-secret",
          },
        }),
    );

    expect(session.getApiBackend()).toBe("gateway_api_20");
    expect(readGatewayCredentials(session)).toEqual({
      login: "1234567",
      password: "gateway-secret",
    });
    expectDeprecationWarning(
      warnings,
      "LIBRUS_SYNERGIA_CREDENTIALS_ID_DEPRECATED",
    );
  });

  it("rejects gateway credentials in api_v3 sessions", () => {
    const error = captureConfigurationError(
      () =>
        new LibrusSession({
          apiBackend: "api_v3",
          credentials: {
            login: "1234567",
            password: "gateway-secret",
          },
        }),
    );

    expect(error).toMatchObject({
      code: "CONFIGURATION_ERROR",
      message: "api_v3 credentials require email and password.",
    });
  });

  it("rejects portal credentials in gateway_api_20 sessions", () => {
    const error = captureConfigurationError(
      () =>
        new LibrusSession({
          apiBackend: "gateway_api_20",
          credentials: {
            email: "portal@example.com",
            password: "portal-secret",
          },
        }),
    );

    expect(error).toMatchObject({
      code: "CONFIGURATION_ERROR",
      message: "gateway_api_20 credentials require login and password.",
    });
  });

  it("does not treat deprecated LIBRUS_EMAIL as a Synergia id", () => {
    const session = LibrusSession.fromEnv({
      LIBRUS_EMAIL: "1234567",
      LIBRUS_PASSWORD: "compat-secret",
    });

    expect(session.getApiBackend()).toBe("api_v3");
    expect(readSessionCredentials(session)).toEqual({
      email: "1234567",
      password: "compat-secret",
    });
  });

  it("reports missing gateway credentials when gateway_api_20 is explicit", () => {
    const error = captureConfigurationError(() =>
      LibrusSession.fromEnv({
        LIBRUS_API_BACKEND: "gateway_api_20",
        LIBRUS_GATEWAY_LOGIN: "1234567",
      }),
    );

    expect(error).toMatchObject({
      code: "CONFIGURATION_ERROR",
      message:
        "Missing gateway API 2.0 credentials. Password: LIBRUS_GATEWAY_PASSWORD is unset.",
    });
  });

  it("fails when LIBRUS_API_BACKEND is invalid", () => {
    const error = captureConfigurationError(() =>
      LibrusSession.fromEnv({
        LIBRUS_API_BACKEND: "synergia",
        LIBRUS_PORTAL_EMAIL: "portal@example.com",
        LIBRUS_PORTAL_PASSWORD: "portal-secret",
      }),
    );

    expect(error).toMatchObject({
      code: "CONFIGURATION_ERROR",
      message:
        'Invalid LIBRUS_API_BACKEND. Expected "api_v3" or "gateway_api_20".',
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
  it("rejects portal-only child discovery in gateway_api_20", async () => {
    const session = LibrusSession.fromGatewayCredentials({
      login: "1234567",
      password: "gateway-secret",
    });

    await expect(session.listChildren()).rejects.toMatchObject({
      code: "UNSUPPORTED_BACKEND",
      details: { apiBackend: "gateway_api_20" },
    });
  });

  it("rejects explicit child selection in gateway_api_20", async () => {
    const session = LibrusSession.fromGatewayCredentials({
      login: "1234567",
      password: "gateway-secret",
    });

    await expect(session.forChild("101")).rejects.toMatchObject({
      code: "UNSUPPORTED_BACKEND",
      details: { apiBackend: "gateway_api_20" },
    });
  });

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

  it("uses API 3.0 for session-created message reads by default", async () => {
    const child = createChild({
      accessToken: "child-access-token",
    });
    const { getFreshSynergiaAccount, portalClient } = createPortalClientStub({
      accounts: [child],
    });
    const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;

      expect(url).toBe(
        "https://api.librus.pl/3.0/Messages?alternativeBody=true&changeNewLine=1&getAllTypes=1&page=1&limit=10",
      );
      expect(init?.headers).toMatchObject({
        accept: "application/json",
        authorization: "Bearer child-access-token",
      });

      return new Response(
        JSON.stringify({
          Messages: [{ Id: 1, Subject: "Hello" }],
          Resources: {},
          Url: "https://api.librus.pl/3.0/Messages",
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      );
    });
    const session = new LibrusSession({
      credentials: { email: "parent@example.com", password: "secret" },
      portalClient,
      synergiaClientOptions: { fetch: fetchMock },
      wiadomosciClientOptions: { fetch: vi.fn<typeof fetch>() },
    });

    const client = await session.forChild(child);
    const messages = await client.listMessages({ limit: 10 });

    expect(getFreshSynergiaAccount).not.toHaveBeenCalled();
    expect(messages).toMatchObject({
      Messages: [{ Id: 1, Subject: "Hello" }],
      Resources: {},
      Url: "https://api.librus.pl/3.0/Messages",
    });
  });

  it("uses the wiadomosci backend for explicit wiadomosci child clients", async () => {
    const child = createChild({
      accessToken: "child-access-token",
    });
    const { getFreshSynergiaAccount, portalClient } = createPortalClientStub({
      accounts: [child],
    });
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ Token: "auto-login-token" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(new Response("", { status: 200 }))
      .mockResolvedValueOnce(new Response("", { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: [{ messageId: 1, topic: "Hello" }],
            total: 1,
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
      );
    const session = new LibrusSession({
      credentials: { email: "parent@example.com", password: "secret" },
      portalClient,
      wiadomosciClientOptions: { fetch: fetchMock },
    });

    const client = await session.forChildWiadomosci(child);
    const messages = await client.listMessages({ limit: 10 });

    expect(getFreshSynergiaAccount).toHaveBeenCalledWith("child-login");
    expect(messages).toMatchObject({
      Messages: [{ Id: 1, Subject: "Hello" }],
      Resources: {},
      Url: "https://wiadomosci.librus.pl/api/inbox/messages?page=1&limit=10",
    });
  });

  it("resolves child selectors for explicit wiadomosci child clients", async () => {
    const child = createChild({
      accessToken: "child-access-token",
    });
    const { getFreshSynergiaAccount, getSynergiaAccounts, portalClient } =
      createPortalClientStub({
        accounts: [child],
      });
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ Token: "auto-login-token" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(new Response("", { status: 200 }))
      .mockResolvedValueOnce(new Response("", { status: 200 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: 3 }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
    const session = new LibrusSession({
      credentials: { email: "parent@example.com", password: "secret" },
      portalClient,
      wiadomosciClientOptions: { fetch: fetchMock },
    });

    const client = await session.forChildWiadomosci("child-login");
    const unread = await client.getUnreadMessages();

    expect(getSynergiaAccounts).toHaveBeenCalledTimes(1);
    expect(getFreshSynergiaAccount).toHaveBeenCalledWith("child-login");
    expect(unread).toMatchObject({
      Resources: {},
      UnreadMessages: 3,
      Url: "https://wiadomosci.librus.pl/api/inbox/unreadMessagesCount",
    });
  });

  it("creates a child-scoped BFF API client when given a child object directly", async () => {
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

      expect(url).toBe("https://testbff.librus.pl/v1/Messages");
      expect(init?.headers).toMatchObject({
        accept: "application/json",
        "x-zse-authorization": "Bearer child-access-token",
      });

      return new Response(
        JSON.stringify({
          inboxMessages: [{ id: "message-1", subject: "Test" }],
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      );
    });
    const session = new LibrusSession({
      bffClientOptions: { fetch: fetchMock },
      credentials: { email: "parent@example.com", password: "secret" },
    });

    const client = await session.forChildBff(child);
    const messages = await client.listMessages();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(messages.inboxMessages).toEqual([
      { id: "message-1", subject: "Test" },
    ]);
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

const REFRESH_SECRETS = {
  email: "parent@example.com",
  password: "super-secret-password",
  staleToken: "stale-bearer-AAA",
  freshToken: "fresh-bearer-BBB",
} as const;

function authHeaderOf(init: RequestInit | undefined): string | undefined {
  return (init?.headers as Record<string, string> | undefined)?.authorization;
}

function unauthorizedResponse(): Response {
  return new Response(JSON.stringify({ error: "expired" }), {
    status: 401,
    headers: { "content-type": "application/json" },
  });
}

function luckyNumberResponse(): Response {
  return new Response(
    JSON.stringify({
      LuckyNumber: { LuckyNumber: 13 },
      Resources: {},
      Url: "https://api.librus.pl/3.0/LuckyNumbers",
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
}

describe("LibrusSession token refresh", () => {
  it("refreshes the bearer token once on a 401 and retries with the fresh token", async () => {
    const child = createChild({
      id: 101,
      login: "child-login",
      accessToken: REFRESH_SECRETS.staleToken,
    });
    const { getFreshSynergiaAccount, portalClient } = createPortalClientStub({
      accounts: [child],
    });
    getFreshSynergiaAccount.mockResolvedValue(
      createChild({
        id: 101,
        login: "child-login",
        accessToken: REFRESH_SECRETS.freshToken,
      }),
    );

    const seenAuth: Array<string | undefined> = [];
    const fetchMock = vi.fn<typeof fetch>(async (_input, init) => {
      seenAuth.push(authHeaderOf(init));

      return seenAuth.length === 1
        ? unauthorizedResponse()
        : luckyNumberResponse();
    });

    const session = new LibrusSession({
      credentials: {
        email: REFRESH_SECRETS.email,
        password: REFRESH_SECRETS.password,
      },
      portalClient,
      synergiaClientOptions: { fetch: fetchMock, retry: false },
    });

    const client = await session.forChild(child);
    const lucky = await client.getLuckyNumber();

    expect(getFreshSynergiaAccount).toHaveBeenCalledTimes(1);
    expect(getFreshSynergiaAccount).toHaveBeenCalledWith("child-login");
    expect(seenAuth).toEqual([
      `Bearer ${REFRESH_SECRETS.staleToken}`,
      `Bearer ${REFRESH_SECRETS.freshToken}`,
    ]);
    expect(lucky.LuckyNumber.LuckyNumber).toBe(13);
  });

  it("collapses concurrent refreshes for the same child into a single portal call", async () => {
    const child = createChild({
      id: 101,
      login: "child-login",
      accessToken: REFRESH_SECRETS.staleToken,
    });
    const { getFreshSynergiaAccount, portalClient } = createPortalClientStub({
      accounts: [child],
    });
    let resolveFresh!: (account: ChildAccount) => void;
    const pendingRefresh = new Promise<ChildAccount>((resolve) => {
      resolveFresh = resolve;
    });
    getFreshSynergiaAccount.mockReturnValue(pendingRefresh);

    const session = new LibrusSession({
      credentials: {
        email: REFRESH_SECRETS.email,
        password: REFRESH_SECRETS.password,
      },
      portalClient,
    });

    // Invoked synchronously in sequence: the first registers the in-flight
    // refresh, the rest must reuse it rather than starting their own.
    const refreshes = Promise.all([
      session.refreshBearerToken(101),
      session.refreshBearerToken(101),
      session.refreshBearerToken("101"),
    ]);

    await vi.waitFor(() => {
      expect(getFreshSynergiaAccount).toHaveBeenCalledTimes(1);
    });
    resolveFresh(
      createChild({
        id: 101,
        login: "child-login",
        accessToken: REFRESH_SECRETS.freshToken,
      }),
    );

    await expect(refreshes).resolves.toEqual([
      REFRESH_SECRETS.freshToken,
      REFRESH_SECRETS.freshToken,
      REFRESH_SECRETS.freshToken,
    ]);
    expect(getFreshSynergiaAccount).toHaveBeenCalledTimes(1);
  });

  it("throws AUTH_REFRESH_FAILED preserving the original 401 when a 401 persists after refresh", async () => {
    const child = createChild({
      id: 101,
      login: "child-login",
      accessToken: REFRESH_SECRETS.staleToken,
    });
    const { getFreshSynergiaAccount, portalClient } = createPortalClientStub({
      accounts: [child],
    });
    getFreshSynergiaAccount.mockResolvedValue(
      createChild({
        id: 101,
        login: "child-login",
        accessToken: REFRESH_SECRETS.freshToken,
      }),
    );
    const fetchMock = vi.fn<typeof fetch>(async () => unauthorizedResponse());

    const session = new LibrusSession({
      credentials: {
        email: REFRESH_SECRETS.email,
        password: REFRESH_SECRETS.password,
      },
      portalClient,
      synergiaClientOptions: { fetch: fetchMock, retry: false },
    });

    const client = await session.forChild(child);
    const error = await client
      .getLuckyNumber()
      .catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(LibrusAuthenticationError);
    expect((error as LibrusAuthenticationError).code).toBe(
      CODE_AUTH_REFRESH_FAILED,
    );
    const cause = (error as LibrusAuthenticationError).cause;
    expect(cause).toBeInstanceOf(LibrusApiError);
    expect((cause as LibrusApiError).details?.status).toBe(401);
    expect(getFreshSynergiaAccount).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("leaves a standalone SynergiaApiClient unchanged on 401 with no refresh", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => unauthorizedResponse());
    const client = new SynergiaApiClient(REFRESH_SECRETS.staleToken, {
      fetch: fetchMock,
      retry: false,
    });

    const error = await client
      .getLuckyNumber()
      .catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(LibrusApiError);
    expect((error as LibrusApiError).code).toBe("API_REQUEST_FAILED");
    expect((error as LibrusApiError).details?.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("never leaks the token or password in logs or errors during a failed refresh", async () => {
    const logs: string[] = [];
    const logger = {
      log: (level: string, event: string, fields?: Record<string, unknown>) => {
        logs.push(JSON.stringify({ level, event, fields }));
      },
    };
    const child = createChild({
      id: 101,
      login: "child-login",
      accessToken: REFRESH_SECRETS.staleToken,
    });
    const { getFreshSynergiaAccount, portalClient } = createPortalClientStub({
      accounts: [child],
    });
    getFreshSynergiaAccount.mockResolvedValue(
      createChild({
        id: 101,
        login: "child-login",
        accessToken: REFRESH_SECRETS.freshToken,
      }),
    );
    const fetchMock = vi.fn<typeof fetch>(async () => unauthorizedResponse());

    const session = new LibrusSession({
      credentials: {
        email: REFRESH_SECRETS.email,
        password: REFRESH_SECRETS.password,
      },
      portalClient,
      logger,
      synergiaClientOptions: { fetch: fetchMock, retry: false },
    });

    const client = await session.forChild(child);
    const error = await client
      .getLuckyNumber()
      .catch((reason: unknown) => reason);

    const haystack = [
      ...logs,
      String(error),
      (error as Error)?.message ?? "",
      (error as Error)?.stack ?? "",
      JSON.stringify((error as LibrusApiError)?.details ?? {}),
    ].join("\n");

    for (const secret of [
      REFRESH_SECRETS.staleToken,
      REFRESH_SECRETS.freshToken,
      REFRESH_SECRETS.password,
    ]) {
      expect(haystack).not.toContain(secret);
    }
  });
});
