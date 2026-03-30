import * as v from "valibot";

import { apiRefSchema } from "../common.js";
import {
  synergiaEntityListSchema,
  synergiaResponseEnvelopeSchema,
} from "./common.js";

const noteSchema = v.looseObject({
  AddedBy: v.exactOptional(v.union([apiRefSchema, v.null()])),
  Category: v.exactOptional(v.union([apiRefSchema, v.null()])),
  Id: v.union([v.string(), v.number()]),
  Student: v.exactOptional(v.union([apiRefSchema, v.null()])),
  Teacher: v.exactOptional(v.union([apiRefSchema, v.null()])),
});

export const notesResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  Notes: v.array(noteSchema),
});

export const noteResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  Note: noteSchema,
});

export const noteCategoriesResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  Categories: synergiaEntityListSchema,
});
