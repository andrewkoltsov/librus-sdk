import * as v from "valibot";

import { apiRefOrJsonSchema } from "../common.js";
import { synergiaResponseEnvelopeSchema } from "./common.js";

const homeWorkSchema = v.looseObject({
  AddDate: v.string(),
  Category: v.union([apiRefOrJsonSchema, v.null()]),
  Class: v.union([apiRefOrJsonSchema, v.null()]),
  Content: v.string(),
  CreatedBy: v.union([apiRefOrJsonSchema, v.null()]),
  Date: v.string(),
  Id: v.number(),
  LessonNo: v.union([v.string(), v.number(), v.null()]),
  Subject: v.exactOptional(v.union([apiRefOrJsonSchema, v.null()])),
  TimeFrom: v.union([v.string(), v.null()]),
  TimeTo: v.union([v.string(), v.null()]),
});

export const homeWorksResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  HomeWorks: v.array(homeWorkSchema),
});
