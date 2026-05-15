import { Buffer } from "node:buffer";

import { createSessionFetch } from "../auth/sessionFetch.js";
import type { FetchLike, JsonObject } from "../models/common.js";
import { LibrusApiError } from "../models/errors.js";
import type { ChildAccount } from "../models/portal.js";
import type {
  ListMessagesOptions,
  Message,
  MessageReadBackend,
  MessageResponse,
  MessagesResponse,
  SynergiaId,
  UnreadMessagesResponse,
} from "../models/synergia/messages.js";
import { PortalClient } from "../portal/PortalClient.js";
import {
  resolveRequestTimeoutMs,
  wrapFetchWithTimeout,
} from "../requestTimeout.js";
import { parseApiResponse } from "../validation/responseValidation.js";
import {
  messageResponseSchema,
  messagesResponseSchema,
  unreadMessagesResponseSchema,
} from "../validation/synergia/messages.js";

const LIBRUS_MOBILE_USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 LibrusMobileApp";
const SYNERGIA_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Gecko/20100101 Firefox/62.0";
const DEFAULT_API_BASE_URL = "https://api.librus.pl/2.0";
const DEFAULT_SYNERGIA_BASE_URL = "https://synergia.librus.pl";
const DEFAULT_WIADOMOSCI_BASE_URL = "https://wiadomosci.librus.pl";

interface AutoLoginTokenResponse {
  Token?: unknown;
}

interface WiadomosciListResponse {
  data?: unknown;
}

interface WiadomosciDetailResponse {
  data?: unknown;
}

interface WiadomosciUnreadResponse {
  data?: unknown;
}

export interface WiadomosciMessagesClientOptions {
  apiBaseUrl?: string;
  ensurePortalLogin?: () => Promise<void>;
  fetch?: FetchLike;
  portalClient: PortalClient;
  requestTimeoutMs?: number;
  synergiaBaseUrl?: string;
  wiadomosciBaseUrl?: string;
}

export class WiadomosciMessagesClient implements MessageReadBackend {
  private authenticated = false;
  private readonly apiBaseUrl: string;
  private readonly childLogin: string;
  private readonly ensurePortalLogin: () => Promise<void>;
  private readonly fetchImpl: FetchLike;
  private readonly portalClient: PortalClient;
  private readonly synergiaBaseUrl: string;
  private readonly wiadomosciBaseUrl: string;

  constructor(child: ChildAccount, options: WiadomosciMessagesClientOptions) {
    const requestTimeoutMs = resolveRequestTimeoutMs(options.requestTimeoutMs);
    const sessionFetch = createSessionFetch(options.fetch ?? fetch);

    this.apiBaseUrl = options.apiBaseUrl ?? DEFAULT_API_BASE_URL;
    this.childLogin = child.login;
    this.ensurePortalLogin = options.ensurePortalLogin ?? (async () => {});
    this.fetchImpl = wrapFetchWithTimeout(sessionFetch.fetch, requestTimeoutMs);
    this.portalClient = options.portalClient;
    this.synergiaBaseUrl = options.synergiaBaseUrl ?? DEFAULT_SYNERGIA_BASE_URL;
    this.wiadomosciBaseUrl =
      options.wiadomosciBaseUrl ?? DEFAULT_WIADOMOSCI_BASE_URL;
  }

  async listMessages(
    options: ListMessagesOptions = {},
  ): Promise<MessagesResponse> {
    const { page = 1, limit = 300, afterId } = options;
    const endpoint = this.buildWiadomosciEndpoint("/api/inbox/messages", {
      page,
      limit,
      afterId,
    });
    const response =
      await this.getWiadomosciJson<WiadomosciListResponse>(endpoint);
    const payload = {
      Messages: Array.isArray(response.data)
        ? response.data.map((item) =>
            normalizeMessage(item, this.wiadomosciBaseUrl),
          )
        : [],
      Resources: {},
      Url: endpoint,
    };

    return parseApiResponse(messagesResponseSchema, payload, endpoint);
  }

  async getMessage(id: SynergiaId): Promise<MessageResponse> {
    const endpoint = this.buildWiadomosciEndpoint(
      `/api/inbox/messages/${encodeURIComponent(String(id))}`,
    );
    const response =
      await this.getWiadomosciJson<WiadomosciDetailResponse>(endpoint);
    const payload = {
      Message: normalizeMessage(response.data, this.wiadomosciBaseUrl),
      Resources: {},
      Url: endpoint,
    };

    return parseApiResponse(messageResponseSchema, payload, endpoint);
  }

  async getUnreadMessages(): Promise<UnreadMessagesResponse> {
    const endpoint = this.buildWiadomosciEndpoint(
      "/api/inbox/unreadMessagesCount",
    );
    const response =
      await this.getWiadomosciJson<WiadomosciUnreadResponse>(endpoint);
    const payload = {
      UnreadMessages: normalizeUnreadCount(response.data),
      Resources: {},
      Url: endpoint,
    };

    return parseApiResponse(unreadMessagesResponseSchema, payload, endpoint);
  }

  private async authenticate(): Promise<void> {
    await this.ensurePortalLogin();

    const account = await this.portalClient.getFreshSynergiaAccount(
      this.childLogin,
    );
    const token = await this.getAutoLoginToken(account.accessToken);

    await this.getHtml(
      this.buildSynergiaEndpoint(
        `/loguj/token/${encodeURIComponent(token)}/przenies/uczen/widok/centrum_powiadomien`,
      ),
      LIBRUS_MOBILE_USER_AGENT,
      "Wiadomosci Synergia login failed",
      this.buildSynergiaEndpoint(
        "/loguj/token/REDACTED/przenies/uczen/widok/centrum_powiadomien",
      ),
    );
    await this.getHtml(
      this.buildSynergiaEndpoint("/wiadomosci3"),
      SYNERGIA_USER_AGENT,
      "Wiadomosci activation failed",
    );

    this.authenticated = true;
  }

  private async getAutoLoginToken(accessToken: string): Promise<string> {
    const endpoint = this.buildApiEndpoint("/AutoLoginToken");
    const response = await this.fetchImpl(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${accessToken}`,
        "user-agent": LIBRUS_MOBILE_USER_AGENT,
      },
    });

    if (!response.ok) {
      await consumeResponse(response);
      throw new LibrusApiError(
        endpoint,
        response.status,
        "Wiadomosci authentication failed",
      );
    }

    const payload = (await response.json()) as AutoLoginTokenResponse;

    if (typeof payload.Token !== "string" || payload.Token.length === 0) {
      throw new LibrusApiError(
        endpoint,
        200,
        "Wiadomosci authentication response was invalid",
      );
    }

    return payload.Token;
  }

  private async getHtml(
    endpoint: string,
    userAgent: string,
    failureMessage: string,
    errorEndpoint = endpoint,
  ): Promise<void> {
    const response = await this.fetchImpl(endpoint, {
      method: "GET",
      headers: {
        "user-agent": userAgent,
      },
    });

    if (!response.ok) {
      await consumeResponse(response);
      throw new LibrusApiError(errorEndpoint, response.status, failureMessage);
    }

    await consumeResponse(response);
  }

  private async getWiadomosciJson<T>(endpoint: string): Promise<T> {
    return this.getWiadomosciJsonWithRetry(endpoint, true);
  }

  private async getWiadomosciJsonWithRetry<T>(
    endpoint: string,
    retryAfterUnauthorized: boolean,
  ): Promise<T> {
    if (!this.authenticated) {
      await this.authenticate();
    }

    const response = await this.fetchImpl(endpoint, {
      method: "GET",
      headers: {
        accept: "application/json",
        "user-agent": SYNERGIA_USER_AGENT,
      },
    });

    if (response.status === 401 && retryAfterUnauthorized) {
      await consumeResponse(response);
      this.authenticated = false;
      return this.getWiadomosciJsonWithRetry(endpoint, false);
    }

    if (!response.ok) {
      await consumeResponse(response);
      throw new LibrusApiError(
        endpoint,
        response.status,
        "Wiadomosci API request failed",
      );
    }

    return (await response.json()) as T;
  }

  private buildApiEndpoint(path: string): string {
    return buildEndpoint(this.apiBaseUrl, path);
  }

  private buildSynergiaEndpoint(path: string): string {
    return buildEndpoint(this.synergiaBaseUrl, path);
  }

  private buildWiadomosciEndpoint(
    path: string,
    query: Record<string, unknown> = {},
  ): string {
    const endpoint = new URL(buildEndpoint(this.wiadomosciBaseUrl, path));

    for (const [key, value] of Object.entries(query)) {
      if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
      ) {
        endpoint.searchParams.set(key, String(value));
      }
    }

    return endpoint.toString();
  }
}

function buildEndpoint(baseUrl: string, path: string): string {
  return new URL(
    path.replace(/^\/+/, ""),
    ensureTrailingSlash(baseUrl),
  ).toString();
}

function ensureTrailingSlash(url: string): string {
  return url.endsWith("/") ? url : `${url}/`;
}

function normalizeMessage(value: unknown, wiadomosciBaseUrl: string): Message {
  const raw = isJsonObject(value) ? value : {};
  const id = raw.messageId ?? raw.Id;
  const senderId = raw.senderId;
  const receiverId = getReceiverId(raw);
  const normalized: JsonObject = {
    ...raw,
    Id: typeof id === "string" || typeof id === "number" ? id : "",
    Body: normalizeMessageBody(raw),
    ReadDate: normalizeDate(raw.readDate ?? raw.ReadDate),
    SendDate: normalizeDate(raw.sendDate ?? raw.SendDate),
    Subject: raw.topic ?? raw.Subject,
  };

  if (typeof senderId === "string" || typeof senderId === "number") {
    normalized.Sender = {
      Id: senderId,
      Url: buildEndpoint(wiadomosciBaseUrl, `/api/users/${senderId}`),
    };
  }

  if (typeof receiverId === "string" || typeof receiverId === "number") {
    normalized.Receiver = {
      Id: receiverId,
      Url: buildEndpoint(wiadomosciBaseUrl, `/api/users/${receiverId}`),
    };
  }

  return normalized as Message;
}

function getReceiverId(raw: JsonObject): unknown {
  const receiver = raw.receiver;

  return isJsonObject(receiver) ? receiver.id : raw.receiverId;
}

function normalizeMessageBody(raw: JsonObject): unknown {
  if (typeof raw.Message === "string") {
    return decodeMessageXml(raw.Message) ?? raw.Message;
  }

  return raw.content ?? raw.Body;
}

function decodeMessageXml(value: string): string | null {
  let decoded: string;

  try {
    decoded = Buffer.from(value, "base64").toString("utf8");
  } catch {
    return null;
  }

  if (!decoded.includes("<Message")) {
    return null;
  }

  const content = /<Content><!\[CDATA\[([\s\S]*?)\]\]><\/Content>/.exec(
    decoded,
  );

  return content?.[1] ?? decoded;
}

function normalizeDate(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  const isoLikeValue = value.includes("T") ? value : value.replace(" ", "T");
  const timestamp = Date.parse(isoLikeValue);

  return Number.isNaN(timestamp) ? value : timestamp;
}

function normalizeUnreadCount(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && /^\d+$/.test(value)) {
    return Number(value);
  }

  return 0;
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function consumeResponse(response: Response): Promise<void> {
  await response.arrayBuffer();
}
