import type { ApiRef, JsonObject } from "../common.js";

import type {
  SynergiaBinaryResult,
  SynergiaResponseEnvelope,
} from "./common.js";

type SynergiaId = string | number;

export type Lesson = JsonObject & {
  Id: SynergiaId;
  Classroom?: ApiRef | JsonObject | null;
  Subject?: ApiRef | JsonObject | null;
  Teacher?: ApiRef | JsonObject | null;
};

export type PlannedLesson = JsonObject & {
  Id: SynergiaId;
  Attachment?: ApiRef | JsonObject | string | number | null;
  Classroom?: ApiRef | JsonObject | null;
  Subject?: ApiRef | JsonObject | null;
  Teacher?: ApiRef | JsonObject | null;
};

export type Realization = JsonObject & {
  Id: SynergiaId;
  Classroom?: ApiRef | JsonObject | null;
  Subject?: ApiRef | JsonObject | null;
  Teacher?: ApiRef | JsonObject | null;
};

export interface LessonsResponse extends SynergiaResponseEnvelope {
  Lessons: Lesson[];
}

export interface LessonResponse extends SynergiaResponseEnvelope {
  Lesson: Lesson;
}

export interface PlannedLessonsResponse extends SynergiaResponseEnvelope {
  PlannedLessons: PlannedLesson[];
}

export interface PlannedLessonResponse extends SynergiaResponseEnvelope {
  PlannedLesson: PlannedLesson;
}

export interface RealizationsResponse extends SynergiaResponseEnvelope {
  Realizations: Realization[];
}

export interface RealizationResponse extends SynergiaResponseEnvelope {
  Realization: Realization;
}

export type PlannedLessonAttachmentResult = SynergiaBinaryResult;
