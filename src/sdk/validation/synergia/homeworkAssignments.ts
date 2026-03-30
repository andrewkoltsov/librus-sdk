import * as v from "valibot";

import {
  synergiaEntityListSchema,
  synergiaResponseEnvelopeSchema,
} from "./common.js";

export const homeworkAssignmentsResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  HomeWorkAssignments: synergiaEntityListSchema,
});
