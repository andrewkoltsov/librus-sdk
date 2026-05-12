import * as v from "valibot";

const bffMessageSchema = v.looseObject({
  id: v.union([v.string(), v.number()]),
  body: v.exactOptional(v.union([v.string(), v.null()])),
  sendDate: v.exactOptional(v.union([v.string(), v.null()])),
  senderColor: v.exactOptional(v.union([v.number(), v.null()])),
  senderId: v.exactOptional(v.union([v.string(), v.number(), v.null()])),
  senderName: v.exactOptional(v.union([v.string(), v.null()])),
  senderSurname: v.exactOptional(v.union([v.string(), v.null()])),
  subject: v.exactOptional(v.union([v.string(), v.null()])),
});

export const bffMessagesResponseSchema = v.looseObject({
  inboxMessages: v.array(bffMessageSchema),
});
