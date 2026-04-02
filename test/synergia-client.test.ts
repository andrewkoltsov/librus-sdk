import { describe, expect, it, vi } from "vitest";

import { LibrusSdkError } from "../src/sdk/models/errors.js";
import { SynergiaApiClient } from "../src/sdk/synergia/SynergiaApiClient.js";

function createAbortAwareHangingFetch() {
  return vi.fn<typeof fetch>((_input, init) => {
    return new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener(
        "abort",
        () => {
          reject(new DOMException("This operation was aborted", "AbortError"));
        },
        { once: true },
      );
    });
  });
}

function expectTokenGetRequest(
  fetchMock: ReturnType<typeof vi.fn<typeof fetch>>,
  expectedUrl: string,
): void {
  const [url, init] = fetchMock.mock.calls[0] ?? [];

  expect(url).toBe(expectedUrl);
  expect(init).toMatchObject({
    method: "GET",
    headers: {
      accept: "application/json",
      authorization: "Bearer token",
    },
  });
  expect(init?.signal).toBeInstanceOf(AbortSignal);
}

describe("SynergiaApiClient", () => {
  it("fails fast for invalid requestTimeoutMs values", () => {
    expect(() => {
      new SynergiaApiClient("token", {
        requestTimeoutMs: 0,
      });
    }).toThrowError(
      expect.objectContaining({
        code: "CONFIGURATION_ERROR",
      }),
    );
  });

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
    expectTokenGetRequest(fetchMock, "https://api.librus.pl/3.0/Me");
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

    expectTokenGetRequest(fetchMock, "https://api.librus.pl/3.0/Grades");
  });

  it("accepts attendance payloads with string or numeric ids and without a Trip field", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          Attendances: [
            {
              Id: 1,
              Lesson: { Id: 2, Url: "https://api.librus.pl/3.0/Lessons/2" },
              Student: { Id: 3, Url: "https://api.librus.pl/3.0/Students/3" },
              Date: "2026-03-28",
              AddDate: "2026-03-28 08:00:00",
              LessonNo: 1,
              Semester: 2,
              Type: {
                Id: 4,
                Url: "https://api.librus.pl/3.0/AttendanceTypes/4",
              },
              AddedBy: { Id: 5, Url: "https://api.librus.pl/3.0/Users/5" },
            },
            {
              Id: "2",
              Lesson: { Id: 6, Url: "https://api.librus.pl/3.0/Lessons/6" },
              Student: { Id: 3, Url: "https://api.librus.pl/3.0/Students/3" },
              Date: "2026-03-29",
              AddDate: "2026-03-29 08:00:00",
              LessonNo: 2,
              Semester: 2,
              Type: {
                Id: 7,
                Url: "https://api.librus.pl/3.0/AttendanceTypes/7",
              },
              AddedBy: { Id: 5, Url: "https://api.librus.pl/3.0/Users/5" },
            },
          ],
          Resources: {},
          Url: "https://api.librus.pl/3.0/Attendances",
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    );

    const client = new SynergiaApiClient("token", { fetch: fetchMock });
    const response = await client.getAttendances();

    expect(response.Attendances).toHaveLength(2);
    expect(response.Attendances[0]?.Id).toBe(1);
    expect(response.Attendances[0]?.Trip).toBeUndefined();
    expect(response.Attendances[1]?.Id).toBe("2");
    expect(response.Attendances[1]?.Trip).toBeUndefined();
    expectTokenGetRequest(fetchMock, "https://api.librus.pl/3.0/Attendances");
  });

  it("accepts homework payloads with mixed lesson numbers and missing subjects", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          HomeWorks: [
            {
              AddDate: "2026-03-29 08:00:00",
              Category: null,
              Class: null,
              Content: "Read chapter 5",
              CreatedBy: null,
              Date: "2026-03-29",
              Id: 1,
              LessonNo: "5",
              Subject: {
                Id: 10,
                Url: "https://api.librus.pl/3.0/Subjects/10",
              },
              TimeFrom: null,
              TimeTo: null,
            },
            {
              AddDate: "2026-03-30 08:00:00",
              Category: null,
              Class: null,
              Content: "Solve exercises 1-3",
              CreatedBy: null,
              Date: "2026-03-30",
              Id: 2,
              LessonNo: 2,
              TimeFrom: "09:00",
              TimeTo: "09:45",
            },
            {
              AddDate: "2026-03-31 08:00:00",
              Category: null,
              Class: null,
              Content: "Bring materials",
              CreatedBy: null,
              Date: "2026-03-31",
              Id: 3,
              LessonNo: null,
              Subject: null,
              TimeFrom: null,
              TimeTo: null,
            },
          ],
          Resources: {},
          Url: "https://api.librus.pl/3.0/HomeWorks",
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    );

    const client = new SynergiaApiClient("token", { fetch: fetchMock });
    const response = await client.getHomeWorks();

    expect(response.HomeWorks).toHaveLength(3);
    expect(response.HomeWorks[0]?.LessonNo).toBe("5");
    expect(response.HomeWorks[1]?.LessonNo).toBe(2);
    expect(response.HomeWorks[2]?.LessonNo).toBeNull();
    expect(response.HomeWorks[0]?.Subject).toEqual({
      Id: 10,
      Url: "https://api.librus.pl/3.0/Subjects/10",
    });
    expect(Object.hasOwn(response.HomeWorks[1]!, "Subject")).toBe(false);
    expect(response.HomeWorks[1]?.Subject).toBeUndefined();
    expect(response.HomeWorks[2]?.Subject).toBeNull();
    expectTokenGetRequest(fetchMock, "https://api.librus.pl/3.0/HomeWorks");
  });

  it("times out hanging child-scoped requests with a secret-safe error", async () => {
    vi.useFakeTimers();

    try {
      const fetchMock = createAbortAwareHangingFetch();
      const client = new SynergiaApiClient("token-secret", {
        fetch: fetchMock,
        requestTimeoutMs: 5,
      });
      const requestPromise = client.getGrades();
      const requestErrorPromise = requestPromise.catch(
        (error: unknown) => error,
      );
      const requestExpectation = expect(
        requestErrorPromise,
      ).resolves.toMatchObject({
        code: "NETWORK_TIMEOUT",
        message: "Librus request timed out after 5ms.",
        details: {
          endpoint: "https://api.librus.pl/3.0/Grades",
          timeoutMs: 5,
        },
      });

      await vi.advanceTimersByTimeAsync(5);

      const requestError = await requestErrorPromise;

      await requestExpectation;
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(JSON.stringify(requestError)).not.toContain("token-secret");
      expect(JSON.stringify(requestError)).not.toContain("Bearer");
    } finally {
      vi.useRealTimers();
    }
  });
});
