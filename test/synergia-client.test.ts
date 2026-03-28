import { describe, expect, it, vi } from "vitest";

import { LibrusSdkError } from "../src/sdk/models/errors.js";
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

  it("fails with a validation error when the response payload is malformed", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          Grades: [{}],
          Resources: {},
          Url: "https://api.librus.pl/3.0/Grades",
          accessToken: "secret-token",
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    );

    const client = new SynergiaApiClient("token", { fetch: fetchMock });

    try {
      await client.getGrades();
      throw new Error("Expected getGrades to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(LibrusSdkError);
      expect(error).toMatchObject({
        code: "RESPONSE_VALIDATION_FAILED",
        details: {
          endpoint: "https://api.librus.pl/3.0/Grades",
        },
      });
      expect(Array.isArray((error as LibrusSdkError).details?.issues)).toBe(
        true,
      );
    }
  });
});
