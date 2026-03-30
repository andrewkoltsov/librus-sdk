import * as v from "valibot";

import { unknownRecordSchema } from "../common.js";

export const synergiaResponseEnvelopeSchema = v.looseObject({
  Resources: unknownRecordSchema,
  Url: v.string(),
});

export const synergiaStatusResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  Status: v.string(),
  Code: v.optional(v.string()),
  Message: v.optional(v.string()),
  MessagePL: v.optional(v.string()),
});

export const synergiaEntitySchema = v.looseObject({});

export const synergiaEntityListSchema = v.array(synergiaEntitySchema);
