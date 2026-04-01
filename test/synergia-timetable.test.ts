import { describe, expect, it, vi } from "vitest";

import type {
  SubstitutionResponse,
  TimetableEntryResponse,
  TimetablesResponse,
} from "../src/sdk/models/synergia/timetable.js";
import { SynergiaApiClient } from "../src/sdk/synergia/SynergiaApiClient.js";
import { expectJsonGetRequest } from "./fetchAssertions.js";

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
    name: "getTimetableWeek includes the weekStart query param",
    call: (client: SynergiaApiClient) => client.getTimetableWeek("2026-03-30"),
    path: "/Timetables?weekStart=2026-03-30",
    body: { Timetable: { "2026-03-30": [] } },
  },
  {
    name: "getTimetableDay includes the day query param",
    call: (client: SynergiaApiClient) => client.getTimetableDay("2026-03-31"),
    path: "/Timetables?day=2026-03-31",
    body: { Timetable: { "2026-03-31": [] } },
  },
  {
    name: "getTimetableEntry encodes the entry id",
    call: (client: SynergiaApiClient) => client.getTimetableEntry("entry/15"),
    path: "/TimetableEntries/entry%2F15",
    body: { TimetableEntry: { Id: "entry/15" } },
  },
  {
    name: "getCalendars uses the calendars endpoint",
    call: (client: SynergiaApiClient) => client.getCalendars(),
    path: "/Calendars",
    body: { Calendars: [] },
  },
  {
    name: "getClassFreeDays uses the class free days endpoint",
    call: (client: SynergiaApiClient) => client.getClassFreeDays(),
    path: "/Calendars/ClassFreeDays",
    body: { ClassFreeDays: [] },
  },
  {
    name: "getClassFreeDayTypes uses the class free day types endpoint",
    call: (client: SynergiaApiClient) => client.getClassFreeDayTypes(),
    path: "/Calendars/ClassFreeDays/Types",
    body: { Types: [] },
  },
  {
    name: "getSchoolFreeDays uses the school free days endpoint",
    call: (client: SynergiaApiClient) => client.getSchoolFreeDays(),
    path: "/Calendars/SchoolFreeDays",
    body: { SchoolFreeDays: [] },
  },
  {
    name: "getTeacherFreeDays uses the teacher free days endpoint",
    call: (client: SynergiaApiClient) => client.getTeacherFreeDays(),
    path: "/Calendars/TeacherFreeDays",
    body: { TeacherFreeDays: [] },
  },
  {
    name: "getSubstitution encodes the substitution id",
    call: (client: SynergiaApiClient) => client.getSubstitution("sub/9"),
    path: "/Calendars/Substitutions/sub%2F9",
    body: { Substitution: { Id: "sub/9" } },
  },
  {
    name: "getVirtualClasses uses the virtual classes endpoint",
    call: (client: SynergiaApiClient) => client.getVirtualClasses(),
    path: "/VirtualClasses",
    body: { VirtualClasses: [] },
  },
];

const parseCases = [
  {
    name: "timetable lists with nested refs",
    call: (client: SynergiaApiClient) => client.getTimetableWeek("2026-03-30"),
    path: "/Timetables?weekStart=2026-03-30",
    body: {
      Timetable: {
        "2026-03-30": [
          [
            {
              Lesson: { Id: 2, Url: `${apiBaseUrl}/Lessons/2` },
              TimetableEntry: {
                Id: 1,
                Url: `${apiBaseUrl}/TimetableEntries/1`,
              },
              Subject: { Id: 3, Url: `${apiBaseUrl}/Subjects/3` },
              Teacher: { Id: 4, Url: `${apiBaseUrl}/Users/4` },
              Class: { Id: 5, Url: `${apiBaseUrl}/Classes/5` },
            },
          ],
        ],
      },
    },
    assert: (response: unknown) => {
      const payload = response as TimetablesResponse;

      expect(payload.Timetable).toEqual({
        "2026-03-30": [
          [
            {
              Lesson: { Id: 2, Url: `${apiBaseUrl}/Lessons/2` },
              TimetableEntry: {
                Id: 1,
                Url: `${apiBaseUrl}/TimetableEntries/1`,
              },
              Subject: { Id: 3, Url: `${apiBaseUrl}/Subjects/3` },
              Teacher: { Id: 4, Url: `${apiBaseUrl}/Users/4` },
              Class: { Id: 5, Url: `${apiBaseUrl}/Classes/5` },
            },
          ],
        ],
      });
    },
  },
  {
    name: "timetable entry detail payloads",
    call: (client: SynergiaApiClient) => client.getTimetableEntry(11),
    path: "/TimetableEntries/11",
    body: {
      TimetableEntry: {
        Id: 11,
        Lesson: { Id: 2, Url: `${apiBaseUrl}/Lessons/2` },
        Subject: { Id: 3, Url: `${apiBaseUrl}/Subjects/3` },
      },
    },
    assert: (response: unknown) => {
      const payload = response as TimetableEntryResponse;

      expect(payload.TimetableEntry).toMatchObject({
        Id: 11,
        Lesson: { Id: 2, Url: `${apiBaseUrl}/Lessons/2` },
        Subject: { Id: 3, Url: `${apiBaseUrl}/Subjects/3` },
      });
    },
  },
  {
    name: "substitution payloads",
    call: (client: SynergiaApiClient) => client.getSubstitution(12),
    path: "/Calendars/Substitutions/12",
    body: {
      Substitution: {
        Id: 12,
        Teacher: { Id: 4, Url: `${apiBaseUrl}/Users/4` },
        Classroom: { Id: 5, Url: `${apiBaseUrl}/Classrooms/5` },
      },
    },
    assert: (response: unknown) => {
      const payload = response as SubstitutionResponse;

      expect(payload.Substitution).toEqual({
        Id: 12,
        Teacher: { Id: 4, Url: `${apiBaseUrl}/Users/4` },
        Classroom: { Id: 5, Url: `${apiBaseUrl}/Classrooms/5` },
      });
    },
  },
];

describe("SynergiaApiClient timetable methods", () => {
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
});
