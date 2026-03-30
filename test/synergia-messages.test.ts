import { describe, expect, it, vi } from "vitest";

import type {
  MessageReceiverGroupResponse,
  MessageResponse,
  MessagesResponse,
} from "../src/sdk/models/synergia/messages.js";
import { SynergiaApiClient } from "../src/sdk/synergia/SynergiaApiClient.js";

const apiBaseUrl = "https://api.librus.pl/3.0";

function jsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
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
    path: "/Messages?alternativeBody=true&changeNewLine=1",
    body: { Messages: [] },
  },
  {
    name: "listMessages includes the afterId filter",
    call: (client: SynergiaApiClient) => client.listMessages({ afterId: 42 }),
    path: "/Messages?afterId=42&alternativeBody=true&changeNewLine=1",
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
    path: "/Messages?alternativeBody=true&changeNewLine=1",
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
];

describe("SynergiaApiClient message methods", () => {
  it.each(requestCases)("$name", async ({ call, path, body }) => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse(envelope(path, body)));

    const client = new SynergiaApiClient("token", { fetch: fetchMock });

    await call(client);

    expect(fetchMock).toHaveBeenCalledWith(`${apiBaseUrl}${path}`, {
      method: "GET",
      headers: {
        accept: "application/json",
        authorization: "Bearer token",
      },
    });
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
      expect(fetchMock).toHaveBeenCalledWith(`${apiBaseUrl}${path}`, {
        method: "GET",
        headers: {
          accept: "application/json",
          authorization: "Bearer token",
        },
      });
    },
  );

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
    expect(fetchMock).toHaveBeenCalledWith(
      `${apiBaseUrl}/Messages/Attachment/attachment%2F12`,
      {
        method: "GET",
        headers: {
          authorization: "Bearer token",
        },
      },
    );
  });
});
