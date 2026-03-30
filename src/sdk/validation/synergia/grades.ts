import * as v from "valibot";

import { apiRefSchema } from "../common.js";
import { synergiaResponseEnvelopeSchema } from "./common.js";

const gradeSchema = v.looseObject({
  AddDate: v.string(),
  AddedBy: apiRefSchema,
  Category: apiRefSchema,
  Date: v.string(),
  Grade: v.string(),
  Id: v.number(),
  IsConstituent: v.boolean(),
  IsFinal: v.boolean(),
  IsFinalProposition: v.boolean(),
  IsSemester: v.boolean(),
  IsSemesterProposition: v.boolean(),
  Lesson: apiRefSchema,
  Semester: v.number(),
  Student: apiRefSchema,
  Subject: apiRefSchema,
});

export const gradesResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  Grades: v.array(gradeSchema),
});
