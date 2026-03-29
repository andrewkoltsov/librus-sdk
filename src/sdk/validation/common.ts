import * as v from "valibot";

export const unknownRecordSchema = v.record(v.string(), v.unknown());

export const nullableUnknownRecordSchema = v.union([
  unknownRecordSchema,
  v.null(),
]);

export const apiRefSchema = v.looseObject({
  Id: v.union([v.string(), v.number()]),
  Url: v.string(),
});

export const apiRefOrJsonSchema = v.union([apiRefSchema, unknownRecordSchema]);
