import { describe, expect, it, vi } from "vitest";

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
    name: "listSchoolNotices uses the school notices endpoint",
    call: (client: SynergiaApiClient) => client.listSchoolNotices(),
    path: "/SchoolNotices",
    body: { SchoolNotices: [] },
  },
  {
    name: "getSchoolNotice encodes the notice id",
    call: (client: SynergiaApiClient) => client.getSchoolNotice("notice/9"),
    path: "/SchoolNotices/notice%2F9",
    body: { SchoolNotice: { Id: "notice/9" } },
  },
  {
    name: "listNotes uses the notes endpoint",
    call: (client: SynergiaApiClient) => client.listNotes(),
    path: "/Notes",
    body: { Notes: [] },
  },
  {
    name: "getNote encodes the note id",
    call: (client: SynergiaApiClient) => client.getNote("note/4"),
    path: "/Notes/note%2F4",
    body: { Note: { Id: "note/4" } },
  },
  {
    name: "listNoteCategories uses the note categories endpoint",
    call: (client: SynergiaApiClient) => client.listNoteCategories(),
    path: "/Notes/Categories",
    body: { Categories: [] },
  },
  {
    name: "getSchool uses the schools endpoint",
    call: (client: SynergiaApiClient) => client.getSchool(),
    path: "/Schools",
    body: { School: { Id: "school-1" } },
  },
  {
    name: "getSchoolById encodes the school id",
    call: (client: SynergiaApiClient) => client.getSchoolById("school/5"),
    path: "/Schools/school%2F5",
    body: { School: { Id: "school/5" } },
  },
  {
    name: "getClass uses the classes endpoint",
    call: (client: SynergiaApiClient) => client.getClass(),
    path: "/Classes",
    body: { Class: { Id: "class-1" } },
  },
  {
    name: "getClassroom encodes the classroom id",
    call: (client: SynergiaApiClient) => client.getClassroom("room/2"),
    path: "/Classrooms/room%2F2",
    body: { Classroom: { Id: "room/2" } },
  },
  {
    name: "listSubjects uses the subjects endpoint",
    call: (client: SynergiaApiClient) => client.listSubjects(),
    path: "/Subjects",
    body: { Subjects: [] },
  },
  {
    name: "getSubject encodes the subject id",
    call: (client: SynergiaApiClient) => client.getSubject("subject/3"),
    path: "/Subjects/subject%2F3",
    body: { Subject: { Id: "subject/3" } },
  },
  {
    name: "listUsers uses the users endpoint",
    call: (client: SynergiaApiClient) => client.listUsers(),
    path: "/Users",
    body: { Users: [] },
  },
  {
    name: "getUser encodes the user id",
    call: (client: SynergiaApiClient) => client.getUser("user/6"),
    path: "/Users/user%2F6",
    body: { User: { Id: "user/6" } },
  },
];

describe("SynergiaApiClient announcement, note, and metadata methods", () => {
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

  it("parses school notices with targeted fields", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      jsonResponse(
        envelope("/SchoolNotices", {
          SchoolNotices: [
            {
              Id: 1,
              StartDate: "2026-03-30",
              EndDate: "2026-03-31",
              AddedBy: { Id: 2, Url: `${apiBaseUrl}/Users/2` },
            },
          ],
        }),
      ),
    );

    const client = new SynergiaApiClient("token", { fetch: fetchMock });
    const response = await client.listSchoolNotices();

    expect(response.SchoolNotices).toEqual([
      {
        Id: 1,
        StartDate: "2026-03-30",
        EndDate: "2026-03-31",
        AddedBy: { Id: 2, Url: `${apiBaseUrl}/Users/2` },
      },
    ]);
  });

  it("parses note detail payloads with refs", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse(
        envelope("/Notes/7", {
          Note: {
            Id: 7,
            AddedBy: { Id: 2, Url: `${apiBaseUrl}/Users/2` },
            Category: { Id: 3, Url: `${apiBaseUrl}/Notes/Categories/3` },
            Student: { Id: 4, Url: `${apiBaseUrl}/Students/4` },
          },
        }),
      ),
    );

    const client = new SynergiaApiClient("token", { fetch: fetchMock });
    const response = await client.getNote(7);

    expect(response.Note).toMatchObject({
      Id: 7,
      AddedBy: { Id: 2, Url: `${apiBaseUrl}/Users/2` },
      Category: { Id: 3, Url: `${apiBaseUrl}/Notes/Categories/3` },
      Student: { Id: 4, Url: `${apiBaseUrl}/Students/4` },
    });
  });

  it("parses school and class metadata roots", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse(
          envelope("/Schools", { School: { Id: 1, Name: "School" } }),
        ),
      )
      .mockResolvedValueOnce(
        jsonResponse(envelope("/Classes", { Class: { Id: 2, Name: "1A" } })),
      )
      .mockResolvedValueOnce(
        jsonResponse(
          envelope("/Subjects", { Subjects: [{ Id: 3, Name: "Math" }] }),
        ),
      )
      .mockResolvedValueOnce(
        jsonResponse(
          envelope("/Users", { Users: [{ Id: 4, Name: "Teacher" }] }),
        ),
      );

    const client = new SynergiaApiClient("token", { fetch: fetchMock });

    expect((await client.getSchool()).School).toEqual({
      Id: 1,
      Name: "School",
    });
    expect((await client.getClass()).Class).toEqual({ Id: 2, Name: "1A" });
    expect((await client.listSubjects()).Subjects).toEqual([
      { Id: 3, Name: "Math" },
    ]);
    expect((await client.listUsers()).Users).toEqual([
      { Id: 4, Name: "Teacher" },
    ]);
  });
});
