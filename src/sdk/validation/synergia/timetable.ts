import * as v from "valibot";

import { apiRefOrJsonSchema, apiRefSchema } from "../common.js";
import {
  synergiaEntityListSchema,
  synergiaResponseEnvelopeSchema,
} from "./common.js";

const timetableLessonSchema = v.looseObject({
  Class: v.exactOptional(v.union([apiRefOrJsonSchema, v.null()])),
  Lesson: v.exactOptional(v.union([apiRefSchema, v.null()])),
  Subject: v.exactOptional(v.union([apiRefOrJsonSchema, v.null()])),
  Teacher: v.exactOptional(v.union([apiRefOrJsonSchema, v.null()])),
  TimetableEntry: v.exactOptional(v.union([apiRefSchema, v.null()])),
});

const timetableEntrySchema = v.looseObject({
  DateFrom: v.exactOptional(v.string()),
  DateTo: v.exactOptional(v.string()),
  DayOfTheWeek: v.exactOptional(v.union([v.string(), v.number()])),
  Id: v.union([v.string(), v.number()]),
  Lesson: v.exactOptional(v.union([apiRefSchema, v.null()])),
  LessonNo: v.exactOptional(v.union([v.string(), v.number()])),
});

const substitutionSchema = v.looseObject({
  Classroom: v.exactOptional(v.union([apiRefSchema, v.null()])),
  Id: v.union([v.string(), v.number()]),
  Lesson: v.exactOptional(v.union([apiRefSchema, v.null()])),
  Subject: v.exactOptional(v.union([apiRefSchema, v.null()])),
  Teacher: v.exactOptional(v.union([apiRefSchema, v.null()])),
});

export const timetablesResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  Timetable: v.record(v.string(), v.array(v.array(timetableLessonSchema))),
});

export const timetableEntryResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  TimetableEntry: timetableEntrySchema,
});

export const calendarsResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  Calendars: synergiaEntityListSchema,
});

export const classFreeDaysResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  ClassFreeDays: synergiaEntityListSchema,
});

export const classFreeDayTypesResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  Types: synergiaEntityListSchema,
});

export const schoolFreeDaysResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  SchoolFreeDays: synergiaEntityListSchema,
});

export const teacherFreeDaysResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  TeacherFreeDays: synergiaEntityListSchema,
});

export const substitutionResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  Substitution: substitutionSchema,
});

export const virtualClassesResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  VirtualClasses: synergiaEntityListSchema,
});
