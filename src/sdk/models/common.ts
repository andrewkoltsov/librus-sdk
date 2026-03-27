export type FetchLike = typeof fetch;

export interface ApiRef {
  Id: string | number;
  Url: string;
}

export type JsonObject = Record<string, unknown>;
