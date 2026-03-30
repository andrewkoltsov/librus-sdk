import * as v from "valibot";

import { apiRefSchema } from "../common.js";
import {
  synergiaEntityListSchema,
  synergiaEntitySchema,
  synergiaResponseEnvelopeSchema,
} from "./common.js";

const messageParticipantSchema = apiRefSchema;

const messageSchema = v.looseObject({
  Id: v.union([v.string(), v.number()]),
  Receiver: v.exactOptional(
    v.union([
      messageParticipantSchema,
      v.array(messageParticipantSchema),
      v.null(),
    ]),
  ),
  Receivers: v.exactOptional(
    v.union([v.array(messageParticipantSchema), v.null()]),
  ),
  Sender: v.exactOptional(v.union([messageParticipantSchema, v.null()])),
});

export const messagesResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  Messages: v.array(messageSchema),
});

export const messageResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  Message: messageSchema,
});

export const unreadMessagesResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  UnreadMessages: v.number(),
});

export const messageReceiverGroupsResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  ReceiversGroup: synergiaEntityListSchema,
});

export const messageReceiverGroupResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  ReceiversGroup: v.union([
    synergiaEntityListSchema,
    synergiaEntitySchema,
    v.null(),
  ]),
});
