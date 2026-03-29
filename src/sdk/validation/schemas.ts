import * as v from "valibot";

const unknownRecordSchema = v.record(v.string(), v.unknown());
const nullableUnknownRecordSchema = v.union([unknownRecordSchema, v.null()]);
const apiRefSchema = v.looseObject({
  Id: v.union([v.string(), v.number()]),
  Url: v.string(),
});

const synergiaResponseEnvelopeSchema = v.looseObject({
  Resources: v.record(v.string(), v.unknown()),
  Url: v.string(),
});

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

export const synergiaMeResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  Me: v.looseObject({
    Account: unknownRecordSchema,
    Class: nullableUnknownRecordSchema,
    Refresh: v.union([v.boolean(), v.number(), v.string()]),
    User: unknownRecordSchema,
  }),
});

const gradeSchema = v.looseObject({
  AddDate: v.string(),
  AddedBy: apiRefSchema,
  Category: apiRefSchema,
  Date: v.string(),
  Grade: v.string(),
  Id: v.number(),
  IsConstituent: v.boolean(),
  IsFinal: v.boolean(),
  IsFinalProposition: v.boolean(),
  IsSemester: v.boolean(),
  IsSemesterProposition: v.boolean(),
  Lesson: apiRefSchema,
  Semester: v.number(),
  Student: apiRefSchema,
  Subject: apiRefSchema,
});

export const gradesResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  Grades: v.array(gradeSchema),
});

const attendanceSchema = v.looseObject({
  AddDate: v.string(),
  AddedBy: apiRefSchema,
  Date: v.string(),
  Id: v.union([v.string(), v.number()]),
  Lesson: apiRefSchema,
  LessonNo: v.number(),
  Semester: v.number(),
  Student: apiRefSchema,
  Trip: v.optional(apiRefSchema),
  Type: apiRefSchema,
});

export const attendancesResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  Attendances: v.array(attendanceSchema),
});

const apiRefOrJsonSchema = v.union([apiRefSchema, unknownRecordSchema]);

const homeWorkSchema = v.looseObject({
  AddDate: v.string(),
  Category: v.union([apiRefOrJsonSchema, v.null()]),
  Class: v.union([apiRefOrJsonSchema, v.null()]),
  Content: v.string(),
  CreatedBy: v.union([apiRefOrJsonSchema, v.null()]),
  Date: v.string(),
  Id: v.number(),
  LessonNo: v.union([v.string(), v.number(), v.null()]),
  Subject: v.union([apiRefOrJsonSchema, v.null()]),
  TimeFrom: v.union([v.string(), v.null()]),
  TimeTo: v.union([v.string(), v.null()]),
});

export const homeWorksResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  HomeWorks: v.array(homeWorkSchema),
});
