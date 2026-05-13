import { afterEach, describe, expect, it, vi } from "vitest";

import { BffApiClient } from "../src/sdk/bff/BffApiClient.js";
import { buildBffEndpoint } from "../src/sdk/bff/request.js";

const bffBaseUrl = "https://testbff.librus.pl/v1";
const librusMobileUserAgent =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 LibrusMobileApp";

describe("BFF request helpers", () => {
  it("builds BFF endpoints", () => {
    expect(buildBffEndpoint(bffBaseUrl, "/Messages")).toBe(
      "https://testbff.librus.pl/v1/Messages",
    );
    expect(buildBffEndpoint(`${bffBaseUrl}/`, "Messages")).toBe(
      "https://testbff.librus.pl/v1/Messages",
    );
  });
});

describe("BffApiClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("lists inbox messages through the BFF Messages endpoint", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          inboxMessages: [
            {
              id: "1",
              senderId: "teacher-1",
              senderName: "Jan",
              senderSurname: "Kowalski",
              senderColor: 123,
              sendDate: "2026-04-01T12:00:00Z",
              subject: "Test",
              body: "Full body",
            },
          ],
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    );

    const client = new BffApiClient("child-token", { fetch: fetchMock });
    const response = await client.listMessages();

    expect(response.inboxMessages).toHaveLength(1);
    expect(response.inboxMessages[0]).toMatchObject({
      id: "1",
      body: "Full body",
      senderName: "Jan",
      subject: "Test",
    });
    const [url, init] = fetchMock.mock.calls[0] ?? [];

    expect(url).toBe(`${bffBaseUrl}/Messages`);
    expect(init).toMatchObject({
      method: "GET",
      headers: {
        accept: "application/json",
        "user-agent": librusMobileUserAgent,
        "x-zse-authorization": "Bearer child-token",
      },
    });
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it("supports a custom BFF base URL", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ inboxMessages: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const client = new BffApiClient("child-token", {
      bffBaseUrl: "https://example.test/v1",
      fetch: fetchMock,
    });

    await client.listMessages();

    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.test/v1/Messages",
      expect.any(Object),
    );
  });

  it("uses global fetch by default", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ inboxMessages: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const client = new BffApiClient("child-token");

    await client.listMessages();

    expect(fetchMock).toHaveBeenCalledWith(
      `${bffBaseUrl}/Messages`,
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("raises API errors for failed BFF requests", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ message: "unavailable" }), {
        status: 503,
        headers: { "content-type": "application/json" },
      }),
    );

    const client = new BffApiClient("child-token", { fetch: fetchMock });

    await expect(client.listMessages()).rejects.toMatchObject({
      code: "API_REQUEST_FAILED",
      message: "BFF API request failed",
      details: {
        endpoint: `${bffBaseUrl}/Messages`,
        status: 503,
      },
    });
  });
});
