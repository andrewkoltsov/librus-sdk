import { describe, expect, it, vi } from "vitest";

import { extractPortalCsrfToken } from "../src/sdk/auth/csrf.js";
import { LibrusSdkError } from "../src/sdk/models/errors.js";
import { PortalClient } from "../src/sdk/portal/PortalClient.js";

function createLoginFetchMock(meResponse: Response | Error) {
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
    .mockResolvedValueOnce(
      new Response("", {
        status: 200,
      }),
    );

  if (meResponse instanceof Error) {
    fetchMock.mockRejectedValueOnce(meResponse);
  } else {
    fetchMock.mockResolvedValueOnce(meResponse);
  }

  return fetchMock;
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

describe("extractPortalCsrfToken", () => {
  it("extracts the hidden _token value", () => {
    const html =
      '<form><input type="hidden" name="_token" value="csrf-token-123"></form>';

    expect(extractPortalCsrfToken(html)).toBe("csrf-token-123");
  });

  it("accepts input attributes in a different order", () => {
    const html =
      '<form><input value="csrf-token-123" data-test="login" name="_token" type="hidden"></form>';

    expect(extractPortalCsrfToken(html)).toBe("csrf-token-123");
  });

  it("extracts the token from multiline markup", () => {
    const html = `
      <form>
        <div>
          <input
            type="hidden"
            name="_token"
            value="csrf-token-123"
          >
        </div>
      </form>
    `;

    expect(extractPortalCsrfToken(html)).toBe("csrf-token-123");
  });

  it("throws a portal page error when the token is missing", () => {
    const html =
      '<form><input type="hidden" name="session" value="secret-cookie"></form>';

    expect(() => extractPortalCsrfToken(html)).toThrowError(
      expect.objectContaining({
        code: "PORTAL_LOGIN_PAGE_INVALID",
        message:
          "Portal login page no longer contains the expected CSRF token.",
      }),
    );
  });

  it("ignores similarly named inputs", () => {
    const html =
      '<form><input type="hidden" name="_token_hint" value="wrong"></form>';

    expect(() => extractPortalCsrfToken(html)).toThrowError(
      expect.objectContaining({
        code: "PORTAL_LOGIN_PAGE_INVALID",
      }),
    );
  });
});

describe("PortalClient", () => {
  it("fails fast for invalid requestTimeoutMs values", () => {
    expect(() => {
      new PortalClient({
        requestTimeoutMs: 0,
      });
    }).toThrowError(
      expect.objectContaining({
        code: "CONFIGURATION_ERROR",
      }),
    );
  });

  it("returns typed synergia accounts response", async () => {
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
      .mockResolvedValueOnce(
        new Response("", {
          status: 200,
        }),
      )
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
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            lastModification: 123,
            accounts: [
              {
                id: 10,
                accountIdentifier: "abc",
                group: "parent",
                login: "child-login",
                studentName: "Child Name",
                accessToken: "secret",
                state: "active",
              },
            ],
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
      );

    const client = new PortalClient({ fetch: fetchMock });
    await client.login({
      email: "parent@example.com",
      password: "super-secret",
    });
    const response = await client.getSynergiaAccounts();

    expect(response.lastModification).toBe(123);
    expect(response.accounts).toHaveLength(1);
    expect(response.accounts[0]?.login).toBe("child-login");
  });

  it("accepts SynergiaAccounts payloads with empty-string scopes and normalizes them away", async () => {
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
      .mockResolvedValueOnce(
        new Response("", {
          status: 200,
        }),
      )
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
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            lastModification: 123,
            accounts: [
              {
                id: 10,
                accountIdentifier: "abc",
                group: "parent",
                login: "child-login",
                studentName: "Child Name",
                accessToken: "secret",
                state: "active",
                scopes: "",
              },
            ],
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
      );

    const client = new PortalClient({ fetch: fetchMock });
    await client.login({
      email: "parent@example.com",
      password: "super-secret",
    });
    const response = await client.getSynergiaAccounts();

    expect(response.accounts).toHaveLength(1);
    expect(response.accounts[0]).not.toHaveProperty("scopes");
  });

  it("maps 401 verification failures to authentication errors", async () => {
    const fetchMock = createLoginFetchMock(
      new Response("", {
        status: 401,
      }),
    );

    const client = new PortalClient({ fetch: fetchMock });

    await expect(
      client.login({ email: "parent@example.com", password: "super-secret" }),
    ).rejects.toMatchObject({
      code: "AUTHENTICATION_FAILED",
    });
    expect(client.isLoggedIn()).toBe(false);
  });

  it("preserves 403 verification failures as API errors", async () => {
    const fetchMock = createLoginFetchMock(
      new Response("", {
        status: 403,
      }),
    );

    const client = new PortalClient({ fetch: fetchMock });

    await expect(
      client.login({ email: "parent@example.com", password: "super-secret" }),
    ).rejects.toMatchObject({
      code: "API_REQUEST_FAILED",
      details: {
        endpoint: "https://portal.librus.pl/api/v3/Me",
        status: 403,
      },
    });
    expect(client.isLoggedIn()).toBe(false);
  });

  it("preserves non-auth portal API failures during login verification", async () => {
    const fetchMock = createLoginFetchMock(
      new Response("", {
        status: 503,
      }),
    );

    const client = new PortalClient({ fetch: fetchMock });

    await expect(
      client.login({ email: "parent@example.com", password: "super-secret" }),
    ).rejects.toMatchObject({
      code: "API_REQUEST_FAILED",
      details: {
        endpoint: "https://portal.librus.pl/api/v3/Me",
        status: 503,
      },
    });
    expect(client.isLoggedIn()).toBe(false);
  });

  it("preserves non-Librus verification errors during login", async () => {
    const fetchMock = createLoginFetchMock(new TypeError("network down"));
    const client = new PortalClient({ fetch: fetchMock });

    await expect(
      client.login({ email: "parent@example.com", password: "super-secret" }),
    ).rejects.toThrow("network down");
    expect(client.isLoggedIn()).toBe(false);
  });

  it("times out hanging login-page requests with a secret-safe error", async () => {
    vi.useFakeTimers();

    try {
      const fetchMock = createAbortAwareHangingFetch();
      const client = new PortalClient({
        fetch: fetchMock,
        requestTimeoutMs: 5,
      });
      const loginPromise = client.login({
        email: "parent@example.com",
        password: "super-secret",
      });
      const loginErrorPromise = loginPromise.catch((error: unknown) => error);
      const loginExpectation = expect(loginErrorPromise).resolves.toMatchObject(
        {
          code: "NETWORK_TIMEOUT",
          message: "Librus request timed out after 5ms.",
          details: {
            endpoint: "https://portal.librus.pl/konto-librus/login",
            timeoutMs: 5,
          },
        },
      );

      await vi.advanceTimersByTimeAsync(5);

      const loginError = await loginErrorPromise;

      await loginExpectation;
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(client.isLoggedIn()).toBe(false);
      expect(JSON.stringify(loginError)).not.toContain("super-secret");
      expect(JSON.stringify(loginError)).not.toContain("parent@example.com");
    } finally {
      vi.useRealTimers();
    }
  });

  it("fails with a secret-safe portal page error when the login form has no CSRF token", async () => {
    const rawHtml = '<html><input name="session" value="secret-cookie"></html>';
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(rawHtml, { status: 200 }));

    const client = new PortalClient({ fetch: fetchMock });

    const error = await client
      .login({ email: "parent@example.com", password: "super-secret" })
      .catch((loginError: unknown) => loginError);

    expect(error).toMatchObject({
      code: "PORTAL_LOGIN_PAGE_INVALID",
      message: "Portal login page no longer contains the expected CSRF token.",
    });
    expect(String((error as Error).message)).not.toContain(rawHtml);
  });

  it("fails with a validation error when /Me returns an unexpected payload", async () => {
    const fetchMock = createLoginFetchMock(
      new Response(
        JSON.stringify({
          identifier: "wrong-type",
          email: "parent@example.com",
          accessToken: "token-secret",
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    );

    const client = new PortalClient({ fetch: fetchMock });

    try {
      await client.login({
        email: "parent@example.com",
        password: "super-secret",
      });
      throw new Error("Expected login to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(LibrusSdkError);
      expect(error).toMatchObject({
        code: "RESPONSE_VALIDATION_FAILED",
        details: {
          endpoint: "https://portal.librus.pl/api/v3/Me",
        },
      });
      expect(Array.isArray((error as LibrusSdkError).details?.issues)).toBe(
        true,
      );
    }
  });

  it("fails with a validation error when SynergiaAccounts is malformed", async () => {
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
      .mockResolvedValueOnce(
        new Response("", {
          status: 200,
        }),
      )
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
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            lastModification: 123,
            accounts: [
              {
                id: 10,
                accountIdentifier: "abc",
                group: "parent",
                login: 42,
                studentName: "Child Name",
                accessToken: "secret",
                state: "active",
              },
            ],
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
      );

    const client = new PortalClient({ fetch: fetchMock });
    await client.login({
      email: "parent@example.com",
      password: "super-secret",
    });

    try {
      await client.getSynergiaAccounts();
      throw new Error("Expected getSynergiaAccounts to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(LibrusSdkError);
      expect(error).toMatchObject({
        code: "RESPONSE_VALIDATION_FAILED",
        details: {
          endpoint: "https://portal.librus.pl/api/v3/SynergiaAccounts",
        },
      });
      expect(Array.isArray((error as LibrusSdkError).details?.issues)).toBe(
        true,
      );
    }
  });
});
