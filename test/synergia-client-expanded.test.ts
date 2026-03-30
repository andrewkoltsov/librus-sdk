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
  key: string,
  value: unknown,
): Record<string, unknown> {
  return {
    [key]: value,
    Resources: {},
    Url: `${apiBaseUrl}${path}`,
  };
}

describe("SynergiaApiClient expanded GET methods", () => {
  it.each([
    {
      name: "getGradeAverages omits an undefined subject filter",
      call: (client: SynergiaApiClient) => client.getGradeAverages(),
      path: "/Grades/Averages",
      key: "GradesAverages",
      value: [],
    },
    {
      name: "getGradeAverages includes a subject filter",
      call: (client: SynergiaApiClient) => client.getGradeAverages(11),
      path: "/Grades/Averages?subject=11",
      key: "GradesAverages",
      value: [],
    },
    {
      name: "getGradeCategories uses the categories endpoint",
      call: (client: SynergiaApiClient) => client.getGradeCategories(),
      path: "/Grades/Categories",
      key: "GradesCategories",
      value: [],
    },
    {
      name: "getGradeComments uses the comments endpoint",
      call: (client: SynergiaApiClient) => client.getGradeComments(),
      path: "/Grades/Comments",
      key: "GradesComments",
      value: [],
    },
    {
      name: "getBehaviourGrades uses the behaviour grades endpoint",
      call: (client: SynergiaApiClient) => client.getBehaviourGrades(),
      path: "/BehaviourGrades",
      key: "BehaviourGrades",
      value: [],
    },
    {
      name: "getBehaviourGradeTypes uses the behaviour grade types endpoint",
      call: (client: SynergiaApiClient) => client.getBehaviourGradeTypes(),
      path: "/BehaviourGrades/Types",
      key: "BehaviourGradesTypes",
      value: [],
    },
    {
      name: "getBehaviourGradePoints uses the behaviour grade points endpoint",
      call: (client: SynergiaApiClient) => client.getBehaviourGradePoints(),
      path: "/BehaviourGrades/Points",
      key: "BehaviourGradesPoints",
      value: [],
    },
    {
      name: "getBehaviourPointCategories uses the behaviour point categories endpoint",
      call: (client: SynergiaApiClient) => client.getBehaviourPointCategories(),
      path: "/BehaviourGrades/Points/Categories",
      key: "BehaviourGradesPointsCategories",
      value: [],
    },
    {
      name: "getBehaviourPointComments uses the behaviour point comments endpoint",
      call: (client: SynergiaApiClient) => client.getBehaviourPointComments(),
      path: "/BehaviourGrades/Points/Comments",
      key: "BehaviourGradesPointsComments",
      value: [],
    },
    {
      name: "getBehaviourSystemProposal uses the system proposal endpoint",
      call: (client: SynergiaApiClient) => client.getBehaviourSystemProposal(),
      path: "/BehaviourGrades/SystemProposal",
      key: "BehaviourGradesSystemProposal",
      value: {},
    },
    {
      name: "getDescriptiveGrades uses the descriptive grades endpoint",
      call: (client: SynergiaApiClient) => client.getDescriptiveGrades(),
      path: "/DescriptiveGrades",
      key: "DescriptiveGrades",
      value: [],
    },
    {
      name: "getDescriptiveGradeComments uses the descriptive grade comments endpoint",
      call: (client: SynergiaApiClient) => client.getDescriptiveGradeComments(),
      path: "/DescriptiveGrades/Comments",
      key: "DescriptiveGradesComments",
      value: [],
    },
    {
      name: "getDescriptiveGradeSkills uses the descriptive grade skills endpoint",
      call: (client: SynergiaApiClient) => client.getDescriptiveGradeSkills(),
      path: "/DescriptiveGrades/Skills",
      key: "DescriptiveGradesSkills",
      value: [],
    },
    {
      name: "getDescriptiveGradeText includes a grade group filter",
      call: (client: SynergiaApiClient) =>
        client.getDescriptiveGradeText("group-7"),
      path: "/DescriptiveGrades/Text?gradeGroupId=group-7",
      key: "DescriptiveGradesText",
      value: [],
    },
    {
      name: "getDescriptiveGradeTextCategories uses the text categories endpoint",
      call: (client: SynergiaApiClient) =>
        client.getDescriptiveGradeTextCategories(),
      path: "/DescriptiveGrades/Text/Categories",
      key: "DescriptiveGradesTextCategories",
      value: [],
    },
    {
      name: "getDescriptiveTextGrades uses the descriptive text grades endpoint",
      call: (client: SynergiaApiClient) => client.getDescriptiveTextGrades(),
      path: "/DescriptiveTextGrades",
      key: "DescriptiveTextGrades",
      value: [],
    },
    {
      name: "getDescriptiveTextGradeSkills uses the descriptive text grade skills endpoint",
      call: (client: SynergiaApiClient) =>
        client.getDescriptiveTextGradeSkills(),
      path: "/DescriptiveTextGrades/Skills",
      key: "DescriptiveTextGradesSkills",
      value: [],
    },
    {
      name: "getPointGrades includes a subject filter",
      call: (client: SynergiaApiClient) => client.getPointGrades(12),
      path: "/PointGrades?subject=12",
      key: "PointGrades",
      value: [],
    },
    {
      name: "getPointGradeAverages includes a subject filter",
      call: (client: SynergiaApiClient) => client.getPointGradeAverages(12),
      path: "/PointGrades/Averages?subject=12",
      key: "PointGradesAverages",
      value: [],
    },
    {
      name: "getPointGradeCategories uses the point grade categories endpoint",
      call: (client: SynergiaApiClient) => client.getPointGradeCategories(),
      path: "/PointGrades/Categories",
      key: "PointGradesCategories",
      value: [],
    },
    {
      name: "getPointGradeComments uses the point grade comments endpoint",
      call: (client: SynergiaApiClient) => client.getPointGradeComments(),
      path: "/PointGrades/Comments",
      key: "PointGradesComments",
      value: [],
    },
    {
      name: "getTextGrades uses the text grades endpoint",
      call: (client: SynergiaApiClient) => client.getTextGrades(),
      path: "/TextGrades",
      key: "TextGrades",
      value: [],
    },
    {
      name: "getAttendanceTypes uses the attendance types endpoint",
      call: (client: SynergiaApiClient) => client.getAttendanceTypes(),
      path: "/Attendances/Types",
      key: "AttendancesTypes",
      value: [],
    },
    {
      name: "getHomeworkAssignments uses the homework assignments endpoint",
      call: (client: SynergiaApiClient) => client.getHomeworkAssignments(),
      path: "/HomeWorkAssignments",
      key: "HomeWorkAssignments",
      value: [],
    },
    {
      name: "getHomeworkCategories uses the homework categories endpoint",
      call: (client: SynergiaApiClient) => client.getHomeworkCategories(),
      path: "/HomeWorks/Categories",
      key: "HomeWorksCategories",
      value: [],
    },
  ])("$name", async ({ call, path, key, value }) => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse(envelope(path, key, value)));

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

  it.each([
    {
      name: "grade averages",
      call: (client: SynergiaApiClient) => client.getGradeAverages(),
      path: "/Grades/Averages",
      key: "GradesAverages",
      value: [{ Id: 1, Average: "4.50" }],
      assert: (response: Record<string, unknown>) =>
        expect(response.GradesAverages).toEqual([{ Id: 1, Average: "4.50" }]),
    },
    {
      name: "grade categories",
      call: (client: SynergiaApiClient) => client.getGradeCategories(),
      path: "/Grades/Categories",
      key: "GradesCategories",
      value: [{ Id: 2, Name: "Sprawdzian" }],
      assert: (response: Record<string, unknown>) =>
        expect(response.GradesCategories).toEqual([
          { Id: 2, Name: "Sprawdzian" },
        ]),
    },
    {
      name: "grade comments",
      call: (client: SynergiaApiClient) => client.getGradeComments(),
      path: "/Grades/Comments",
      key: "GradesComments",
      value: [{ Id: 3, Text: "Good progress" }],
      assert: (response: Record<string, unknown>) =>
        expect(response.GradesComments).toEqual([
          { Id: 3, Text: "Good progress" },
        ]),
    },
    {
      name: "behaviour grades",
      call: (client: SynergiaApiClient) => client.getBehaviourGrades(),
      path: "/BehaviourGrades",
      key: "BehaviourGrades",
      value: [{ Id: 4, Grade: "A" }],
      assert: (response: Record<string, unknown>) =>
        expect(response.BehaviourGrades).toEqual([{ Id: 4, Grade: "A" }]),
    },
    {
      name: "behaviour grade types",
      call: (client: SynergiaApiClient) => client.getBehaviourGradeTypes(),
      path: "/BehaviourGrades/Types",
      key: "BehaviourGradesTypes",
      value: [{ Id: 5, Name: "Positive" }],
      assert: (response: Record<string, unknown>) =>
        expect(response.BehaviourGradesTypes).toEqual([
          { Id: 5, Name: "Positive" },
        ]),
    },
    {
      name: "behaviour grade points",
      call: (client: SynergiaApiClient) => client.getBehaviourGradePoints(),
      path: "/BehaviourGrades/Points",
      key: "BehaviourGradesPoints",
      value: [{ Id: 6, Points: 3 }],
      assert: (response: Record<string, unknown>) =>
        expect(response.BehaviourGradesPoints).toEqual([{ Id: 6, Points: 3 }]),
    },
    {
      name: "behaviour point categories",
      call: (client: SynergiaApiClient) => client.getBehaviourPointCategories(),
      path: "/BehaviourGrades/Points/Categories",
      key: "BehaviourGradesPointsCategories",
      value: [{ Id: 7, Name: "Activity" }],
      assert: (response: Record<string, unknown>) =>
        expect(response.BehaviourGradesPointsCategories).toEqual([
          { Id: 7, Name: "Activity" },
        ]),
    },
    {
      name: "behaviour point comments",
      call: (client: SynergiaApiClient) => client.getBehaviourPointComments(),
      path: "/BehaviourGrades/Points/Comments",
      key: "BehaviourGradesPointsComments",
      value: [{ Id: 8, Text: "Helpful in class" }],
      assert: (response: Record<string, unknown>) =>
        expect(response.BehaviourGradesPointsComments).toEqual([
          { Id: 8, Text: "Helpful in class" },
        ]),
    },
    {
      name: "behaviour system proposal",
      call: (client: SynergiaApiClient) => client.getBehaviourSystemProposal(),
      path: "/BehaviourGrades/SystemProposal",
      key: "BehaviourGradesSystemProposal",
      value: { Id: 9, Proposal: "Very good" },
      assert: (response: Record<string, unknown>) =>
        expect(response.BehaviourGradesSystemProposal).toEqual({
          Id: 9,
          Proposal: "Very good",
        }),
    },
    {
      name: "descriptive grades",
      call: (client: SynergiaApiClient) => client.getDescriptiveGrades(),
      path: "/DescriptiveGrades",
      key: "DescriptiveGrades",
      value: [{ Id: 10, Text: "Consistent work" }],
      assert: (response: Record<string, unknown>) =>
        expect(response.DescriptiveGrades).toEqual([
          { Id: 10, Text: "Consistent work" },
        ]),
    },
    {
      name: "descriptive grade comments",
      call: (client: SynergiaApiClient) => client.getDescriptiveGradeComments(),
      path: "/DescriptiveGrades/Comments",
      key: "DescriptiveGradesComments",
      value: [{ Id: 11, Text: "Needs more detail" }],
      assert: (response: Record<string, unknown>) =>
        expect(response.DescriptiveGradesComments).toEqual([
          { Id: 11, Text: "Needs more detail" },
        ]),
    },
    {
      name: "descriptive grade skills",
      call: (client: SynergiaApiClient) => client.getDescriptiveGradeSkills(),
      path: "/DescriptiveGrades/Skills",
      key: "DescriptiveGradesSkills",
      value: [{ Id: 12, Name: "Reading" }],
      assert: (response: Record<string, unknown>) =>
        expect(response.DescriptiveGradesSkills).toEqual([
          { Id: 12, Name: "Reading" },
        ]),
    },
    {
      name: "descriptive grade text",
      call: (client: SynergiaApiClient) => client.getDescriptiveGradeText(),
      path: "/DescriptiveGrades/Text",
      key: "DescriptiveGradesText",
      value: [{ Id: 13, Text: "Detailed feedback" }],
      assert: (response: Record<string, unknown>) =>
        expect(response.DescriptiveGradesText).toEqual([
          { Id: 13, Text: "Detailed feedback" },
        ]),
    },
    {
      name: "descriptive grade text categories",
      call: (client: SynergiaApiClient) =>
        client.getDescriptiveGradeTextCategories(),
      path: "/DescriptiveGrades/Text/Categories",
      key: "DescriptiveGradesTextCategories",
      value: [{ Id: 14, Name: "Effort" }],
      assert: (response: Record<string, unknown>) =>
        expect(response.DescriptiveGradesTextCategories).toEqual([
          { Id: 14, Name: "Effort" },
        ]),
    },
    {
      name: "descriptive text grades",
      call: (client: SynergiaApiClient) => client.getDescriptiveTextGrades(),
      path: "/DescriptiveTextGrades",
      key: "DescriptiveTextGrades",
      value: [{ Id: 15, Text: "Excellent summary" }],
      assert: (response: Record<string, unknown>) =>
        expect(response.DescriptiveTextGrades).toEqual([
          { Id: 15, Text: "Excellent summary" },
        ]),
    },
    {
      name: "descriptive text grade skills",
      call: (client: SynergiaApiClient) =>
        client.getDescriptiveTextGradeSkills(),
      path: "/DescriptiveTextGrades/Skills",
      key: "DescriptiveTextGradesSkills",
      value: [{ Id: 16, Name: "Writing" }],
      assert: (response: Record<string, unknown>) =>
        expect(response.DescriptiveTextGradesSkills).toEqual([
          { Id: 16, Name: "Writing" },
        ]),
    },
    {
      name: "point grades",
      call: (client: SynergiaApiClient) => client.getPointGrades(),
      path: "/PointGrades",
      key: "PointGrades",
      value: [{ Id: 17, Points: 12 }],
      assert: (response: Record<string, unknown>) =>
        expect(response.PointGrades).toEqual([{ Id: 17, Points: 12 }]),
    },
    {
      name: "point grade averages",
      call: (client: SynergiaApiClient) => client.getPointGradeAverages(),
      path: "/PointGrades/Averages",
      key: "PointGradesAverages",
      value: [{ Id: 18, Average: 8.5 }],
      assert: (response: Record<string, unknown>) =>
        expect(response.PointGradesAverages).toEqual([
          { Id: 18, Average: 8.5 },
        ]),
    },
    {
      name: "point grade categories",
      call: (client: SynergiaApiClient) => client.getPointGradeCategories(),
      path: "/PointGrades/Categories",
      key: "PointGradesCategories",
      value: [{ Id: 19, Name: "Quiz" }],
      assert: (response: Record<string, unknown>) =>
        expect(response.PointGradesCategories).toEqual([
          { Id: 19, Name: "Quiz" },
        ]),
    },
    {
      name: "point grade comments",
      call: (client: SynergiaApiClient) => client.getPointGradeComments(),
      path: "/PointGrades/Comments",
      key: "PointGradesComments",
      value: [{ Id: 20, Text: "Great effort" }],
      assert: (response: Record<string, unknown>) =>
        expect(response.PointGradesComments).toEqual([
          { Id: 20, Text: "Great effort" },
        ]),
    },
    {
      name: "text grades",
      call: (client: SynergiaApiClient) => client.getTextGrades(),
      path: "/TextGrades",
      key: "TextGrades",
      value: [{ Id: 21, Text: "Approved" }],
      assert: (response: Record<string, unknown>) =>
        expect(response.TextGrades).toEqual([{ Id: 21, Text: "Approved" }]),
    },
    {
      name: "attendance types",
      call: (client: SynergiaApiClient) => client.getAttendanceTypes(),
      path: "/Attendances/Types",
      key: "AttendancesTypes",
      value: [{ Id: 22, Name: "Excused" }],
      assert: (response: Record<string, unknown>) =>
        expect(response.AttendancesTypes).toEqual([
          { Id: 22, Name: "Excused" },
        ]),
    },
    {
      name: "homework assignments",
      call: (client: SynergiaApiClient) => client.getHomeworkAssignments(),
      path: "/HomeWorkAssignments",
      key: "HomeWorkAssignments",
      value: [{ Id: 23, Content: "Read chapter 5" }],
      assert: (response: Record<string, unknown>) =>
        expect(response.HomeWorkAssignments).toEqual([
          { Id: 23, Content: "Read chapter 5" },
        ]),
    },
    {
      name: "homework categories",
      call: (client: SynergiaApiClient) => client.getHomeworkCategories(),
      path: "/HomeWorks/Categories",
      key: "HomeWorksCategories",
      value: [{ Id: 24, Name: "Project" }],
      assert: (response: Record<string, unknown>) =>
        expect(response.HomeWorksCategories).toEqual([
          { Id: 24, Name: "Project" },
        ]),
    },
  ])("parses %s responses", async ({ call, path, key, value, assert }) => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse(envelope(path, key, value)));

    const client = new SynergiaApiClient("token", { fetch: fetchMock });
    const response = (await call(client)) as Record<string, unknown>;

    assert(response);
    expect(fetchMock).toHaveBeenCalledWith(`${apiBaseUrl}${path}`, {
      method: "GET",
      headers: {
        accept: "application/json",
        authorization: "Bearer token",
      },
    });
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
    expect(fetchMock).toHaveBeenCalledWith(
      `${apiBaseUrl}/HomeWorkAssignments/Attachment/55`,
      {
        method: "GET",
        headers: {
          authorization: "Bearer token",
        },
      },
    );
  });
});
