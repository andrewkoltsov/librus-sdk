import { describe, expect, it, vi } from "vitest";

import { SynergiaApiClient } from "../src/sdk/synergia/SynergiaApiClient.js";

describe("SynergiaApiClient", () => {
  it("returns a maintenance-specific error for 503 maintenance responses", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          Status: "Maintenance",
        }),
        {
          status: 503,
          headers: { "content-type": "application/json" },
        },
      ),
    );

    const client = new SynergiaApiClient("token", { fetch: fetchMock });

    await expect(client.getMe()).rejects.toMatchObject({
      code: "SERVICE_MAINTENANCE",
      details: {
        endpoint: "https://api.librus.pl/3.0/Me",
        status: 503,
      },
    });
  });
});
