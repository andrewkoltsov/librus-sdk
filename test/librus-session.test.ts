import { describe, expect, it, vi } from "vitest";

import { LibrusSession } from "../src/sdk/LibrusSession.js";
import { PortalClient } from "../src/sdk/portal/PortalClient.js";

function createPortalClientStub(
  accounts: Array<Record<string, unknown>>,
): PortalClient {
  return {
    isLoggedIn: () => true,
    login: vi.fn(),
    getMe: vi.fn(),
    getSynergiaAccounts: vi.fn().mockResolvedValue({
      lastModification: 456,
      accounts,
    }),
  } as unknown as PortalClient;
}

describe("LibrusSession.resolveChild", () => {
  it("matches child by id first", async () => {
    const session = new LibrusSession({
      credentials: { email: "parent@example.com", password: "secret" },
      portalClient: createPortalClientStub([
        {
          id: 101,
          accountIdentifier: "one",
          group: "parent",
          login: "duplicate",
          studentName: "One",
          accessToken: "token-1",
          state: "active",
        },
      ]),
    });

    const child = await session.resolveChild("101");

    expect(child.id).toBe(101);
  });

  it("matches child by exact login", async () => {
    const session = new LibrusSession({
      credentials: { email: "parent@example.com", password: "secret" },
      portalClient: createPortalClientStub([
        {
          id: 101,
          accountIdentifier: "one",
          group: "parent",
          login: "child-a",
          studentName: "One",
          accessToken: "token-1",
          state: "active",
        },
      ]),
    });

    const child = await session.resolveChild("child-a");

    expect(child.login).toBe("child-a");
  });

  it("fails when no child matches", async () => {
    const session = new LibrusSession({
      credentials: { email: "parent@example.com", password: "secret" },
      portalClient: createPortalClientStub([]),
    });

    await expect(session.resolveChild("missing")).rejects.toMatchObject({
      code: "CHILD_NOT_FOUND",
    });
  });

  it("fails when login matches multiple children", async () => {
    const session = new LibrusSession({
      credentials: { email: "parent@example.com", password: "secret" },
      portalClient: createPortalClientStub([
        {
          id: 101,
          accountIdentifier: "one",
          group: "parent",
          login: "shared",
          studentName: "One",
          accessToken: "token-1",
          state: "active",
        },
        {
          id: 202,
          accountIdentifier: "two",
          group: "parent",
          login: "shared",
          studentName: "Two",
          accessToken: "token-2",
          state: "active",
        },
      ]),
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
});
