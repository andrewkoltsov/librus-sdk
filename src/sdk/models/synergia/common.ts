export interface SynergiaResponseEnvelope {
  Resources: Record<string, unknown>;
  Url: string;
}

export interface SynergiaStatusResponse extends SynergiaResponseEnvelope {
  Status: string;
  Code?: string | undefined;
  Message?: string | undefined;
  MessagePL?: string | undefined;
}

export interface SynergiaBinaryResult {
  data: ArrayBuffer;
  contentType: string | null;
  contentDisposition: string | null;
}
