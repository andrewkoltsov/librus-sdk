import * as v from "valibot";

import { unknownRecordSchema } from "./common.js";

export const portalMeSchema = v.looseObject({
  email: v.string(),
  identifier: v.number(),
  subscription: v.optional(unknownRecordSchema),
});

const childAccountSchema = v.looseObject({
  accessToken: v.string(),
  accountIdentifier: v.string(),
  group: v.string(),
  id: v.number(),
  login: v.string(),
  scopes: v.optional(v.union([v.array(v.string()), v.literal("")])),
  state: v.string(),
  studentName: v.string(),
});

export const synergiaAccountsResponseSchema = v.looseObject({
  accounts: v.array(childAccountSchema),
  lastModification: v.number(),
});
