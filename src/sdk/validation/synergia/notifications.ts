import * as v from "valibot";

import { unknownRecordSchema } from "../common.js";
import { synergiaResponseEnvelopeSchema } from "./common.js";

const luckyNumberSchema = v.looseObject({
  LuckyNumber: v.exactOptional(v.union([v.string(), v.number(), v.null()])),
  LuckyNumberDay: v.exactOptional(v.union([v.string(), v.null()])),
});

export const luckyNumberResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  LuckyNumber: luckyNumberSchema,
});

export const notificationCenterResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  NotificationCenter: unknownRecordSchema,
});

export const pushConfigurationsResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  settings: unknownRecordSchema,
  version: v.union([v.string(), v.number()]),
});
