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
    name: "getGradeAverages omits an undefined subject filter",
    call: (client: SynergiaApiClient) => client.getGradeAverages(),
    path: "/Grades/Averages",
    body: { Averages: [] },
  },
  {
    name: "getGradeAverages includes a subject filter",
    call: (client: SynergiaApiClient) => client.getGradeAverages(11),
    path: "/Grades/Averages?subject=11",
    body: { Averages: [] },
  },
  {
    name: "getGradeCategories uses the categories endpoint",
    call: (client: SynergiaApiClient) => client.getGradeCategories(),
    path: "/Grades/Categories",
    body: { Categories: [] },
  },
  {
    name: "getGradeComments uses the comments endpoint",
    call: (client: SynergiaApiClient) => client.getGradeComments(),
    path: "/Grades/Comments",
    body: { Comments: [] },
  },
  {
    name: "getBehaviourGrades uses the behaviour grades endpoint",
    call: (client: SynergiaApiClient) => client.getBehaviourGrades(),
    path: "/BehaviourGrades",
    body: { Grades: [] },
  },
  {
    name: "getBehaviourGradeTypes uses the behaviour grade types endpoint",
    call: (client: SynergiaApiClient) => client.getBehaviourGradeTypes(),
    path: "/BehaviourGrades/Types",
    body: { Types: [] },
  },
  {
    name: "getBehaviourGradePoints uses the behaviour grade points endpoint",
    call: (client: SynergiaApiClient) => client.getBehaviourGradePoints(),
    path: "/BehaviourGrades/Points",
    body: { Grades: [] },
  },
  {
    name: "getBehaviourPointCategories uses the behaviour point categories endpoint",
    call: (client: SynergiaApiClient) => client.getBehaviourPointCategories(),
    path: "/BehaviourGrades/Points/Categories",
    body: { Categories: [] },
  },
  {
    name: "getBehaviourPointComments uses the behaviour point comments endpoint",
    call: (client: SynergiaApiClient) => client.getBehaviourPointComments(),
    path: "/BehaviourGrades/Points/Comments",
    body: { Comments: [] },
  },
  {
    name: "getBehaviourSystemProposal uses the system proposal endpoint",
    call: (client: SynergiaApiClient) => client.getBehaviourSystemProposal(),
    path: "/BehaviourGrades/SystemProposal",
    body: { BehaviourGradesSystemProposal: {} },
  },
  {
    name: "getDescriptiveGrades uses the descriptive grades endpoint",
    call: (client: SynergiaApiClient) => client.getDescriptiveGrades(),
    path: "/DescriptiveGrades",
    body: { Grades: [] },
  },
  {
    name: "getDescriptiveGradeComments uses the descriptive grade comments endpoint",
    call: (client: SynergiaApiClient) => client.getDescriptiveGradeComments(),
    path: "/DescriptiveGrades/Comments",
    body: { Comments: [] },
  },
  {
    name: "getDescriptiveGradeSkills uses the descriptive grade skills endpoint",
    call: (client: SynergiaApiClient) => client.getDescriptiveGradeSkills(),
    path: "/DescriptiveGrades/Skills",
    body: { Skills: [] },
  },
  {
    name: "getDescriptiveGradeText includes a grade group filter",
    call: (client: SynergiaApiClient) =>
      client.getDescriptiveGradeText("group-7"),
    path: "/DescriptiveGrades/Text?gradeGroupId=group-7",
    body: { Grades: [] },
  },
  {
    name: "getDescriptiveGradeTextCategories uses the text categories endpoint",
    call: (client: SynergiaApiClient) =>
      client.getDescriptiveGradeTextCategories(),
    path: "/DescriptiveGrades/Text/Categories",
    body: { Categories: [] },
  },
  {
    name: "getDescriptiveTextGrades uses the descriptive text grades endpoint",
    call: (client: SynergiaApiClient) => client.getDescriptiveTextGrades(),
    path: "/DescriptiveTextGrades",
    body: { Grades: [] },
  },
  {
    name: "getDescriptiveTextGradeSkills uses the descriptive text grade skills endpoint",
    call: (client: SynergiaApiClient) => client.getDescriptiveTextGradeSkills(),
    path: "/DescriptiveTextGrades/Skills",
    body: { Skills: [] },
  },
  {
    name: "getPointGrades includes a subject filter",
    call: (client: SynergiaApiClient) => client.getPointGrades(12),
    path: "/PointGrades?subject=12",
    body: { Grades: [] },
  },
  {
    name: "getPointGradeAverages includes a subject filter",
    call: (client: SynergiaApiClient) => client.getPointGradeAverages(12),
    path: "/PointGrades/Averages?subject=12",
    body: { Averages: [] },
  },
  {
    name: "getPointGradeCategories uses the point grade categories endpoint",
    call: (client: SynergiaApiClient) => client.getPointGradeCategories(),
    path: "/PointGrades/Categories",
    body: { Categories: [] },
  },
  {
    name: "getPointGradeComments uses the point grade comments endpoint",
    call: (client: SynergiaApiClient) => client.getPointGradeComments(),
    path: "/PointGrades/Comments",
    body: { Comments: [] },
  },
  {
    name: "getTextGrades uses the text grades endpoint",
    call: (client: SynergiaApiClient) => client.getTextGrades(),
    path: "/TextGrades",
    body: { Grades: [] },
  },
  {
    name: "getAttendanceTypes uses the attendance types endpoint",
    call: (client: SynergiaApiClient) => client.getAttendanceTypes(),
    path: "/Attendances/Types",
    body: { Types: [] },
  },
  {
    name: "getHomeworkAssignments uses the homework assignments endpoint",
    call: (client: SynergiaApiClient) => client.getHomeworkAssignments(),
    path: "/HomeWorkAssignments",
    body: { HomeWorkAssignments: [] },
  },
  {
    name: "getHomeworkCategories uses the homework categories endpoint",
    call: (client: SynergiaApiClient) => client.getHomeworkCategories(),
    path: "/HomeWorks/Categories",
    body: { Categories: [] },
  },
];

const parseCases = [
  {
    name: "grade averages",
    call: (client: SynergiaApiClient) => client.getGradeAverages(),
    path: "/Grades/Averages",
    body: { Averages: [{ Id: 1, Average: "4.50" }] },
    assert: (response: Record<string, unknown>) =>
      expect(response.Averages).toEqual([{ Id: 1, Average: "4.50" }]),
  },
  {
    name: "grade categories",
    call: (client: SynergiaApiClient) => client.getGradeCategories(),
    path: "/Grades/Categories",
    body: { Categories: [{ Id: 2, Name: "Sprawdzian" }] },
    assert: (response: Record<string, unknown>) =>
      expect(response.Categories).toEqual([{ Id: 2, Name: "Sprawdzian" }]),
  },
  {
    name: "grade comments",
    call: (client: SynergiaApiClient) => client.getGradeComments(),
    path: "/Grades/Comments",
    body: { Comments: [{ Id: 3, Text: "Good progress" }] },
    assert: (response: Record<string, unknown>) =>
      expect(response.Comments).toEqual([{ Id: 3, Text: "Good progress" }]),
  },
  {
    name: "behaviour grades",
    call: (client: SynergiaApiClient) => client.getBehaviourGrades(),
    path: "/BehaviourGrades",
    body: { Grades: [{ Id: 4, Grade: "A" }] },
    assert: (response: Record<string, unknown>) =>
      expect(response.Grades).toEqual([{ Id: 4, Grade: "A" }]),
  },
  {
    name: "behaviour grade types",
    call: (client: SynergiaApiClient) => client.getBehaviourGradeTypes(),
    path: "/BehaviourGrades/Types",
    body: { Types: [{ Id: 5, Name: "Positive" }] },
    assert: (response: Record<string, unknown>) =>
      expect(response.Types).toEqual([{ Id: 5, Name: "Positive" }]),
  },
  {
    name: "behaviour grade points",
    call: (client: SynergiaApiClient) => client.getBehaviourGradePoints(),
    path: "/BehaviourGrades/Points",
    body: { Grades: [{ Id: 6, Points: 3 }] },
    assert: (response: Record<string, unknown>) =>
      expect(response.Grades).toEqual([{ Id: 6, Points: 3 }]),
  },
  {
    name: "behaviour point categories",
    call: (client: SynergiaApiClient) => client.getBehaviourPointCategories(),
    path: "/BehaviourGrades/Points/Categories",
    body: { Categories: [{ Id: 7, Name: "Activity" }] },
    assert: (response: Record<string, unknown>) =>
      expect(response.Categories).toEqual([{ Id: 7, Name: "Activity" }]),
  },
  {
    name: "behaviour point comments",
    call: (client: SynergiaApiClient) => client.getBehaviourPointComments(),
    path: "/BehaviourGrades/Points/Comments",
    body: { Comments: [{ Id: 8, Text: "Helpful in class" }] },
    assert: (response: Record<string, unknown>) =>
      expect(response.Comments).toEqual([{ Id: 8, Text: "Helpful in class" }]),
  },
  {
    name: "behaviour system proposal",
    call: (client: SynergiaApiClient) => client.getBehaviourSystemProposal(),
    path: "/BehaviourGrades/SystemProposal",
    body: { BehaviourGradesSystemProposal: { Id: 9, Proposal: "Very good" } },
    assert: (response: Record<string, unknown>) =>
      expect(response.BehaviourGradesSystemProposal).toEqual({
        Id: 9,
        Proposal: "Very good",
      }),
  },
  {
    name: "behaviour system proposal list",
    call: (client: SynergiaApiClient) => client.getBehaviourSystemProposal(),
    path: "/BehaviourGrades/SystemProposal",
    body: {
      BehaviourGradesSystemProposal: [
        { Id: 9, Proposal: "Very good" },
        { Id: 10, Proposal: "Excellent" },
      ],
    },
    assert: (response: Record<string, unknown>) =>
      expect(response.BehaviourGradesSystemProposal).toEqual([
        { Id: 9, Proposal: "Very good" },
        { Id: 10, Proposal: "Excellent" },
      ]),
  },
  {
    name: "descriptive grades",
    call: (client: SynergiaApiClient) => client.getDescriptiveGrades(),
    path: "/DescriptiveGrades",
    body: { Grades: [{ Id: 10, Text: "Consistent work" }] },
    assert: (response: Record<string, unknown>) =>
      expect(response.Grades).toEqual([{ Id: 10, Text: "Consistent work" }]),
  },
  {
    name: "descriptive grade comments",
    call: (client: SynergiaApiClient) => client.getDescriptiveGradeComments(),
    path: "/DescriptiveGrades/Comments",
    body: { Comments: [{ Id: 11, Text: "Needs more detail" }] },
    assert: (response: Record<string, unknown>) =>
      expect(response.Comments).toEqual([
        { Id: 11, Text: "Needs more detail" },
      ]),
  },
  {
    name: "descriptive grade skills",
    call: (client: SynergiaApiClient) => client.getDescriptiveGradeSkills(),
    path: "/DescriptiveGrades/Skills",
    body: { Skills: [{ Id: 12, Name: "Reading" }] },
    assert: (response: Record<string, unknown>) =>
      expect(response.Skills).toEqual([{ Id: 12, Name: "Reading" }]),
  },
  {
    name: "descriptive grade text",
    call: (client: SynergiaApiClient) => client.getDescriptiveGradeText(),
    path: "/DescriptiveGrades/Text",
    body: { Grades: [{ Id: 13, Text: "Detailed feedback" }] },
    assert: (response: Record<string, unknown>) =>
      expect(response.Grades).toEqual([{ Id: 13, Text: "Detailed feedback" }]),
  },
  {
    name: "descriptive grade text categories",
    call: (client: SynergiaApiClient) =>
      client.getDescriptiveGradeTextCategories(),
    path: "/DescriptiveGrades/Text/Categories",
    body: { Categories: [{ Id: 14, Name: "Effort" }] },
    assert: (response: Record<string, unknown>) =>
      expect(response.Categories).toEqual([{ Id: 14, Name: "Effort" }]),
  },
  {
    name: "descriptive text grades",
    call: (client: SynergiaApiClient) => client.getDescriptiveTextGrades(),
    path: "/DescriptiveTextGrades",
    body: { Grades: [{ Id: 15, Text: "Excellent summary" }] },
    assert: (response: Record<string, unknown>) =>
      expect(response.Grades).toEqual([{ Id: 15, Text: "Excellent summary" }]),
  },
  {
    name: "descriptive text grade skills",
    call: (client: SynergiaApiClient) => client.getDescriptiveTextGradeSkills(),
    path: "/DescriptiveTextGrades/Skills",
    body: { Skills: [{ Id: 16, Name: "Writing" }] },
    assert: (response: Record<string, unknown>) =>
      expect(response.Skills).toEqual([{ Id: 16, Name: "Writing" }]),
  },
  {
    name: "point grades",
    call: (client: SynergiaApiClient) => client.getPointGrades(),
    path: "/PointGrades",
    body: { Grades: [{ Id: 17, Points: 12 }] },
    assert: (response: Record<string, unknown>) =>
      expect(response.Grades).toEqual([{ Id: 17, Points: 12 }]),
  },
  {
    name: "point grade averages",
    call: (client: SynergiaApiClient) => client.getPointGradeAverages(),
    path: "/PointGrades/Averages",
    body: { Averages: [{ Id: 18, Average: 8.5 }] },
    assert: (response: Record<string, unknown>) =>
      expect(response.Averages).toEqual([{ Id: 18, Average: 8.5 }]),
  },
  {
    name: "point grade categories",
    call: (client: SynergiaApiClient) => client.getPointGradeCategories(),
    path: "/PointGrades/Categories",
    body: { Categories: [{ Id: 19, Name: "Quiz" }] },
    assert: (response: Record<string, unknown>) =>
      expect(response.Categories).toEqual([{ Id: 19, Name: "Quiz" }]),
  },
  {
    name: "point grade comments",
    call: (client: SynergiaApiClient) => client.getPointGradeComments(),
    path: "/PointGrades/Comments",
    body: { Comments: [{ Id: 20, Text: "Great effort" }] },
    assert: (response: Record<string, unknown>) =>
      expect(response.Comments).toEqual([{ Id: 20, Text: "Great effort" }]),
  },
  {
    name: "text grades",
    call: (client: SynergiaApiClient) => client.getTextGrades(),
    path: "/TextGrades",
    body: { Grades: [{ Id: 21, Text: "Approved" }] },
    assert: (response: Record<string, unknown>) =>
      expect(response.Grades).toEqual([{ Id: 21, Text: "Approved" }]),
  },
  {
    name: "attendance types",
    call: (client: SynergiaApiClient) => client.getAttendanceTypes(),
    path: "/Attendances/Types",
    body: { Types: [{ Id: 22, Name: "Excused" }] },
    assert: (response: Record<string, unknown>) =>
      expect(response.Types).toEqual([{ Id: 22, Name: "Excused" }]),
  },
  {
    name: "homework assignments",
    call: (client: SynergiaApiClient) => client.getHomeworkAssignments(),
    path: "/HomeWorkAssignments",
    body: { HomeWorkAssignments: [{ Id: 23, Content: "Read chapter 5" }] },
    assert: (response: Record<string, unknown>) =>
      expect(response.HomeWorkAssignments).toEqual([
        { Id: 23, Content: "Read chapter 5" },
      ]),
  },
  {
    name: "homework categories",
    call: (client: SynergiaApiClient) => client.getHomeworkCategories(),
    path: "/HomeWorks/Categories",
    body: { Categories: [{ Id: 24, Name: "Project" }] },
    assert: (response: Record<string, unknown>) =>
      expect(response.Categories).toEqual([{ Id: 24, Name: "Project" }]),
  },
];

describe("SynergiaApiClient expanded GET methods", () => {
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
      const response = (await call(client)) as Record<string, unknown>;

      assert(response);
      expectJsonGetRequest(fetchMock, `${apiBaseUrl}${path}`);
    },
  );

  it.each([
    {
      name: "grade averages disabled response",
      call: (client: SynergiaApiClient) => client.getGradeAverages(),
      path: "/Grades/Averages",
    },
    {
      name: "point grade averages disabled response",
      call: (client: SynergiaApiClient) => client.getPointGradeAverages(),
      path: "/PointGrades/Averages",
    },
  ])("accepts $name", async ({ call, path }) => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse(
        envelope(path, {
          Status: "Disabled",
        }),
      ),
    );

    const client = new SynergiaApiClient("token", { fetch: fetchMock });
    const response = (await call(client)) as Record<string, unknown>;

    expect(response.Status).toBe("Disabled");
    expectJsonGetRequest(fetchMock, `${apiBaseUrl}${path}`);
  });

  it("downloads homework assignment attachments as binary results", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(new Uint8Array([4, 5, 6]), {
        status: 200,
        headers: {
          "content-disposition": 'attachment; filename="homework.pdf"',
          "content-type": "application/pdf",
        },
      }),
    );

    const client = new SynergiaApiClient("token", { fetch: fetchMock });
    const result = await client.getHomeworkAssignmentAttachment(55);

    expect([...new Uint8Array(result.data)]).toEqual([4, 5, 6]);
    expect(result.contentDisposition).toBe(
      'attachment; filename="homework.pdf"',
    );
    expect(result.contentType).toBe("application/pdf");
    expectBinaryGetRequest(
      fetchMock,
      `${apiBaseUrl}/HomeWorkAssignments/Attachment/55`,
    );
  });
});
