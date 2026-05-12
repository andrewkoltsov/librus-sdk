import type { FetchLike } from "../models/common.js";
import type { BffMessagesResponse } from "../models/bff/messages.js";
import {
  resolveRequestTimeoutMs,
  wrapFetchWithTimeout,
} from "../requestTimeout.js";
import { bffMessagesResponseSchema } from "../validation/bff/messages.js";

import { getBffJson } from "./request.js";

export interface BffApiClientOptions {
  bffBaseUrl?: string;
  fetch?: FetchLike;
  requestTimeoutMs?: number;
}

export class BffApiClient {
  private readonly bffBaseUrl: string;
  private readonly fetchImpl: FetchLike;
  private readonly synergiaAccessToken: string;

  constructor(synergiaAccessToken: string, options: BffApiClientOptions = {}) {
    const requestTimeoutMs = resolveRequestTimeoutMs(options.requestTimeoutMs);

    this.bffBaseUrl = options.bffBaseUrl ?? "https://testbff.librus.pl/v1";
    this.fetchImpl = wrapFetchWithTimeout(
      options.fetch ?? fetch,
      requestTimeoutMs,
    );
    this.synergiaAccessToken = synergiaAccessToken;
  }

  listMessages(): Promise<BffMessagesResponse> {
    return getBffJson(
      this.fetchImpl,
      this.synergiaAccessToken,
      this.bffBaseUrl,
      "/Messages",
      bffMessagesResponseSchema,
    );
  }
}
