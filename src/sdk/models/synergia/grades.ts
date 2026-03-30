import type { ApiRef, JsonObject } from "../common.js";

import type { SynergiaResponseEnvelope } from "./common.js";

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

export interface GradeAveragesResponse extends SynergiaResponseEnvelope {
  GradesAverages: GradeAverage[];
}

export interface GradeCategoriesResponse extends SynergiaResponseEnvelope {
  GradesCategories: GradeCategory[];
}

export interface GradeCommentsResponse extends SynergiaResponseEnvelope {
  GradesComments: GradeComment[];
}

export interface BehaviourGradesResponse extends SynergiaResponseEnvelope {
  BehaviourGrades: BehaviourGrade[];
}

export interface BehaviourGradeTypesResponse extends SynergiaResponseEnvelope {
  BehaviourGradesTypes: BehaviourGradeType[];
}

export interface BehaviourGradePointsResponse extends SynergiaResponseEnvelope {
  BehaviourGradesPoints: BehaviourGradePoint[];
}

export interface BehaviourPointCategoriesResponse extends SynergiaResponseEnvelope {
  BehaviourGradesPointsCategories: BehaviourPointCategory[];
}

export interface BehaviourPointCommentsResponse extends SynergiaResponseEnvelope {
  BehaviourGradesPointsComments: BehaviourPointComment[];
}

export interface BehaviourSystemProposalResponse extends SynergiaResponseEnvelope {
  BehaviourGradesSystemProposal:
    | BehaviourSystemProposal
    | BehaviourSystemProposal[]
    | null;
}

export interface DescriptiveGradesResponse extends SynergiaResponseEnvelope {
  DescriptiveGrades: DescriptiveGrade[];
}

export interface DescriptiveGradeCommentsResponse extends SynergiaResponseEnvelope {
  DescriptiveGradesComments: DescriptiveGradeComment[];
}

export interface DescriptiveGradeSkillsResponse extends SynergiaResponseEnvelope {
  DescriptiveGradesSkills: DescriptiveGradeSkill[];
}

export interface DescriptiveGradeTextResponse extends SynergiaResponseEnvelope {
  DescriptiveGradesText: DescriptiveGradeText[];
}

export interface DescriptiveGradeTextCategoriesResponse extends SynergiaResponseEnvelope {
  DescriptiveGradesTextCategories: DescriptiveGradeTextCategory[];
}

export interface DescriptiveTextGradesResponse extends SynergiaResponseEnvelope {
  DescriptiveTextGrades: DescriptiveTextGrade[];
}

export interface DescriptiveTextGradeSkillsResponse extends SynergiaResponseEnvelope {
  DescriptiveTextGradesSkills: DescriptiveTextGradeSkill[];
}

export interface PointGradesResponse extends SynergiaResponseEnvelope {
  PointGrades: PointGrade[];
}

export interface PointGradeAveragesResponse extends SynergiaResponseEnvelope {
  PointGradesAverages: PointGradeAverage[];
}

export interface PointGradeCategoriesResponse extends SynergiaResponseEnvelope {
  PointGradesCategories: PointGradeCategory[];
}

export interface PointGradeCommentsResponse extends SynergiaResponseEnvelope {
  PointGradesComments: PointGradeComment[];
}

export interface TextGradesResponse extends SynergiaResponseEnvelope {
  TextGrades: TextGrade[];
}
