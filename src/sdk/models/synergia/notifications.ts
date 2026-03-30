import type { JsonObject } from "../common.js";

import type { SynergiaResponseEnvelope } from "./common.js";

export type LuckyNumber = JsonObject & {
  LuckyNumber?: string | number | null;
  LuckyNumberDay?: string | null;
};

export type NotificationCenter = JsonObject;

export type PushConfigurationSettings = JsonObject;

export interface LuckyNumberResponse extends SynergiaResponseEnvelope {
  LuckyNumber: LuckyNumber;
}

export interface NotificationCenterResponse extends SynergiaResponseEnvelope {
  NotificationCenter: NotificationCenter;
}

export interface PushConfigurationsResponse extends SynergiaResponseEnvelope {
  settings: PushConfigurationSettings;
  version: string | number;
}
