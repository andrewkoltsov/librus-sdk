import type { JsonObject } from "../common.js";

import type { SynergiaResponseEnvelope } from "./common.js";

export interface SynergiaMe {
  Account: JsonObject;
  Class: JsonObject | null;
  Refresh: string | boolean | number;
  User: JsonObject;
}

export interface SynergiaMeResponse extends SynergiaResponseEnvelope {
  Me: SynergiaMe;
}
