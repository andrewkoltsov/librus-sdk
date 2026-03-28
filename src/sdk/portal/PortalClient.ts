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

export interface PortalClientOptions {
  fetch?: FetchLike;
  portalBaseUrl?: string;
  portalApiBaseUrl?: string;
  loginPath?: string;
  loginActionPath?: string;
}

export class PortalClient {
  private readonly fetchImpl: FetchLike;
  private readonly portalBaseUrl: string;
  private readonly portalApiBaseUrl: string;
  private readonly loginPath: string;
  private readonly loginActionPath: string;
  private loggedIn = false;

  constructor(options: PortalClientOptions = {}) {
    const sessionFetch = createSessionFetch(options.fetch ?? fetch);
    this.fetchImpl = sessionFetch.fetch;
    this.portalBaseUrl = options.portalBaseUrl ?? "https://portal.librus.pl";
    this.portalApiBaseUrl = options.portalApiBaseUrl ?? `${this.portalBaseUrl}/api/v3`;
    this.loginPath = options.loginPath ?? "/konto-librus/login";
    this.loginActionPath = options.loginActionPath ?? "/konto-librus/login/action";
  }

  async login(credentials: PortalCredentials): Promise<void> {
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

    const loginActionResponse = await this.fetchImpl(this.buildUrl(this.portalBaseUrl, this.loginActionPath), {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        referer: loginPageUrl,
      },
      body: form.toString(),
    });

    if (!loginActionResponse.ok) {
      throw new LibrusAuthenticationError();
    }

    try {
      await this.getMe();
      this.loggedIn = true;
    } catch (error) {
      if (error instanceof LibrusApiError && error.details?.status === 401) {
        throw new LibrusAuthenticationError();
      }

      throw error;
    }
  }

  async getMe(): Promise<PortalMe> {
    return this.getPortalJson<PortalMe>("/Me");
  }

  async getSynergiaAccounts(): Promise<SynergiaAccountsResponse> {
    const response = await this.getPortalJson<SynergiaAccountsResponse & { accounts?: ChildAccount[] }>("/SynergiaAccounts");

    return {
      ...response,
      accounts: (response.accounts ?? []).map((account) => ({
        ...account,
        ...(Array.isArray(account.scopes) ? { scopes: account.scopes } : {}),
      })),
    };
  }

  isLoggedIn(): boolean {
    return this.loggedIn;
  }

  private async getPortalJson<T>(path: string): Promise<T> {
    const endpoint = `${this.portalApiBaseUrl}${path}`;
    const response = await this.fetchImpl(endpoint, {
      method: "GET",
      headers: {
        accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new LibrusApiError(endpoint, response.status, "Portal API request failed");
    }

    return (await response.json()) as T;
  }

  private buildUrl(baseUrl: string, path: string): string {
    return new URL(path, baseUrl).toString();
  }
}
