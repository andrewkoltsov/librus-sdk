import type { ApiRef, JsonObject } from "./common.js";

export interface SynergiaMe {
  Account: JsonObject;
  Class: JsonObject | null;
  Refresh: string | boolean | number;
  User: JsonObject;
}

export interface SynergiaResponseEnvelope {
  Resources: Record<string, unknown>;
  Url: string;
}

export interface SynergiaMeResponse extends SynergiaResponseEnvelope {
  Me: SynergiaMe;
}

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

export interface Attendance {
  Id: string | number;
  Lesson: ApiRef;
  Student: ApiRef;
  Trip?: ApiRef | undefined;
  Date: string;
  AddDate: string;
  LessonNo: number;
  Semester: number;
  Type: ApiRef;
  AddedBy: ApiRef;
}

export interface AttendancesResponse extends SynergiaResponseEnvelope {
  Attendances: Attendance[];
}

export interface HomeWork {
  AddDate: string;
  Category: JsonObject | ApiRef | null;
  Class: JsonObject | ApiRef | null;
  Content: string;
  CreatedBy: JsonObject | ApiRef | null;
  Date: string;
  Id: number;
  LessonNo: number;
  Subject: JsonObject | ApiRef | null;
  TimeFrom: string | null;
  TimeTo: string | null;
}

export interface HomeWorksResponse extends SynergiaResponseEnvelope {
  HomeWorks: HomeWork[];
}
