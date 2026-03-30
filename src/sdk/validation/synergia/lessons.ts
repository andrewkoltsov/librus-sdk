import * as v from "valibot";

import { apiRefOrJsonSchema } from "../common.js";
import { synergiaResponseEnvelopeSchema } from "./common.js";

const lessonEntitySchema = v.looseObject({
  Classroom: v.exactOptional(v.union([apiRefOrJsonSchema, v.null()])),
  Id: v.union([v.string(), v.number()]),
  Subject: v.exactOptional(v.union([apiRefOrJsonSchema, v.null()])),
  Teacher: v.exactOptional(v.union([apiRefOrJsonSchema, v.null()])),
});

const plannedLessonEntitySchema = v.looseObject({
  Attachment: v.exactOptional(
    v.union([apiRefOrJsonSchema, v.string(), v.number(), v.null()]),
  ),
  Classroom: v.exactOptional(v.union([apiRefOrJsonSchema, v.null()])),
  Id: v.union([v.string(), v.number()]),
  Subject: v.exactOptional(v.union([apiRefOrJsonSchema, v.null()])),
  Teacher: v.exactOptional(v.union([apiRefOrJsonSchema, v.null()])),
});

const realizationEntitySchema = v.looseObject({
  Classroom: v.exactOptional(v.union([apiRefOrJsonSchema, v.null()])),
  Id: v.union([v.string(), v.number()]),
  Subject: v.exactOptional(v.union([apiRefOrJsonSchema, v.null()])),
  Teacher: v.exactOptional(v.union([apiRefOrJsonSchema, v.null()])),
});

export const lessonsResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  Lessons: v.array(lessonEntitySchema),
});

export const lessonResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  Lesson: lessonEntitySchema,
});

export const plannedLessonsResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  PlannedLessons: v.array(plannedLessonEntitySchema),
});

export const plannedLessonResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  PlannedLesson: plannedLessonEntitySchema,
});

export const realizationsResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  Realizations: v.array(realizationEntitySchema),
});

export const realizationResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  Realization: realizationEntitySchema,
});
