import { describe, expect, it, vi } from "vitest";

import { SynergiaApiClient } from "../src/sdk/synergia/SynergiaApiClient.js";
import {
  expectBinaryGetRequest,
  expectJsonGetRequest,
} from "./fetchAssertions.js";

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
    name: "listLessons uses the lessons endpoint",
    call: (client: SynergiaApiClient) => client.listLessons(),
    path: "/Lessons",
    body: { Lessons: [] },
  },
  {
    name: "getLesson encodes the lesson id",
    call: (client: SynergiaApiClient) => client.getLesson("lesson/7"),
    path: "/Lessons/lesson%2F7",
    body: { Lesson: { Id: "lesson/7" } },
  },
  {
    name: "listPlannedLessons uses the planned lessons endpoint",
    call: (client: SynergiaApiClient) => client.listPlannedLessons(),
    path: "/PlannedLessons",
    body: { PlannedLessons: [] },
  },
  {
    name: "getPlannedLesson encodes the planned lesson id",
    call: (client: SynergiaApiClient) => client.getPlannedLesson("planned/9"),
    path: "/PlannedLessons/planned%2F9",
    body: { PlannedLesson: { Id: "planned/9" } },
  },
  {
    name: "listRealizations uses the realizations endpoint",
    call: (client: SynergiaApiClient) => client.listRealizations(),
    path: "/Realizations",
    body: { Realizations: [] },
  },
  {
    name: "getRealization encodes the realization id",
    call: (client: SynergiaApiClient) => client.getRealization("realization/5"),
    path: "/Realizations/realization%2F5",
    body: { Realization: { Id: "realization/5" } },
  },
  {
    name: "getLuckyNumber omits the day filter when it is undefined",
    call: (client: SynergiaApiClient) => client.getLuckyNumber(),
    path: "/LuckyNumbers",
    body: { LuckyNumber: { LuckyNumber: 13 } },
  },
  {
    name: "getLuckyNumber includes the day filter",
    call: (client: SynergiaApiClient) => client.getLuckyNumber("2026-03-30"),
    path: "/LuckyNumbers?forDay=2026-03-30",
    body: { LuckyNumber: { LuckyNumber: 13 } },
  },
  {
    name: "getNotificationCenter uses the notification center endpoint",
    call: (client: SynergiaApiClient) => client.getNotificationCenter(),
    path: "/NotificationCenter",
    body: { NotificationCenter: {} },
  },
  {
    name: "getPushConfigurations uses the push configurations endpoint",
    call: (client: SynergiaApiClient) => client.getPushConfigurations(),
    path: "/PushConfigurations",
    body: { settings: {}, version: "7" },
  },
  {
    name: "listJustifications omits the date filter when it is undefined",
    call: (client: SynergiaApiClient) => client.listJustifications(),
    path: "/Justifications",
    body: { Justifications: [] },
  },
  {
    name: "listJustifications includes the date filter",
    call: (client: SynergiaApiClient) =>
      client.listJustifications({ dateFrom: "2026-03-01" }),
    path: "/Justifications?dateFrom=2026-03-01",
    body: { Justifications: [] },
  },
  {
    name: "getJustification encodes the justification id",
    call: (client: SynergiaApiClient) =>
      client.getJustification("justification/3"),
    path: "/Justifications/justification%2F3",
    body: { Justification: { Id: "justification/3" } },
  },
  {
    name: "listParentTeacherConferences uses the conferences endpoint",
    call: (client: SynergiaApiClient) => client.listParentTeacherConferences(),
    path: "/ParentTeacherConferences",
    body: { ParentTeacherConferences: [] },
  },
  {
    name: "getSystemData uses the system data endpoint",
    call: (client: SynergiaApiClient) => client.getSystemData(),
    path: "/SystemData",
    body: { Date: "2026-03-30", Time: "23:39:02" },
  },
  {
    name: "listAuthPhotos uses the auth photos endpoint",
    call: (client: SynergiaApiClient) => client.listAuthPhotos(),
    path: "/Auth/Photos",
    body: { data: { status: true, photo: null, awaitingPhoto: null } },
  },
  {
    name: "getAuthPhoto encodes the auth photo id",
    call: (client: SynergiaApiClient) => client.getAuthPhoto("photo/4"),
    path: "/Auth/Photos/photo%2F4",
    body: { data: { status: true, photo: { id: "photo/4" } } },
  },
  {
    name: "getAuthUserInfo encodes the auth user identifier",
    call: (client: SynergiaApiClient) => client.getAuthUserInfo("LID-123"),
    path: "/Auth/UserInfo/LID-123",
    body: { UserIdentifier: "LID-123" },
  },
  {
    name: "getAuthTokenInfo uses the auth token info endpoint",
    call: (client: SynergiaApiClient) => client.getAuthTokenInfo(),
    path: "/Auth/TokenInfo",
    body: { UserIdentifier: "LID-123", Scopes: [] },
  },
  {
    name: "getAuthClassroom encodes the auth classroom id",
    call: (client: SynergiaApiClient) => client.getAuthClassroom("classroom/8"),
    path: "/Auth/Classrooms/classroom%2F8",
    body: { Classroom: { Id: "classroom/8" } },
  },
];

describe("SynergiaApiClient supporting feature methods", () => {
  it.each(requestCases)("$name", async ({ call, path, body }) => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse(envelope(path, body)));

    const client = new SynergiaApiClient("token", { fetch: fetchMock });

    await call(client);

    expectJsonGetRequest(fetchMock, `${apiBaseUrl}${path}`);
  });

  it("downloads planned lesson attachments as binary payloads", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(new Uint8Array([1, 2, 3, 4]), {
        status: 200,
        headers: {
          "content-disposition": 'attachment; filename="planned.pdf"',
          "content-type": "application/pdf",
        },
      }),
    );

    const client = new SynergiaApiClient("token", { fetch: fetchMock });
    const result = await client.getPlannedLessonAttachment("planned/4");

    expect([...new Uint8Array(result.data)]).toEqual([1, 2, 3, 4]);
    expect(result.contentDisposition).toBe(
      'attachment; filename="planned.pdf"',
    );
    expect(result.contentType).toBe("application/pdf");
    expectBinaryGetRequest(
      fetchMock,
      `${apiBaseUrl}/PlannedLessons/Attachment/planned%2F4`,
    );
  });

  it("parses lesson list and detail payloads with targeted refs", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse(
          envelope("/Lessons", {
            Lessons: [
              {
                Id: 1,
                Subject: { Id: 2, Url: `${apiBaseUrl}/Subjects/2` },
                Teacher: { Id: 3, Url: `${apiBaseUrl}/Users/3` },
              },
            ],
          }),
        ),
      )
      .mockResolvedValueOnce(
        jsonResponse(
          envelope("/Lessons/1", {
            Lesson: {
              Id: 1,
              Subject: { Id: 2, Url: `${apiBaseUrl}/Subjects/2` },
              Teacher: { Id: 3, Url: `${apiBaseUrl}/Users/3` },
            },
          }),
        ),
      );

    const client = new SynergiaApiClient("token", { fetch: fetchMock });

    expect((await client.listLessons()).Lessons).toEqual([
      {
        Id: 1,
        Subject: { Id: 2, Url: `${apiBaseUrl}/Subjects/2` },
        Teacher: { Id: 3, Url: `${apiBaseUrl}/Users/3` },
      },
    ]);
    expect((await client.getLesson(1)).Lesson).toEqual({
      Id: 1,
      Subject: { Id: 2, Url: `${apiBaseUrl}/Subjects/2` },
      Teacher: { Id: 3, Url: `${apiBaseUrl}/Users/3` },
    });
  });

  it("parses lucky number and notification payloads", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse(
          envelope("/LuckyNumbers", {
            LuckyNumber: {
              LuckyNumber: 13,
              LuckyNumberDay: "2026-03-30",
            },
          }),
        ),
      )
      .mockResolvedValueOnce(
        jsonResponse(
          envelope("/NotificationCenter", {
            NotificationCenter: {
              SczesliwyNumerek: true,
              Show: true,
            },
          }),
        ),
      )
      .mockResolvedValueOnce(
        jsonResponse(
          envelope("/PushConfigurations", {
            version: "7",
            settings: {
              grades: true,
              plannedLessons: false,
            },
          }),
        ),
      );

    const client = new SynergiaApiClient("token", { fetch: fetchMock });

    expect((await client.getLuckyNumber()).LuckyNumber).toEqual({
      LuckyNumber: 13,
      LuckyNumberDay: "2026-03-30",
    });
    expect((await client.getNotificationCenter()).NotificationCenter).toEqual({
      SczesliwyNumerek: true,
      Show: true,
    });
    expect((await client.getPushConfigurations()).settings).toEqual({
      grades: true,
      plannedLessons: false,
    });
  });

  it("parses justifications and system data payloads", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse(
          envelope("/Justifications", {
            Justifications: [
              {
                Id: 1,
                AddedBy: { Id: 2, Url: `${apiBaseUrl}/Users/2` },
                Student: { Id: 3, Url: `${apiBaseUrl}/Students/3` },
              },
            ],
          }),
        ),
      )
      .mockResolvedValueOnce(
        jsonResponse(
          envelope("/Justifications/1", {
            Justification: {
              Id: 1,
              AddedBy: { Id: 2, Url: `${apiBaseUrl}/Users/2` },
            },
          }),
        ),
      )
      .mockResolvedValueOnce(
        jsonResponse(
          envelope("/ParentTeacherConferences", {
            ParentTeacherConferences: [{ Id: 4, Title: "April meeting" }],
          }),
        ),
      )
      .mockResolvedValueOnce(
        jsonResponse(
          envelope("/SystemData", {
            Date: "2026-03-30",
            Time: "23:39:02",
          }),
        ),
      );

    const client = new SynergiaApiClient("token", { fetch: fetchMock });

    expect((await client.listJustifications()).Justifications).toEqual([
      {
        Id: 1,
        AddedBy: { Id: 2, Url: `${apiBaseUrl}/Users/2` },
        Student: { Id: 3, Url: `${apiBaseUrl}/Students/3` },
      },
    ]);
    expect((await client.getJustification(1)).Justification).toEqual({
      Id: 1,
      AddedBy: { Id: 2, Url: `${apiBaseUrl}/Users/2` },
    });
    expect(
      (await client.listParentTeacherConferences()).ParentTeacherConferences,
    ).toEqual([{ Id: 4, Title: "April meeting" }]);
    expect(await client.getSystemData()).toMatchObject({
      Date: "2026-03-30",
      Time: "23:39:02",
    });
  });

  it("parses auth photo and token info payloads", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse(
          envelope("/Auth/Photos", {
            data: {
              status: true,
              photo: {
                id: "photo-1",
                fileName: "photo.jpg",
                content: "AQID",
              },
              awaitingPhoto: null,
            },
          }),
        ),
      )
      .mockResolvedValueOnce(
        jsonResponse(
          envelope("/Auth/Photos/photo-1", {
            data: {
              status: true,
              photo: {
                id: "photo-1",
                fileName: "photo.jpg",
                content: "AQID",
              },
              awaitingPhoto: null,
            },
          }),
        ),
      )
      .mockResolvedValueOnce(
        jsonResponse(
          envelope("/Auth/TokenInfo", {
            SchoolId: 1637,
            UserIdentifier: "LID-AUTH-USER-1",
            UserType: 5,
            SchoolNodeName: "w2",
            Scopes: ["Messages", "Grades"],
          }),
        ),
      );

    const client = new SynergiaApiClient("token", { fetch: fetchMock });

    expect((await client.listAuthPhotos()).data.photo).toMatchObject({
      id: "photo-1",
      fileName: "photo.jpg",
    });
    expect((await client.getAuthPhoto("photo-1")).data.photo).toMatchObject({
      id: "photo-1",
      content: "AQID",
    });
    expect(await client.getAuthTokenInfo()).toMatchObject({
      SchoolId: 1637,
      UserIdentifier: "LID-AUTH-USER-1",
      SchoolNodeName: "w2",
      Scopes: ["Messages", "Grades"],
    });
  });
});
