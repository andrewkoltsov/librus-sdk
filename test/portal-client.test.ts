import { describe, expect, it, vi } from "vitest";

import { extractPortalCsrfToken } from "../src/sdk/auth/csrf.js";
import { PortalClient } from "../src/sdk/portal/PortalClient.js";

describe("extractPortalCsrfToken", () => {
  it("extracts the hidden _token value", () => {
    const html = '<form><input type="hidden" name="_token" value="csrf-token-123"></form>';

    expect(extractPortalCsrfToken(html)).toBe("csrf-token-123");
  });
});

describe("PortalClient", () => {
  it("returns typed synergia accounts response", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response('<input type="hidden" name="_token" value="csrf-token-123">', {
          status: 200,
        }),
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
    await client.login({ email: "parent@example.com", password: "super-secret" });
    const response = await client.getSynergiaAccounts();

    expect(response.lastModification).toBe(123);
    expect(response.accounts).toHaveLength(1);
    expect(response.accounts[0]?.login).toBe("child-login");
  });
});
