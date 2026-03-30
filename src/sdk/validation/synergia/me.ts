import * as v from "valibot";

import { nullableUnknownRecordSchema, unknownRecordSchema } from "../common.js";
import { synergiaResponseEnvelopeSchema } from "./common.js";

export const synergiaMeResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  Me: v.looseObject({
    Account: unknownRecordSchema,
    Class: nullableUnknownRecordSchema,
    Refresh: v.union([v.boolean(), v.number(), v.string()]),
    User: unknownRecordSchema,
  }),
});
