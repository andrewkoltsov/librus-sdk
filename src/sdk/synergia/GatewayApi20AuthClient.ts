import { createSessionFetch } from "../auth/sessionFetch.js";
import type { FetchLike } from "../models/common.js";
import {
  LibrusAuthenticationError,
  type GatewayCredentials,
  type SynergiaCredentials,
} from "../models/index.js";
import {
  resolveRequestTimeoutMs,
  wrapFetchWithTimeout,
} from "../requestTimeout.js";
import { emitDeprecationWarningOnce } from "../deprecationWarnings.js";
import { authTokenInfoResponseSchema } from "../validation/synergia/auth.js";
import { parseApiResponse } from "../validation/responseValidation.js";

import {
  SynergiaApiClient,
  type SynergiaApiClientOptions,
} from "./SynergiaApiClient.js";

export interface GatewayApi20AuthClientOptions {
  fetch?: FetchLike;
  authBaseUrl?: string;
  synergiaBaseUrl?: string;
  requestTimeoutMs?: number;
}

const AUTHORIZATION_PATH = "/OAuth/Authorization?client_id=46";
const AUTHORIZATION_PERFORM_LOGIN_PATH =
  "/OAuth/Authorization/PerformLogin?client_id=46";
const AUTHORIZATION_GRANT_PATH = "/OAuth/Authorization/Grant?client_id=46";
const PORTAL_RODZINA_PATH = "/loguj/portalRodzina";
const TOKEN_INFO_PATH = "/gateway/api/2.0/Auth/TokenInfo";

export class GatewayApi20AuthClient {
  private readonly cookieFetch: FetchLike;
  private readonly fetchImpl: FetchLike;
  private readonly authBaseUrl: string;
  private readonly synergiaBaseUrl: string;
  private readonly requestTimeoutMs: number;
  private loggedIn = false;

  constructor(options: GatewayApi20AuthClientOptions = {}) {
    const sessionFetch = createSessionFetch(options.fetch ?? fetch);

    this.cookieFetch = sessionFetch.fetch;
    this.requestTimeoutMs = resolveRequestTimeoutMs(options.requestTimeoutMs);
    this.fetchImpl = wrapFetchWithTimeout(
      this.cookieFetch,
      this.requestTimeoutMs,
    );
    this.authBaseUrl = options.authBaseUrl ?? "https://api.librus.pl";
    this.synergiaBaseUrl =
      options.synergiaBaseUrl ?? "https://synergia.librus.pl";
  }

  async login(
    credentials: GatewayCredentials | SynergiaCredentials,
  ): Promise<void> {
    if (this.loggedIn) {
      return;
    }

    const normalizedCredentials = normalizeGatewayCredentials(credentials);

    await this.initializePortalSession();
    await this.getAuthPage();
    await this.postCredentials(normalizedCredentials);
    await this.performLogin();
    await this.performLogin();
    await this.grantAuthorization();
    await this.verifyLogin();

    this.loggedIn = true;
  }

  createApiClient(
    options: Omit<SynergiaApiClientOptions, "authMode" | "fetch"> = {},
  ): SynergiaApiClient {
    return new SynergiaApiClient("", {
      ...options,
      apiBaseUrl:
        options.apiBaseUrl ?? `${this.synergiaBaseUrl}/gateway/api/2.0`,
      authMode: "cookie",
      fetch: this.cookieFetch,
      requestTimeoutMs: options.requestTimeoutMs ?? this.requestTimeoutMs,
    });
  }

  isLoggedIn(): boolean {
    return this.loggedIn;
  }

  private async initializePortalSession(): Promise<void> {
    const initUrl = this.buildSynergiaUrl(
      `${PORTAL_RODZINA_PATH}?v=${Date.now() / 1000}`,
    );
    const initResponse = await this.fetchImpl(initUrl, {
      method: "GET",
      redirect: "manual",
      headers: {
        Referer: "https://portal.librus.pl/",
      },
    });

    if (isRedirectResponse(initResponse)) {
      const location = initResponse.headers.get("location");

      if (!location) {
        throw new LibrusAuthenticationError(
          "Gateway API 2.0 authentication failed",
        );
      }

      const prepResponse = await this.fetchImpl(
        new URL(location, initUrl).toString(),
        {
          method: "GET",
          headers: {
            Referer: "https://portal.librus.pl/",
          },
        },
      );

      this.assertAuthResponse(prepResponse);
      return;
    }

    this.assertAuthResponse(initResponse);
  }

  private async getAuthPage(): Promise<void> {
    const response = await this.fetchImpl(
      this.buildAuthUrl(AUTHORIZATION_PATH),
      {
        method: "GET",
      },
    );

    this.assertAuthResponse(response);
  }

  private async postCredentials(
    credentials: GatewayCredentials,
  ): Promise<void> {
    const form = new FormData();
    form.append("action", "login");
    form.append("login", credentials.login);
    form.append("pass", credentials.password);

    const response = await this.fetchImpl(
      this.buildAuthUrl(AUTHORIZATION_PATH),
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
          "X-Baner": createBanerHeader(),
          Referer: this.buildAuthUrl(AUTHORIZATION_PATH),
        },
        body: form,
      },
    );

    this.assertAuthResponse(response);
  }

  private async performLogin(): Promise<void> {
    const response = await this.fetchImpl(
      this.buildAuthUrl(AUTHORIZATION_PERFORM_LOGIN_PATH),
      {
        method: "GET",
      },
    );

    this.assertAuthResponse(response);
  }

  private async grantAuthorization(): Promise<void> {
    const response = await this.fetchImpl(
      this.buildAuthUrl(AUTHORIZATION_GRANT_PATH),
      {
        method: "GET",
      },
    );

    this.assertAuthResponse(response);
  }

  private async verifyLogin(): Promise<void> {
    const endpoint = this.buildSynergiaUrl(TOKEN_INFO_PATH);
    const response = await this.fetchImpl(endpoint, {
      method: "GET",
      headers: {
        accept: "application/json",
      },
    });

    this.assertAuthResponse(response);

    parseApiResponse(
      authTokenInfoResponseSchema,
      await response.json(),
      endpoint,
    );
  }

  private buildAuthUrl(path: string): string {
    return new URL(path, this.authBaseUrl).toString();
  }

  private buildSynergiaUrl(path: string): string {
    return new URL(path, this.synergiaBaseUrl).toString();
  }

  private assertAuthResponse(response: Response): void {
    if (!response.ok) {
      throw new LibrusAuthenticationError(
        "Gateway API 2.0 authentication failed",
      );
    }
  }
}

function normalizeGatewayCredentials(
  credentials: GatewayCredentials | SynergiaCredentials,
): GatewayCredentials {
  if ("login" in credentials) {
    return credentials;
  }

  emitDeprecationWarningOnce(
    "LIBRUS_SYNERGIA_CREDENTIALS_ID_DEPRECATED",
    'Gateway credentials with an "id" field are deprecated; use "login" instead.',
  );

  return {
    login: credentials.id,
    password: credentials.password,
  };
}

function isRedirectResponse(response: Response): boolean {
  return response.status >= 300 && response.status < 400;
}

function createBanerHeader(): string {
  const timestampPart = encodeBanerSegment(Date.now().toString());
  const randomPart = encodeBanerSegment(Math.random().toString());

  return `${randomPart}_${timestampPart}`;
}

function encodeBanerSegment(value: string): string {
  return value
    .split("")
    .map((letter) => String.fromCharCode(letter.charCodeAt(0) + 20))
    .join("");
}
