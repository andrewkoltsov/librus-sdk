import * as v from "valibot";

import { apiRefSchema } from "../common.js";
import { synergiaResponseEnvelopeSchema } from "./common.js";

const schoolNoticeSchema = v.looseObject({
  AddedBy: v.exactOptional(v.union([apiRefSchema, v.null()])),
  EndDate: v.exactOptional(v.union([v.string(), v.null()])),
  Id: v.union([v.string(), v.number()]),
  StartDate: v.exactOptional(v.union([v.string(), v.null()])),
});

export const schoolNoticesResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  SchoolNotices: v.array(schoolNoticeSchema),
});

export const schoolNoticeResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  SchoolNotice: schoolNoticeSchema,
});
