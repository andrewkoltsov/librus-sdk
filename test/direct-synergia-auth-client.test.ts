import { describe, expect, it, vi } from "vitest";

import {
  DirectSynergiaAuthClient,
  GatewayApi20AuthClient,
  LibrusAuthenticationError,
} from "../src/sdk/index.js";

function responseJson(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    headers: { "content-type": "application/json" },
    status,
  });
}

function redirectResponse(location: string): Response {
  return new Response("", {
    headers: { location },
    status: 302,
  });
}

function mockSuccessfulLogin(
  fetchMock: ReturnType<typeof vi.fn<typeof fetch>>,
) {
  fetchMock
    .mockResolvedValueOnce(
      redirectResponse(
        "https://api.librus.pl/OAuth/Authorization?client_id=46&response_type=code&scope=mydata&state=test-state",
      ),
    )
    .mockResolvedValueOnce(new Response("<html>prep</html>"))
    .mockResolvedValueOnce(new Response("<html>auth</html>"))
    .mockResolvedValueOnce(responseJson({ status: "ok" }))
    .mockResolvedValueOnce(new Response("", { status: 200 }))
    .mockResolvedValueOnce(new Response("", { status: 200 }))
    .mockResolvedValueOnce(new Response("", { status: 200 }))
    .mockResolvedValueOnce(
      responseJson({
        Resources: {},
        Url: "https://synergia.librus.pl/gateway/api/2.0/Auth/TokenInfo",
        UserIdentifier: "1234567",
      }),
    );
}

function getRequestUrl(input: RequestInfo | URL): string {
  return typeof input === "string"
    ? input
    : input instanceof URL
      ? input.toString()
      : input.url;
}

function getRequestInit(init: RequestInit | undefined): RequestInit {
  return init ?? {};
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

describe("GatewayApi20AuthClient", () => {
  it("keeps DirectSynergiaAuthClient as a compatibility alias with a warning", () => {
    const emitWarning = vi
      .spyOn(process, "emitWarning")
      .mockImplementation(() => undefined);

    try {
      const client = new DirectSynergiaAuthClient();

      expect(client).toBeInstanceOf(GatewayApi20AuthClient);
      expectDeprecationWarning(
        emitWarning.mock.calls,
        "LIBRUS_DIRECT_SYNERGIA_AUTH_CLIENT_CLASS_DEPRECATED",
      );
    } finally {
      emitWarning.mockRestore();
    }
  });

  it("performs the gateway API 2.0 OAuth login sequence", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    mockSuccessfulLogin(fetchMock);
    const client = new GatewayApi20AuthClient({ fetch: fetchMock });

    await client.login({ login: "1234567", password: "super-secret" });

    expect(fetchMock).toHaveBeenCalledTimes(8);
    expect(getRequestUrl(fetchMock.mock.calls[0]![0])).toMatch(
      /^https:\/\/synergia\.librus\.pl\/loguj\/portalRodzina\?v=/,
    );
    expect(getRequestInit(fetchMock.mock.calls[0]![1]).redirect).toBe("manual");
    expect(getRequestUrl(fetchMock.mock.calls[1]![0])).toBe(
      "https://api.librus.pl/OAuth/Authorization?client_id=46&response_type=code&scope=mydata&state=test-state",
    );
    expect(getRequestUrl(fetchMock.mock.calls[2]![0])).toBe(
      "https://api.librus.pl/OAuth/Authorization?client_id=46",
    );
    expect(getRequestUrl(fetchMock.mock.calls[3]![0])).toBe(
      "https://api.librus.pl/OAuth/Authorization?client_id=46",
    );
    expect(getRequestInit(fetchMock.mock.calls[3]![1]).method).toBe("POST");

    const credentialsBody = getRequestInit(fetchMock.mock.calls[3]![1])
      .body as FormData;
    const credentialsHeaders = new Headers(
      getRequestInit(fetchMock.mock.calls[3]![1]).headers,
    );

    expect(credentialsBody).toBeInstanceOf(FormData);
    expect(credentialsBody.get("action")).toBe("login");
    expect(credentialsBody.get("login")).toBe("1234567");
    expect(credentialsBody.get("pass")).toBe("super-secret");
    expect(credentialsHeaders.get("accept")).toBe("application/json");
    expect(credentialsHeaders.get("x-requested-with")).toBe("XMLHttpRequest");
    expect(credentialsHeaders.get("x-baner")).toBeTruthy();
    expect(credentialsHeaders.get("referer")).toBe(
      "https://api.librus.pl/OAuth/Authorization?client_id=46",
    );
    expect(getRequestUrl(fetchMock.mock.calls[4]![0])).toBe(
      "https://api.librus.pl/OAuth/Authorization/PerformLogin?client_id=46",
    );
    expect(getRequestUrl(fetchMock.mock.calls[5]![0])).toBe(
      "https://api.librus.pl/OAuth/Authorization/PerformLogin?client_id=46",
    );
    expect(getRequestUrl(fetchMock.mock.calls[6]![0])).toBe(
      "https://api.librus.pl/OAuth/Authorization/Grant?client_id=46",
    );
    expect(getRequestUrl(fetchMock.mock.calls[7]![0])).toBe(
      "https://synergia.librus.pl/gateway/api/2.0/Auth/TokenInfo",
    );
  });

  it("accepts legacy id-shaped credentials with a warning", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    mockSuccessfulLogin(fetchMock);
    const client = new GatewayApi20AuthClient({ fetch: fetchMock });
    const emitWarning = vi
      .spyOn(process, "emitWarning")
      .mockImplementation(() => undefined);

    try {
      await client.login({ id: "1234567", password: "super-secret" });

      expectDeprecationWarning(
        emitWarning.mock.calls,
        "LIBRUS_SYNERGIA_CREDENTIALS_ID_DEPRECATED",
      );
    } finally {
      emitWarning.mockRestore();
    }
  });

  it("uses the OAuth grant URL even when gateway login returns a continuation hint", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        redirectResponse(
          "https://api.librus.pl/OAuth/Authorization?client_id=46&response_type=code&scope=mydata&state=test-state",
        ),
      )
      .mockResolvedValueOnce(new Response("<html>prep</html>"))
      .mockResolvedValueOnce(new Response("<html>auth</html>"))
      .mockResolvedValueOnce(
        responseJson({
          status: "ok",
          goTo: "/OAuth/Authorization/2FA?client_id=46",
        }),
      )
      .mockResolvedValueOnce(new Response("", { status: 200 }))
      .mockResolvedValueOnce(new Response("", { status: 200 }))
      .mockResolvedValueOnce(new Response("", { status: 200 }))
      .mockResolvedValueOnce(
        responseJson({
          Resources: {},
          Url: "https://synergia.librus.pl/gateway/api/2.0/Auth/TokenInfo",
          UserIdentifier: "1234567",
        }),
      );
    const client = new GatewayApi20AuthClient({ fetch: fetchMock });

    await client.login({ login: "1234567", password: "super-secret" });

    expect(fetchMock).toHaveBeenCalledTimes(8);
    expect(getRequestUrl(fetchMock.mock.calls[6]![0])).toBe(
      "https://api.librus.pl/OAuth/Authorization/Grant?client_id=46",
    );
    expect(getRequestUrl(fetchMock.mock.calls[7]![0])).toBe(
      "https://synergia.librus.pl/gateway/api/2.0/Auth/TokenInfo",
    );
  });

  it("fails invalid gateway credentials without leaking secrets", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        redirectResponse(
          "https://api.librus.pl/OAuth/Authorization?client_id=46&response_type=code&scope=mydata&state=test-state",
        ),
      )
      .mockResolvedValueOnce(new Response("<html>prep</html>"))
      .mockResolvedValueOnce(new Response("<html>auth</html>"))
      .mockResolvedValueOnce(responseJson({ error: "denied" }, 401));
    const client = new GatewayApi20AuthClient({ fetch: fetchMock });
    const error = await client
      .login({ login: "1234567", password: "super-secret" })
      .catch((loginError: unknown) => loginError);

    expect(error).toBeInstanceOf(LibrusAuthenticationError);
    expect(JSON.stringify(error)).not.toContain("1234567");
    expect(JSON.stringify(error)).not.toContain("super-secret");
  });

  it("creates a cookie-mode Synergia API client", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    mockSuccessfulLogin(fetchMock);
    fetchMock.mockResolvedValueOnce(
      responseJson({
        Me: {
          Account: {},
          Class: null,
          Refresh: false,
          User: {},
        },
        Resources: {},
        Url: "https://synergia.librus.pl/gateway/api/2.0/Me",
      }),
    );
    const authClient = new GatewayApi20AuthClient({ fetch: fetchMock });

    await authClient.login({ login: "1234567", password: "super-secret" });
    const apiClient = authClient.createApiClient();
    await apiClient.getMe();

    const apiRequest = fetchMock.mock.calls[8]!;
    const apiHeaders = new Headers(getRequestInit(apiRequest[1]).headers);

    expect(getRequestUrl(apiRequest[0])).toBe(
      "https://synergia.librus.pl/gateway/api/2.0/Me",
    );
    expect(apiHeaders.get("authorization")).toBeNull();
  });
});
