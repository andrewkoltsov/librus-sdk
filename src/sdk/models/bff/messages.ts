import type { JsonObject } from "../common.js";

export type BffMessage = JsonObject & {
  id: string | number;
  body?: string | null;
  sendDate?: string | null;
  senderColor?: number | null;
  senderId?: string | number | null;
  senderName?: string | null;
  senderSurname?: string | null;
  subject?: string | null;
};

export interface BffMessagesResponse {
  inboxMessages: BffMessage[];
}
