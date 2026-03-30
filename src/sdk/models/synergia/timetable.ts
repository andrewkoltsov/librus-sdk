import type { ApiRef, JsonObject } from "../common.js";

import type { SynergiaResponseEnvelope } from "./common.js";

type SynergiaId = string | number;

export type TimetableLesson = JsonObject & {
  Class?: ApiRef | JsonObject | null;
  Lesson?: ApiRef | null;
  Subject?: ApiRef | JsonObject | null;
  Teacher?: ApiRef | JsonObject | null;
  TimetableEntry?: ApiRef | null;
};

export type Timetable = Record<string, TimetableLesson[][]>;

export type TimetableEntry = JsonObject & {
  DayOfTheWeek?: string | number;
  DateFrom?: string;
  DateTo?: string;
  Lesson?: ApiRef | null;
  LessonNo?: string | number;
  Id: SynergiaId;
};

export type Calendar = JsonObject;

export type ClassFreeDay = JsonObject;

export type ClassFreeDayType = JsonObject;

export type SchoolFreeDay = JsonObject;

export type TeacherFreeDay = JsonObject;

export type Substitution = JsonObject & {
  Classroom?: ApiRef | null;
  Id: SynergiaId;
  Lesson?: ApiRef | null;
  Subject?: ApiRef | null;
  Teacher?: ApiRef | null;
};

export type VirtualClass = JsonObject;

export interface TimetablesResponse extends SynergiaResponseEnvelope {
  Timetable: Timetable;
}

export interface TimetableEntryResponse extends SynergiaResponseEnvelope {
  TimetableEntry: TimetableEntry;
}

export interface CalendarsResponse extends SynergiaResponseEnvelope {
  Calendars: Calendar[];
}

export interface ClassFreeDaysResponse extends SynergiaResponseEnvelope {
  ClassFreeDays: ClassFreeDay[];
}

export interface ClassFreeDayTypesResponse extends SynergiaResponseEnvelope {
  Types: ClassFreeDayType[];
}

export interface SchoolFreeDaysResponse extends SynergiaResponseEnvelope {
  SchoolFreeDays: SchoolFreeDay[];
}

export interface TeacherFreeDaysResponse extends SynergiaResponseEnvelope {
  TeacherFreeDays: TeacherFreeDay[];
}

export interface SubstitutionResponse extends SynergiaResponseEnvelope {
  Substitution: Substitution;
}

export interface VirtualClassesResponse extends SynergiaResponseEnvelope {
  VirtualClasses: VirtualClass[];
}
