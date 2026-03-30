import { describe, expect, it, vi } from "vitest";

import { buildEndpoint, getBinary } from "../src/sdk/synergia/request.js";

describe("Synergia request helpers", () => {
  it("builds endpoints without query params", () => {
    expect(buildEndpoint("https://api.librus.pl/3.0", "/Me")).toBe(
      "https://api.librus.pl/3.0/Me",
    );
  });

  it("builds endpoints with mixed scalar query params and omits nullish values", () => {
    expect(
      buildEndpoint("https://api.librus.pl/3.0", "/Messages", {
        alternativeBody: true,
        changeNewLine: 1,
        afterId: 42,
        empty: null,
        missing: undefined,
      }),
    ).toBe(
      "https://api.librus.pl/3.0/Messages?alternativeBody=true&changeNewLine=1&afterId=42",
    );
  });

  it("returns binary payloads with response headers", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(new Uint8Array([1, 2, 3]), {
        status: 200,
        headers: {
          "content-disposition": 'attachment; filename="message.pdf"',
          "content-type": "application/pdf",
        },
      }),
    );

    const result = await getBinary(
      fetchMock,
      "token",
      "https://api.librus.pl/3.0",
      "/Messages/Attachment/12",
    );

    expect([...new Uint8Array(result.data)]).toEqual([1, 2, 3]);
    expect(result.contentDisposition).toBe(
      'attachment; filename="message.pdf"',
    );
    expect(result.contentType).toBe("application/pdf");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.librus.pl/3.0/Messages/Attachment/12",
      {
        method: "GET",
        headers: {
          authorization: "Bearer token",
        },
      },
    );
  });

  it("maps maintenance responses for binary requests", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ Status: "Maintenance" }), {
        status: 503,
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(
      getBinary(
        fetchMock,
        "token",
        "https://api.librus.pl/3.0",
        "/Messages/Attachment/12",
      ),
    ).rejects.toMatchObject({
      code: "SERVICE_MAINTENANCE",
      details: {
        endpoint: "https://api.librus.pl/3.0/Messages/Attachment/12",
        status: 503,
      },
    });
  });

  it("raises generic API errors for non-maintenance binary failures", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response("missing", {
        status: 404,
      }),
    );

    await expect(
      getBinary(
        fetchMock,
        "token",
        "https://api.librus.pl/3.0",
        "/Messages/Attachment/12",
      ),
    ).rejects.toMatchObject({
      code: "API_REQUEST_FAILED",
      details: {
        endpoint: "https://api.librus.pl/3.0/Messages/Attachment/12",
        status: 404,
      },
    });
  });
});
