import type { ApiRef, JsonObject } from "../common.js";

import type { SynergiaResponseEnvelope } from "./common.js";

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

export type AttendanceType = JsonObject;

export interface AttendanceTypesResponse extends SynergiaResponseEnvelope {
  Types: AttendanceType[];
}
