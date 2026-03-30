import type { FetchLike } from "../models/common.js";
import type {
  AttendanceTypesResponse,
  AttendancesResponse,
} from "../models/synergia/attendance.js";
import type {
  BehaviourGradePointsResponse,
  BehaviourGradeTypesResponse,
  BehaviourGradesResponse,
  BehaviourPointCategoriesResponse,
  BehaviourPointCommentsResponse,
  BehaviourSystemProposalResponse,
  DescriptiveGradeCommentsResponse,
  DescriptiveGradeSkillsResponse,
  DescriptiveGradeTextCategoriesResponse,
  DescriptiveGradeTextResponse,
  DescriptiveGradesResponse,
  DescriptiveTextGradesResponse,
  DescriptiveTextGradeSkillsResponse,
  GradeAveragesResponse,
  GradeCategoriesResponse,
  GradeCommentsResponse,
  GradesResponse,
  PointGradeAveragesResponse,
  PointGradeCategoriesResponse,
  PointGradeCommentsResponse,
  PointGradesResponse,
  TextGradesResponse,
} from "../models/synergia/grades.js";
import type { SynergiaBinaryResult } from "../models/synergia/common.js";
import type {
  HomeworkCategoriesResponse,
  HomeWorksResponse,
} from "../models/synergia/homework.js";
import type { HomeworkAssignmentsResponse } from "../models/synergia/homeworkAssignments.js";
import type { SynergiaMeResponse } from "../models/synergia/me.js";
import {
  attendanceTypesResponseSchema,
  attendancesResponseSchema,
} from "../validation/synergia/attendance.js";
import {
  behaviourGradePointsResponseSchema,
  behaviourGradeTypesResponseSchema,
  behaviourGradesResponseSchema,
  behaviourPointCategoriesResponseSchema,
  behaviourPointCommentsResponseSchema,
  behaviourSystemProposalResponseSchema,
  descriptiveGradeCommentsResponseSchema,
  descriptiveGradeSkillsResponseSchema,
  descriptiveGradeTextCategoriesResponseSchema,
  descriptiveGradeTextResponseSchema,
  descriptiveGradesResponseSchema,
  descriptiveTextGradesResponseSchema,
  descriptiveTextGradeSkillsResponseSchema,
  gradeAveragesResponseSchema,
  gradeCategoriesResponseSchema,
  gradeCommentsResponseSchema,
  gradesResponseSchema,
  pointGradeAveragesResponseSchema,
  pointGradeCategoriesResponseSchema,
  pointGradeCommentsResponseSchema,
  pointGradesResponseSchema,
  textGradesResponseSchema,
} from "../validation/synergia/grades.js";
import {
  homeWorksResponseSchema,
  homeworkCategoriesResponseSchema,
} from "../validation/synergia/homework.js";
import { homeworkAssignmentsResponseSchema } from "../validation/synergia/homeworkAssignments.js";
import { synergiaMeResponseSchema } from "../validation/synergia/me.js";
import type { BaseIssue, BaseSchema, InferOutput } from "valibot";

import {
  getBinary as requestGetBinary,
  getJson as requestGetJson,
} from "./request.js";
import type { SynergiaRequestOptions } from "./request.js";

export interface SynergiaApiClientOptions {
  fetch?: FetchLike;
  apiBaseUrl?: string;
}

type SynergiaId = string | number;

export class SynergiaApiClient {
  private readonly fetchImpl: FetchLike;
  private readonly apiBaseUrl: string;
  private readonly accessToken: string;

  constructor(accessToken: string, options: SynergiaApiClientOptions = {}) {
    this.accessToken = accessToken;
    this.fetchImpl = options.fetch ?? fetch;
    this.apiBaseUrl = options.apiBaseUrl ?? "https://api.librus.pl/3.0";
  }

  private getJson<
    TSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
  >(
    path: string,
    schema: TSchema,
    options: SynergiaRequestOptions = {},
  ): Promise<InferOutput<TSchema>> {
    return requestGetJson(
      this.fetchImpl,
      this.accessToken,
      this.apiBaseUrl,
      path,
      schema,
      options,
    );
  }

  private getBinary(
    path: string,
    options: SynergiaRequestOptions = {},
  ): Promise<SynergiaBinaryResult> {
    return requestGetBinary(
      this.fetchImpl,
      this.accessToken,
      this.apiBaseUrl,
      path,
      options,
    );
  }

  getMe(): Promise<SynergiaMeResponse> {
    return this.getJson("/Me", synergiaMeResponseSchema);
  }

  getGrades(): Promise<GradesResponse> {
    return this.getJson("/Grades", gradesResponseSchema);
  }

  getGradeAverages(subjectId?: SynergiaId): Promise<GradeAveragesResponse> {
    return this.getJson("/Grades/Averages", gradeAveragesResponseSchema, {
      query: { subject: subjectId },
    });
  }

  getGradeCategories(): Promise<GradeCategoriesResponse> {
    return this.getJson("/Grades/Categories", gradeCategoriesResponseSchema);
  }

  getGradeComments(): Promise<GradeCommentsResponse> {
    return this.getJson("/Grades/Comments", gradeCommentsResponseSchema);
  }

  getBehaviourGrades(): Promise<BehaviourGradesResponse> {
    return this.getJson("/BehaviourGrades", behaviourGradesResponseSchema);
  }

  getBehaviourGradeTypes(): Promise<BehaviourGradeTypesResponse> {
    return this.getJson(
      "/BehaviourGrades/Types",
      behaviourGradeTypesResponseSchema,
    );
  }

  getBehaviourGradePoints(): Promise<BehaviourGradePointsResponse> {
    return this.getJson(
      "/BehaviourGrades/Points",
      behaviourGradePointsResponseSchema,
    );
  }

  getBehaviourPointCategories(): Promise<BehaviourPointCategoriesResponse> {
    return this.getJson(
      "/BehaviourGrades/Points/Categories",
      behaviourPointCategoriesResponseSchema,
    );
  }

  getBehaviourPointComments(): Promise<BehaviourPointCommentsResponse> {
    return this.getJson(
      "/BehaviourGrades/Points/Comments",
      behaviourPointCommentsResponseSchema,
    );
  }

  getBehaviourSystemProposal(): Promise<BehaviourSystemProposalResponse> {
    return this.getJson(
      "/BehaviourGrades/SystemProposal",
      behaviourSystemProposalResponseSchema,
    );
  }

  getDescriptiveGrades(): Promise<DescriptiveGradesResponse> {
    return this.getJson("/DescriptiveGrades", descriptiveGradesResponseSchema);
  }

  getDescriptiveGradeComments(): Promise<DescriptiveGradeCommentsResponse> {
    return this.getJson(
      "/DescriptiveGrades/Comments",
      descriptiveGradeCommentsResponseSchema,
    );
  }

  getDescriptiveGradeSkills(): Promise<DescriptiveGradeSkillsResponse> {
    return this.getJson(
      "/DescriptiveGrades/Skills",
      descriptiveGradeSkillsResponseSchema,
    );
  }

  getDescriptiveGradeText(
    gradeGroupId?: SynergiaId,
  ): Promise<DescriptiveGradeTextResponse> {
    return this.getJson(
      "/DescriptiveGrades/Text",
      descriptiveGradeTextResponseSchema,
      {
        query: { gradeGroupId },
      },
    );
  }

  getDescriptiveGradeTextCategories(): Promise<DescriptiveGradeTextCategoriesResponse> {
    return this.getJson(
      "/DescriptiveGrades/Text/Categories",
      descriptiveGradeTextCategoriesResponseSchema,
    );
  }

  getDescriptiveTextGrades(): Promise<DescriptiveTextGradesResponse> {
    return this.getJson(
      "/DescriptiveTextGrades",
      descriptiveTextGradesResponseSchema,
    );
  }

  getDescriptiveTextGradeSkills(): Promise<DescriptiveTextGradeSkillsResponse> {
    return this.getJson(
      "/DescriptiveTextGrades/Skills",
      descriptiveTextGradeSkillsResponseSchema,
    );
  }

  getPointGrades(subjectId?: SynergiaId): Promise<PointGradesResponse> {
    return this.getJson("/PointGrades", pointGradesResponseSchema, {
      query: { subject: subjectId },
    });
  }

  getPointGradeAverages(
    subjectId?: SynergiaId,
  ): Promise<PointGradeAveragesResponse> {
    return this.getJson(
      "/PointGrades/Averages",
      pointGradeAveragesResponseSchema,
      {
        query: { subject: subjectId },
      },
    );
  }

  getPointGradeCategories(): Promise<PointGradeCategoriesResponse> {
    return this.getJson(
      "/PointGrades/Categories",
      pointGradeCategoriesResponseSchema,
    );
  }

  getPointGradeComments(): Promise<PointGradeCommentsResponse> {
    return this.getJson(
      "/PointGrades/Comments",
      pointGradeCommentsResponseSchema,
    );
  }

  getTextGrades(): Promise<TextGradesResponse> {
    return this.getJson("/TextGrades", textGradesResponseSchema);
  }

  getAttendances(): Promise<AttendancesResponse> {
    return this.getJson("/Attendances", attendancesResponseSchema);
  }

  getAttendanceTypes(): Promise<AttendanceTypesResponse> {
    return this.getJson("/Attendances/Types", attendanceTypesResponseSchema);
  }

  getHomeWorks(): Promise<HomeWorksResponse> {
    return this.getJson("/HomeWorks", homeWorksResponseSchema);
  }

  getHomeworkAssignments(): Promise<HomeworkAssignmentsResponse> {
    return this.getJson(
      "/HomeWorkAssignments",
      homeworkAssignmentsResponseSchema,
    );
  }

  getHomeworkAssignmentAttachment(
    id: SynergiaId,
  ): Promise<SynergiaBinaryResult> {
    return this.getBinary(
      `/HomeWorkAssignments/Attachment/${encodeURIComponent(String(id))}`,
    );
  }

  getHomeworkCategories(): Promise<HomeworkCategoriesResponse> {
    return this.getJson(
      "/HomeWorks/Categories",
      homeworkCategoriesResponseSchema,
    );
  }
}
