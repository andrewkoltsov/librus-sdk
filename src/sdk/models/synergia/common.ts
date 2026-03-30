export interface SynergiaResponseEnvelope {
  Resources: Record<string, unknown>;
  Url: string;
}

export interface SynergiaBinaryResult {
  data: ArrayBuffer;
  contentType: string | null;
  contentDisposition: string | null;
}
