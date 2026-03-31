import type { ApiRef, JsonObject } from "../common.js";

import type { SynergiaResponseEnvelope } from "./common.js";

type SynergiaId = string | number;

export interface ListJustificationsOptions {
  dateFrom?: string;
}

export type Justification = JsonObject & {
  Id: SynergiaId;
  AddedBy?: ApiRef | JsonObject | null;
  Student?: ApiRef | JsonObject | null;
};

export type ParentTeacherConference = JsonObject;

export interface JustificationsResponse extends SynergiaResponseEnvelope {
  Justifications: Justification[];
}

export interface JustificationResponse extends SynergiaResponseEnvelope {
  Justification: Justification;
}

export interface ParentTeacherConferencesResponse extends SynergiaResponseEnvelope {
  ParentTeacherConferences: ParentTeacherConference[];
}

export interface SystemDataResponse extends SynergiaResponseEnvelope {
  Date: string;
  Time: string;
}
