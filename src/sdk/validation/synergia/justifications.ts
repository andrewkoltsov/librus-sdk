import * as v from "valibot";

import { apiRefOrJsonSchema, unknownRecordSchema } from "../common.js";
import { synergiaResponseEnvelopeSchema } from "./common.js";

const justificationSchema = v.looseObject({
  AddedBy: v.exactOptional(v.union([apiRefOrJsonSchema, v.null()])),
  Id: v.union([v.string(), v.number()]),
  Student: v.exactOptional(v.union([apiRefOrJsonSchema, v.null()])),
});

export const justificationsResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  Justifications: v.array(justificationSchema),
});

export const justificationResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  Justification: justificationSchema,
});

export const parentTeacherConferencesResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  ParentTeacherConferences: v.array(unknownRecordSchema),
});

export const systemDataResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  Date: v.string(),
  Time: v.string(),
});
