import * as v from "valibot";

import { apiRefSchema } from "../common.js";
import { synergiaResponseEnvelopeSchema } from "./common.js";

const attendanceSchema = v.looseObject({
  AddDate: v.string(),
  AddedBy: apiRefSchema,
  Date: v.string(),
  Id: v.union([v.string(), v.number()]),
  Lesson: apiRefSchema,
  LessonNo: v.number(),
  Semester: v.number(),
  Student: apiRefSchema,
  Trip: v.optional(apiRefSchema),
  Type: apiRefSchema,
});

export const attendancesResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  Attendances: v.array(attendanceSchema),
});
