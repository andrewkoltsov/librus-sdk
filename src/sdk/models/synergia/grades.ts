import type { ApiRef } from "../common.js";

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
