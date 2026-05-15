import { describe, expect, it, vi } from "vitest";

import type {
  MessageReceiverGroupResponse,
  MessageResponse,
  MessagesResponse,
} from "../src/sdk/models/synergia/messages.js";
import { SynergiaApiClient } from "../src/sdk/synergia/SynergiaApiClient.js";
import {
  expectBinaryGetRequest,
  expectJsonGetRequest,
  expectNthJsonGetRequest,
} from "./fetchAssertions.js";

const apiBaseUrl = "https://api.librus.pl/3.0";
const defaultMessagesQuery =
  "alternativeBody=true&changeNewLine=1&getAllTypes=1&page=1&limit=300";

function jsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function errorResponse(status: number, payload: unknown = {}): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function envelope(
  path: string,
  body: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...body,
    Resources: {},
    Url: `${apiBaseUrl}${path}`,
  };
}

const requestCases = [
  {
    name: "listMessages defaults to widget-friendly query params",
    call: (client: SynergiaApiClient) => client.listMessages(),
    path: `/Messages?${defaultMessagesQuery}`,
    body: { Messages: [] },
  },
  {
    name: "listMessages includes the afterId filter",
    call: (client: SynergiaApiClient) => client.listMessages({ afterId: 42 }),
    path: `/Messages?${defaultMessagesQuery}&afterId=42`,
    body: { Messages: [] },
  },
  {
    name: "listMessages supports pagination and type query overrides",
    call: (client: SynergiaApiClient) =>
      client.listMessages({ getAllTypes: 0, limit: 50, page: 2 }),
    path: "/Messages?alternativeBody=true&changeNewLine=1&getAllTypes=0&page=2&limit=50",
    body: { Messages: [] },
  },
  {
    name: "getMessage encodes message ids",
    call: (client: SynergiaApiClient) => client.getMessage("message/7"),
    path: "/Messages/message%2F7",
    body: { Message: { Id: "message/7" } },
  },
  {
    name: "getUnreadMessages uses the unread endpoint",
    call: (client: SynergiaApiClient) => client.getUnreadMessages(),
    path: "/Messages/Unread",
    body: { UnreadMessages: 4 },
  },
  {
    name: "listMessagesForUser encodes the user id",
    call: (client: SynergiaApiClient) => client.listMessagesForUser("user/15"),
    path: "/Messages/User/user%2F15",
    body: { Messages: [] },
  },
  {
    name: "listMessageReceiverGroups uses the receiver groups endpoint",
    call: (client: SynergiaApiClient) => client.listMessageReceiverGroups(),
    path: "/Messages/ReceiversGroup",
    body: { ReceiversGroup: [] },
  },
  {
    name: "getMessageReceiverGroup encodes the group id",
    call: (client: SynergiaApiClient) =>
      client.getMessageReceiverGroup("group/4"),
    path: "/Messages/ReceiversGroup/group%2F4",
    body: { ReceiversGroup: { Id: "group/4" } },
  },
];

const parseCases = [
  {
    name: "message sender and receiver refs",
    call: (client: SynergiaApiClient) => client.listMessages(),
    path: `/Messages?${defaultMessagesQuery}`,
    body: {
      Messages: [
        {
          Id: 1,
          Sender: { Id: 2, Url: `${apiBaseUrl}/Users/2` },
          Receiver: [
            { Id: 4, Url: `${apiBaseUrl}/Users/4` },
            { Id: "5", Url: `${apiBaseUrl}/Users/5` },
          ],
        },
      ],
    },
    assert: (response: unknown) => {
      const payload = response as MessagesResponse;

      expect(payload.Messages).toHaveLength(1);
      expect(payload.Messages[0]).toMatchObject({
        Id: 1,
        Sender: { Id: 2, Url: `${apiBaseUrl}/Users/2` },
      });
      expect(payload.Messages[0]?.Receiver).toEqual([
        { Id: 4, Url: `${apiBaseUrl}/Users/4` },
        { Id: "5", Url: `${apiBaseUrl}/Users/5` },
      ]);
    },
  },
  {
    name: "message detail payloads",
    call: (client: SynergiaApiClient) => client.getMessage(7),
    path: "/Messages/7",
    body: {
      Message: {
        Id: 7,
        Sender: { Id: 2, Url: `${apiBaseUrl}/Users/2` },
        Receiver: [{ Id: 4, Url: `${apiBaseUrl}/Users/4` }],
      },
    },
    assert: (response: unknown) => {
      const payload = response as MessageResponse;

      expect(payload.Message).toMatchObject({
        Id: 7,
        Sender: { Id: 2, Url: `${apiBaseUrl}/Users/2` },
        Receiver: [{ Id: 4, Url: `${apiBaseUrl}/Users/4` }],
      });
    },
  },
  {
    name: "receiver group payloads",
    call: (client: SynergiaApiClient) => client.getMessageReceiverGroup(8),
    path: "/Messages/ReceiversGroup/8",
    body: {
      ReceiversGroup: {
        Id: 8,
        Name: "Teachers",
      },
    },
    assert: (response: unknown) => {
      const payload = response as MessageReceiverGroupResponse;

      expect(payload.ReceiversGroup).toEqual({
        Id: 8,
        Name: "Teachers",
      });
    },
  },
  {
    name: "receiver group array payloads",
    call: (client: SynergiaApiClient) => client.getMessageReceiverGroup(9),
    path: "/Messages/ReceiversGroup/9",
    body: {
      ReceiversGroup: [
        {
          Id: 9,
          Name: "Parents",
        },
      ],
    },
    assert: (response: unknown) => {
      const payload = response as MessageReceiverGroupResponse;

      expect(payload.ReceiversGroup).toEqual([
        {
          Id: 9,
          Name: "Parents",
        },
      ]);
    },
  },
];

describe("SynergiaApiClient message methods", () => {
  it.each(requestCases)("$name", async ({ call, path, body }) => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse(envelope(path, body)));

    const client = new SynergiaApiClient("token", { fetch: fetchMock });

    await call(client);

    expectJsonGetRequest(fetchMock, `${apiBaseUrl}${path}`);
  });

  it.each(parseCases)(
    "parses $name responses",
    async ({ call, path, body, assert }) => {
      const fetchMock = vi
        .fn<typeof fetch>()
        .mockResolvedValue(jsonResponse(envelope(path, body)));

      const client = new SynergiaApiClient("token", { fetch: fetchMock });
      const response = await call(client);

      assert(response);
      expectJsonGetRequest(fetchMock, `${apiBaseUrl}${path}`);
    },
  );

  it("delegates message reads to an injected message backend", async () => {
    const messageBackend = {
      getMessage: vi.fn().mockResolvedValue({
        Message: { Id: "message-1" },
        Resources: {},
        Url: "https://wiadomosci.librus.pl/api/inbox/messages/message-1",
      }),
      getUnreadMessages: vi.fn().mockResolvedValue({
        Resources: {},
        UnreadMessages: 2,
        Url: "https://wiadomosci.librus.pl/api/inbox/unreadMessagesCount",
      }),
      listMessages: vi.fn().mockResolvedValue({
        Messages: [{ Id: "message-1" }],
        Resources: {},
        Url: "https://wiadomosci.librus.pl/api/inbox/messages",
      }),
    };
    const fetchMock = vi.fn<typeof fetch>();
    const client = new SynergiaApiClient("token", {
      fetch: fetchMock,
      messageBackend,
    });

    await expect(client.listMessages({ limit: 10 })).resolves.toMatchObject({
      Messages: [{ Id: "message-1" }],
    });
    await expect(client.getMessage("message-1")).resolves.toMatchObject({
      Message: { Id: "message-1" },
    });
    await expect(client.getUnreadMessages()).resolves.toMatchObject({
      UnreadMessages: 2,
    });
    expect(messageBackend.listMessages).toHaveBeenCalledWith({ limit: 10 });
    expect(messageBackend.getMessage).toHaveBeenCalledWith("message-1");
    expect(messageBackend.getUnreadMessages).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("keeps receiver group reads on API 3.0 when a message backend is injected", async () => {
    const messageBackend = {
      getMessage: vi.fn(),
      getUnreadMessages: vi.fn(),
      listMessages: vi.fn(),
    };
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      jsonResponse(
        envelope("/Messages/ReceiversGroup", {
          ReceiversGroup: [],
        }),
      ),
    );
    const client = new SynergiaApiClient("token", {
      fetch: fetchMock,
      messageBackend,
    });

    await expect(client.listMessageReceiverGroups()).resolves.toMatchObject({
      ReceiversGroup: [],
    });
    expectJsonGetRequest(fetchMock, `${apiBaseUrl}/Messages/ReceiversGroup`);
    expect(messageBackend.listMessages).not.toHaveBeenCalled();
  });

  it("downloads message attachments as binary results", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(new Uint8Array([1, 2, 3]), {
        status: 200,
        headers: {
          "content-disposition": 'attachment; filename="message.pdf"',
          "content-type": "application/pdf",
        },
      }),
    );

    const client = new SynergiaApiClient("token", { fetch: fetchMock });
    const result = await client.getMessageAttachment("attachment/12");

    expect([...new Uint8Array(result.data)]).toEqual([1, 2, 3]);
    expect(result.contentDisposition).toBe(
      'attachment; filename="message.pdf"',
    );
    expect(result.contentType).toBe("application/pdf");
    expectBinaryGetRequest(
      fetchMock,
      `${apiBaseUrl}/Messages/Attachment/attachment%2F12`,
    );
  });

  it("adds missing-scope diagnostics to message 403 responses", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(errorResponse(403, { Error: "Forbidden" }))
      .mockResolvedValueOnce(
        jsonResponse(
          envelope("/Auth/TokenInfo", {
            UserIdentifier: "LID-123",
            Scopes: ["grades", "attendance"],
          }),
        ),
      );

    const client = new SynergiaApiClient("token", { fetch: fetchMock });

    await expect(client.listMessages()).rejects.toMatchObject({
      code: "API_REQUEST_FAILED",
      message:
        'Messages are unavailable for this child account because the token does not advertise the required "messages" scope.',
      details: {
        endpoint: `${apiBaseUrl}/Messages?${defaultMessagesQuery}`,
        status: 403,
        feature: "messages",
        requiredScope: "messages",
        scopePresent: false,
        tokenScopes: ["grades", "attendance"],
        hint: "Run `librus-sdk auth token-info --child <id-or-login>` to inspect the token scopes for this child.",
      },
    });
    expectNthJsonGetRequest(
      fetchMock,
      1,
      `${apiBaseUrl}/Messages?${defaultMessagesQuery}`,
    );
    expectNthJsonGetRequest(fetchMock, 2, `${apiBaseUrl}/Auth/TokenInfo`);
  });

  it("explains when the token advertises the messages scope but access stays forbidden", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(errorResponse(403, { Error: "Forbidden" }))
      .mockResolvedValueOnce(
        jsonResponse(
          envelope("/Auth/TokenInfo", {
            UserIdentifier: "LID-123",
            Scopes: ["Messages", "Grades"],
          }),
        ),
      );

    const client = new SynergiaApiClient("token", { fetch: fetchMock });

    await expect(client.listMessages()).rejects.toMatchObject({
      code: "API_REQUEST_FAILED",
      message:
        'Messages are unavailable for this child account even though the token advertises the required "messages" scope.',
      details: {
        endpoint: `${apiBaseUrl}/Messages?${defaultMessagesQuery}`,
        status: 403,
        feature: "messages",
        requiredScope: "messages",
        scopePresent: true,
        tokenScopes: ["Messages", "Grades"],
        hint: "Run `librus-sdk auth token-info --child <id-or-login>` to inspect the token scopes for this child.",
      },
    });
  });

  it("keeps the original 403 when token-info diagnostics are unavailable", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(errorResponse(403, { Error: "Forbidden" }))
      .mockResolvedValueOnce(errorResponse(503, { Error: "Unavailable" }));

    const client = new SynergiaApiClient("token", { fetch: fetchMock });

    await expect(client.listMessages()).rejects.toMatchObject({
      code: "API_REQUEST_FAILED",
      message:
        "Messages are unavailable for this child account. Librus returned 403 for the requested message endpoint.",
      details: {
        endpoint: `${apiBaseUrl}/Messages?${defaultMessagesQuery}`,
        status: 403,
        feature: "messages",
        requiredScope: "messages",
        hint: "Run `librus-sdk auth token-info --child <id-or-login>` to inspect the token scopes for this child.",
      },
    });
  });
});
