import { extractPortalCsrfToken } from "../auth/csrf.js";
import { createSessionFetch } from "../auth/sessionFetch.js";
import type { FetchLike } from "../models/common.js";
import {
  LibrusApiError,
  LibrusAuthenticationError,
  type ChildAccount,
  type PortalCredentials,
  type PortalMe,
  type SynergiaAccountsResponse,
} from "../models/index.js";
import {
  resolveRequestTimeoutMs,
  wrapFetchWithTimeout,
} from "../requestTimeout.js";
import { getErrorLogFields, noopLogger, type Logger } from "../logger.js";
import type { BaseIssue, BaseSchema, InferOutput } from "valibot";
import {
  portalMeSchema,
  childAccountSchema,
  synergiaAccountsResponseSchema,
} from "../validation/portal.js";
import { parseApiResponse } from "../validation/responseValidation.js";

export interface PortalClientOptions {
  fetch?: FetchLike;
  portalBaseUrl?: string;
  portalApiBaseUrl?: string;
  loginPath?: string;
  loginActionPath?: string;
  requestTimeoutMs?: number;
  logger?: Logger;
}

export class PortalClient {
  private readonly fetchImpl: FetchLike;
  private readonly portalBaseUrl: string;
  private readonly portalApiBaseUrl: string;
  private readonly loginPath: string;
  private readonly loginActionPath: string;
  private readonly requestTimeoutMs: number;
  private readonly logger: Logger;
  private loggedIn = false;

  constructor(options: PortalClientOptions = {}) {
    this.logger = options.logger ?? noopLogger;
    this.requestTimeoutMs = resolveRequestTimeoutMs(options.requestTimeoutMs);
    const sessionFetch = createSessionFetch(options.fetch ?? fetch);
    this.fetchImpl = wrapFetchWithTimeout(
      sessionFetch.fetch,
      this.requestTimeoutMs,
    );
    this.portalBaseUrl = options.portalBaseUrl ?? "https://portal.librus.pl";
    this.portalApiBaseUrl =
      options.portalApiBaseUrl ?? `${this.portalBaseUrl}/api/v3`;
    this.loginPath = options.loginPath ?? "/konto-librus/login";
    this.loginActionPath =
      options.loginActionPath ?? "/konto-librus/login/action";
  }

  async login(credentials: PortalCredentials): Promise<void> {
    const startedAt = Date.now();

    this.logger.log("debug", "portal.login.start", {
      portalBaseUrl: this.portalBaseUrl,
    });

    try {
      const loginPageUrl = this.buildUrl(this.portalBaseUrl, this.loginPath);
      const loginPageResponse = await this.fetchImpl(loginPageUrl, {
        method: "GET",
      });

      if (!loginPageResponse.ok) {
        throw new LibrusAuthenticationError();
      }

      const loginPageHtml = await loginPageResponse.text();
      const csrfToken = extractPortalCsrfToken(loginPageHtml);
      const form = new URLSearchParams({
        email: credentials.email,
        password: credentials.password,
        _token: csrfToken,
      });

      const loginActionResponse = await this.fetchImpl(
        this.buildUrl(this.portalBaseUrl, this.loginActionPath),
        {
          method: "POST",
          headers: {
            "content-type": "application/x-www-form-urlencoded",
            referer: loginPageUrl,
          },
          body: form.toString(),
        },
      );

      if (!loginActionResponse.ok) {
        throw new LibrusAuthenticationError();
      }

      await this.getMe();
      this.loggedIn = true;
      this.logger.log("info", "portal.login.success", {
        durationMs: Date.now() - startedAt,
      });
    } catch (error) {
      const authError =
        error instanceof LibrusApiError && error.details?.status === 401
          ? new LibrusAuthenticationError()
          : error;

      this.logger.log("error", "portal.login.failure", {
        durationMs: Date.now() - startedAt,
        ...getErrorLogFields(authError),
      });

      if (authError instanceof Error) {
        throw authError;
      }

      throw authError;
    }
  }

  async getMe(): Promise<PortalMe> {
    const response = await this.getPortalJson("/Me", portalMeSchema);
    const { subscription, ...rest } = response;

    return subscription === undefined ? rest : { ...rest, subscription };
  }

  async getSynergiaAccounts(): Promise<SynergiaAccountsResponse> {
    const response = await this.getPortalJson(
      "/SynergiaAccounts",
      synergiaAccountsResponseSchema,
    );

    return {
      ...response,
      accounts: response.accounts.map((account) => {
        const { scopes, ...accountWithoutScopes } = account;

        return Array.isArray(scopes)
          ? { ...accountWithoutScopes, scopes }
          : accountWithoutScopes;
      }),
    };
  }

  async getFreshSynergiaAccount(login: string): Promise<ChildAccount> {
    return normalizeChildAccount(
      await this.getPortalJson(
        `/SynergiaAccounts/fresh/${encodeURIComponent(login)}`,
        childAccountSchema,
      ),
    );
  }

  isLoggedIn(): boolean {
    return this.loggedIn;
  }

  private async getPortalJson<
    TSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
  >(path: string, schema: TSchema): Promise<InferOutput<TSchema>> {
    const endpoint = `${this.portalApiBaseUrl}${path}`;
    const response = await this.fetchImpl(endpoint, {
      method: "GET",
      headers: {
        accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new LibrusApiError(
        endpoint,
        response.status,
        "Portal API request failed",
      );
    }

    return parseApiResponse(schema, await response.json(), endpoint);
  }

  private buildUrl(baseUrl: string, path: string): string {
    return new URL(path, baseUrl).toString();
  }
}

interface RawChildAccount extends Omit<ChildAccount, "scopes"> {
  scopes?: string[] | "" | undefined;
}

function normalizeChildAccount(account: RawChildAccount): ChildAccount {
  const { scopes, ...accountWithoutScopes } = account;

  return Array.isArray(scopes)
    ? { ...accountWithoutScopes, scopes }
    : accountWithoutScopes;
}
