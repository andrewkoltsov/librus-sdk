import * as v from "valibot";

import { unknownRecordSchema } from "../common.js";

export const synergiaResponseEnvelopeSchema = v.looseObject({
  Resources: unknownRecordSchema,
  Url: v.string(),
});
