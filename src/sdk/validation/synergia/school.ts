import * as v from "valibot";

import {
  synergiaEntityListSchema,
  synergiaEntitySchema,
  synergiaResponseEnvelopeSchema,
} from "./common.js";

export const schoolResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  School: synergiaEntitySchema,
});

export const classResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  Class: synergiaEntitySchema,
});

export const classroomResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  Classroom: synergiaEntitySchema,
});

export const subjectsResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  Subjects: synergiaEntityListSchema,
});

export const subjectResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  Subject: synergiaEntitySchema,
});

export const usersResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  Users: synergiaEntityListSchema,
});

export const userResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  User: synergiaEntitySchema,
});
