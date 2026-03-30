import type { ApiRef, JsonObject } from "../common.js";

import type { SynergiaResponseEnvelope } from "./common.js";

type SynergiaId = string | number;

export type Note = JsonObject & {
  AddedBy?: ApiRef | null;
  Category?: ApiRef | null;
  Id: SynergiaId;
  Student?: ApiRef | null;
  Teacher?: ApiRef | null;
};

export type NoteCategory = JsonObject;

export interface NotesResponse extends SynergiaResponseEnvelope {
  Notes: Note[];
}

export interface NoteResponse extends SynergiaResponseEnvelope {
  Note: Note;
}

export interface NoteCategoriesResponse extends SynergiaResponseEnvelope {
  Categories: NoteCategory[];
}
