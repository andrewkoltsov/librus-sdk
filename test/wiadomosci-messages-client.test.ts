import { Buffer } from "node:buffer";

import { describe, expect, it, vi } from "vitest";

import type { ChildAccount } from "../src/sdk/index.js";
import { PortalClient } from "../src/sdk/portal/PortalClient.js";
import { WiadomosciMessagesClient } from "../src/sdk/wiadomosci/WiadomosciMessagesClient.js";

const child: ChildAccount = {
  accessToken: "stale-child-token",
  accountIdentifier: "child-101",
  group: "parent",
  id: 101,
  login: "child-login",
  state: "active",
  studentName: "Child Name",
};

function createPortalClientStub(): {
  ensurePortalLogin: ReturnType<typeof vi.fn>;
  getFreshSynergiaAccount: ReturnType<typeof vi.fn>;
  portalClient: PortalClient;
} {
  const ensurePortalLogin = vi.fn().mockResolvedValue(undefined);
  const getFreshSynergiaAccount = vi.fn().mockResolvedValue({
    ...child,
    accessToken: "fresh-child-token",
  });

  return {
    ensurePortalLogin,
    getFreshSynergiaAccount,
    portalClient: {
      getFreshSynergiaAccount,
    } as unknown as PortalClient,
  };
}

function responseJson(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function responseText(
  body = "",
  status = 200,
  headers: HeadersInit = {},
): Response {
  return new Response(body, {
    status,
    headers,
  });
}

function requestUrls(fetchMock: {
  mock: { calls: Parameters<typeof fetch>[] };
}): string[] {
  return fetchMock.mock.calls.map(([input]) =>
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url,
  );
}

describe("WiadomosciMessagesClient", () => {
  it("authenticates and normalizes inbox messages", async () => {
    const { ensurePortalLogin, getFreshSynergiaAccount, portalClient } =
      createPortalClientStub();
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(responseJson({ Token: "auto-login-token" }))
      .mockResolvedValueOnce(responseText())
      .mockResolvedValueOnce(responseText())
      .mockResolvedValueOnce(
        responseJson({
          data: [
            {
              content: "Hello<br>World",
              messageId: 151,
              readDate: "2026-03-31 16:28:31",
              sendDate: "2026-03-31 16:28:30",
              senderId: 22,
              senderName: "Teacher Name",
              topic: "Topic",
            },
          ],
          total: 1,
        }),
      );
    const client = new WiadomosciMessagesClient(child, {
      ensurePortalLogin,
      fetch: fetchMock,
      portalClient,
    });
    const payload = await client.listMessages({ limit: 10, page: 2 });

    expect(ensurePortalLogin).toHaveBeenCalledTimes(1);
    expect(getFreshSynergiaAccount).toHaveBeenCalledWith("child-login");
    expect(requestUrls(fetchMock)).toEqual([
      "https://api.librus.pl/2.0/AutoLoginToken",
      "https://synergia.librus.pl/loguj/token/auto-login-token/przenies/uczen/widok/centrum_powiadomien",
      "https://synergia.librus.pl/wiadomosci3",
      "https://wiadomosci.librus.pl/api/inbox/messages?page=2&limit=10",
    ]);
    expect(payload.Url).toBe(
      "https://wiadomosci.librus.pl/api/inbox/messages?page=2&limit=10",
    );
    expect(payload.Messages[0]).toMatchObject({
      Body: "Hello<br>World",
      Id: 151,
      Sender: {
        Id: 22,
        Url: "https://wiadomosci.librus.pl/api/users/22",
      },
      Subject: "Topic",
      content: "Hello<br>World",
      senderName: "Teacher Name",
    });
    expect(typeof payload.Messages[0]?.SendDate).toBe("number");
    expect(payload.Resources).toEqual({});
  });

  it("normalizes message detail and unread count responses", async () => {
    const { portalClient } = createPortalClientStub();
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(responseJson({ Token: "auto-login-token" }))
      .mockResolvedValueOnce(responseText())
      .mockResolvedValueOnce(responseText())
      .mockResolvedValueOnce(
        responseJson({
          data: {
            Message: Buffer.from(
              "<Message><Content><![CDATA[Detailed body]]></Content></Message>",
            ).toString("base64"),
            messageId: "message-7",
            receiver: { id: 18 },
            sendDate: "2026-03-31 16:28:30",
            topic: "Detail topic",
          },
        }),
      )
      .mockResolvedValueOnce(responseJson({ data: "4" }));
    const client = new WiadomosciMessagesClient(child, {
      fetch: fetchMock,
      portalClient,
    });
    const message = await client.getMessage("message-7");
    const unread = await client.getUnreadMessages();

    expect(requestUrls(fetchMock)).toEqual([
      "https://api.librus.pl/2.0/AutoLoginToken",
      "https://synergia.librus.pl/loguj/token/auto-login-token/przenies/uczen/widok/centrum_powiadomien",
      "https://synergia.librus.pl/wiadomosci3",
      "https://wiadomosci.librus.pl/api/inbox/messages/message-7",
      "https://wiadomosci.librus.pl/api/inbox/unreadMessagesCount",
    ]);
    expect(message.Message).toMatchObject({
      Body: "Detailed body",
      Id: "message-7",
      Receiver: {
        Id: 18,
        Url: "https://wiadomosci.librus.pl/api/users/18",
      },
      Subject: "Detail topic",
    });
    expect(unread.UnreadMessages).toBe(4);
  });

  it("reauthenticates once after an unauthorized wiadomosci response", async () => {
    const { ensurePortalLogin, getFreshSynergiaAccount, portalClient } =
      createPortalClientStub();
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(responseJson({ Token: "first-token" }))
      .mockResolvedValueOnce(responseText())
      .mockResolvedValueOnce(responseText())
      .mockResolvedValueOnce(responseJson({}, 401))
      .mockResolvedValueOnce(responseJson({ Token: "second-token" }))
      .mockResolvedValueOnce(responseText())
      .mockResolvedValueOnce(responseText())
      .mockResolvedValueOnce(responseJson({ data: [], total: 0 }));
    const client = new WiadomosciMessagesClient(child, {
      ensurePortalLogin,
      fetch: fetchMock,
      portalClient,
    });
    const payload = await client.listMessages();

    expect(payload.Messages).toEqual([]);
    expect(ensurePortalLogin).toHaveBeenCalledTimes(2);
    expect(getFreshSynergiaAccount).toHaveBeenCalledTimes(2);
    expect(requestUrls(fetchMock)).toEqual([
      "https://api.librus.pl/2.0/AutoLoginToken",
      "https://synergia.librus.pl/loguj/token/first-token/przenies/uczen/widok/centrum_powiadomien",
      "https://synergia.librus.pl/wiadomosci3",
      "https://wiadomosci.librus.pl/api/inbox/messages?page=1&limit=300",
      "https://api.librus.pl/2.0/AutoLoginToken",
      "https://synergia.librus.pl/loguj/token/second-token/przenies/uczen/widok/centrum_powiadomien",
      "https://synergia.librus.pl/wiadomosci3",
      "https://wiadomosci.librus.pl/api/inbox/messages?page=1&limit=300",
    ]);
  });

  it("keeps tokens out of authentication errors", async () => {
    const { portalClient } = createPortalClientStub();
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      responseJson(
        {
          token: "fresh-child-token",
          message: "auto-login-token denied",
        },
        403,
      ),
    );
    const client = new WiadomosciMessagesClient(child, {
      fetch: fetchMock,
      portalClient,
    });

    try {
      await client.listMessages();
      throw new Error("Expected listMessages to fail");
    } catch (error) {
      const serialized = JSON.stringify(error);

      expect(error).toMatchObject({
        code: "API_REQUEST_FAILED",
        message: "Wiadomosci authentication failed",
        details: {
          endpoint: "https://api.librus.pl/2.0/AutoLoginToken",
          status: 403,
        },
      });
      expect(serialized).not.toContain("fresh-child-token");
      expect(serialized).not.toContain("auto-login-token");
    }
  });

  it("redacts the one-time Synergia login token from login failures", async () => {
    const { portalClient } = createPortalClientStub();
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(responseJson({ Token: "one-time-login-token" }))
      .mockResolvedValueOnce(responseText("denied", 403));
    const client = new WiadomosciMessagesClient(child, {
      fetch: fetchMock,
      portalClient,
    });

    try {
      await client.listMessages();
      throw new Error("Expected listMessages to fail");
    } catch (error) {
      const serialized = JSON.stringify(error);

      expect(error).toMatchObject({
        code: "API_REQUEST_FAILED",
        details: {
          endpoint:
            "https://synergia.librus.pl/loguj/token/REDACTED/przenies/uczen/widok/centrum_powiadomien",
          status: 403,
        },
      });
      expect(serialized).not.toContain("one-time-login-token");
    }
  });
});
