import * as v from "valibot";

import { unknownRecordSchema } from "../common.js";
import { synergiaResponseEnvelopeSchema } from "./common.js";

const authPhotoSchema = v.looseObject({
  content: v.exactOptional(v.string()),
  fileName: v.exactOptional(v.string()),
  id: v.exactOptional(v.union([v.string(), v.number()])),
  Id: v.exactOptional(v.union([v.string(), v.number()])),
});

const authPhotoPayloadSchema = v.looseObject({
  awaitingPhoto: v.exactOptional(v.union([unknownRecordSchema, v.null()])),
  photo: v.exactOptional(v.union([authPhotoSchema, v.null()])),
  status: v.exactOptional(
    v.union([v.boolean(), v.string(), v.number(), v.null()]),
  ),
});

export const authPhotosResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  data: authPhotoPayloadSchema,
});

export const authPhotoResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  data: authPhotoPayloadSchema,
});

export const authUserInfoResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  AccountNumericIdentifier: v.exactOptional(v.union([v.string(), v.number()])),
  IdentifierOfClassOfStudentAssignedWithUser: v.exactOptional(
    v.union([v.string(), v.number(), v.null()]),
  ),
  IdentifierOfStudentAssignedWithUser: v.exactOptional(
    v.union([v.string(), v.number(), v.null()]),
  ),
  KindergartenGraduationYear: v.exactOptional(
    v.union([v.string(), v.number(), v.null()]),
  ),
  Login: v.exactOptional(v.string()),
  SchoolId: v.exactOptional(v.union([v.string(), v.number()])),
  UserIdentifier: v.exactOptional(v.string()),
  UserNumericIdentifier: v.exactOptional(v.union([v.string(), v.number()])),
  UserSchoolClassId: v.exactOptional(
    v.union([v.string(), v.number(), v.null()]),
  ),
  UserState: v.exactOptional(v.union([v.string(), v.number()])),
  UserType: v.exactOptional(v.union([v.string(), v.number()])),
});

export const authTokenInfoResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  IdentifierOfClassOfStudentAssignedWithUser: v.exactOptional(
    v.union([v.string(), v.number(), v.null()]),
  ),
  IdentifierOfStudentAssignedWithUser: v.exactOptional(
    v.union([v.string(), v.number(), v.null()]),
  ),
  SchoolId: v.exactOptional(v.union([v.string(), v.number()])),
  SchoolNodeName: v.exactOptional(v.string()),
  Scopes: v.exactOptional(v.array(v.unknown())),
  UserIdentifier: v.exactOptional(v.string()),
  UserType: v.exactOptional(v.union([v.string(), v.number()])),
});

export const authClassroomResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
});
