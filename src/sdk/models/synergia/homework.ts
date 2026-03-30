import type { ApiRef, JsonObject } from "../common.js";

import type { SynergiaResponseEnvelope } from "./common.js";

export interface HomeWork {
  AddDate: string;
  Category: JsonObject | ApiRef | null;
  Class: JsonObject | ApiRef | null;
  Content: string;
  CreatedBy: JsonObject | ApiRef | null;
  Date: string;
  Id: number;
  LessonNo: string | number | null;
  Subject?: JsonObject | ApiRef | null;
  TimeFrom: string | null;
  TimeTo: string | null;
}

export interface HomeWorksResponse extends SynergiaResponseEnvelope {
  HomeWorks: HomeWork[];
}
