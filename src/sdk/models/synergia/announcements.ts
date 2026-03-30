import type { ApiRef, JsonObject } from "../common.js";

import type { SynergiaResponseEnvelope } from "./common.js";

type SynergiaId = string | number;

export type SchoolNotice = JsonObject & {
  AddedBy?: ApiRef | null;
  EndDate?: string | null;
  Id: SynergiaId;
  StartDate?: string | null;
};

export interface SchoolNoticesResponse extends SynergiaResponseEnvelope {
  SchoolNotices: SchoolNotice[];
}

export interface SchoolNoticeResponse extends SynergiaResponseEnvelope {
  SchoolNotice: SchoolNotice;
}
