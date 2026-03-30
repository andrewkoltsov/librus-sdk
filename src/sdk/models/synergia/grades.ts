import type { ApiRef, JsonObject } from "../common.js";

import type {
  SynergiaResponseEnvelope,
  SynergiaStatusResponse,
} from "./common.js";

export interface Grade {
  Id: number;
  Lesson: ApiRef;
  Subject: ApiRef;
  Student: ApiRef;
  Category: ApiRef;
  AddedBy: ApiRef;
  Grade: string;
  Date: string;
  AddDate: string;
  Semester: number;
  IsConstituent: boolean;
  IsSemester: boolean;
  IsSemesterProposition: boolean;
  IsFinal: boolean;
  IsFinalProposition: boolean;
}

export interface GradesResponse extends SynergiaResponseEnvelope {
  Grades: Grade[];
}

export type GradeAverage = JsonObject;

export type GradeCategory = JsonObject;

export type GradeComment = JsonObject;

export type BehaviourGrade = JsonObject;

export type BehaviourGradeType = JsonObject;

export type BehaviourGradePoint = JsonObject;

export type BehaviourPointCategory = JsonObject;

export type BehaviourPointComment = JsonObject;

export type BehaviourSystemProposal = JsonObject;

export type DescriptiveGrade = JsonObject;

export type DescriptiveGradeComment = JsonObject;

export type DescriptiveGradeSkill = JsonObject;

export type DescriptiveGradeText = JsonObject;

export type DescriptiveGradeTextCategory = JsonObject;

export type DescriptiveTextGrade = JsonObject;

export type DescriptiveTextGradeSkill = JsonObject;

export type PointGrade = JsonObject;

export type PointGradeAverage = JsonObject;

export type PointGradeCategory = JsonObject;

export type PointGradeComment = JsonObject;

export type TextGrade = JsonObject;

export interface GradeAveragesListResponse extends SynergiaResponseEnvelope {
  Averages: GradeAverage[];
}

export type GradeAveragesResponse =
  | GradeAveragesListResponse
  | SynergiaStatusResponse;

export interface GradeCategoriesResponse extends SynergiaResponseEnvelope {
  Categories: GradeCategory[];
}

export interface GradeCommentsResponse extends SynergiaResponseEnvelope {
  Comments: GradeComment[];
}

export interface BehaviourGradesResponse extends SynergiaResponseEnvelope {
  Grades: BehaviourGrade[];
}

export interface BehaviourGradeTypesResponse extends SynergiaResponseEnvelope {
  Types: BehaviourGradeType[];
}

export interface BehaviourGradePointsResponse extends SynergiaResponseEnvelope {
  Grades: BehaviourGradePoint[];
}

export interface BehaviourPointCategoriesResponse extends SynergiaResponseEnvelope {
  Categories: BehaviourPointCategory[];
}

export interface BehaviourPointCommentsResponse extends SynergiaResponseEnvelope {
  Comments: BehaviourPointComment[];
}

export interface BehaviourSystemProposalResponse extends SynergiaResponseEnvelope {
  BehaviourGradesSystemProposal:
    | BehaviourSystemProposal
    | BehaviourSystemProposal[]
    | null;
}

export interface DescriptiveGradesResponse extends SynergiaResponseEnvelope {
  Grades: DescriptiveGrade[];
}

export interface DescriptiveGradeCommentsResponse extends SynergiaResponseEnvelope {
  Comments: DescriptiveGradeComment[];
}

export interface DescriptiveGradeSkillsResponse extends SynergiaResponseEnvelope {
  Skills: DescriptiveGradeSkill[];
}

export interface DescriptiveGradeTextResponse extends SynergiaResponseEnvelope {
  Grades: DescriptiveGradeText[];
}

export interface DescriptiveGradeTextCategoriesResponse extends SynergiaResponseEnvelope {
  Categories: DescriptiveGradeTextCategory[];
}

export interface DescriptiveTextGradesResponse extends SynergiaResponseEnvelope {
  Grades: DescriptiveTextGrade[];
}

export interface DescriptiveTextGradeSkillsResponse extends SynergiaResponseEnvelope {
  Skills: DescriptiveTextGradeSkill[];
}

export interface PointGradesResponse extends SynergiaResponseEnvelope {
  Grades: PointGrade[];
}

export interface PointGradeAveragesListResponse extends SynergiaResponseEnvelope {
  Averages: PointGradeAverage[];
}

export type PointGradeAveragesResponse =
  | PointGradeAveragesListResponse
  | SynergiaStatusResponse;

export interface PointGradeCategoriesResponse extends SynergiaResponseEnvelope {
  Categories: PointGradeCategory[];
}

export interface PointGradeCommentsResponse extends SynergiaResponseEnvelope {
  Comments: PointGradeComment[];
}

export interface TextGradesResponse extends SynergiaResponseEnvelope {
  Grades: TextGrade[];
}
