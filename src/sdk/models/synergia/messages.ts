import type { ApiRef, JsonObject } from "../common.js";

import type { SynergiaResponseEnvelope } from "./common.js";

type SynergiaId = string | number;

export interface ListMessagesOptions {
  afterId?: SynergiaId;
  alternativeBody?: boolean;
  changeNewLine?: boolean | number;
}

export type MessageParticipant = ApiRef;

export type Message = JsonObject & {
  Id: SynergiaId;
  Receiver?: MessageParticipant | MessageParticipant[] | null;
  Receivers?: MessageParticipant[] | null;
  Sender?: MessageParticipant | null;
};

export type MessageReceiverGroup = JsonObject;

export interface MessagesResponse extends SynergiaResponseEnvelope {
  Messages: Message[];
}

export interface MessageResponse extends SynergiaResponseEnvelope {
  Message: Message;
}

export interface UnreadMessagesResponse extends SynergiaResponseEnvelope {
  UnreadMessages: number;
}

export interface MessageReceiverGroupsResponse extends SynergiaResponseEnvelope {
  ReceiversGroup: MessageReceiverGroup[];
}

export interface MessageReceiverGroupResponse extends SynergiaResponseEnvelope {
  ReceiversGroup: MessageReceiverGroup | MessageReceiverGroup[] | null;
}
