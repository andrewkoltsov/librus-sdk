import { BffApiClient, type BffApiClientOptions } from "./bff/BffApiClient.js";
import {
  PortalClient,
  type PortalClientOptions,
} from "./portal/PortalClient.js";
import {
  GatewayApi20AuthClient,
  type GatewayApi20AuthClientOptions,
} from "./synergia/GatewayApi20AuthClient.js";
import {
  SynergiaApiClient,
  type SynergiaApiClientOptions,
} from "./synergia/SynergiaApiClient.js";
import {
  WiadomosciMessagesClient,
  type WiadomosciMessagesClientOptions,
} from "./wiadomosci/WiadomosciMessagesClient.js";
import {
  LibrusApiError,
  LibrusConfigurationError,
  LibrusSdkError,
  type ChildAccount,
  type GatewayCredentials,
  type PortalCredentials,
  type PortalMe,
  type SynergiaAccountsResponse,
  type SynergiaCredentials,
} from "./models/index.js";
import {
  parseRequestTimeoutMsFromEnv,
  validateOptionalRequestTimeoutMs,
} from "./requestTimeout.js";
import { emitDeprecationWarningOnce } from "./deprecationWarnings.js";
import type { Logger } from "./logger.js";

type PortalCredentialEnvName =
  | "LIBRUS_EMAIL"
  | "LIBRUS_PASSWORD"
  | "LIBRUS_PORTAL_EMAIL"
  | "LIBRUS_PORTAL_PASSWORD";
type GatewayCredentialEnvName =
  | "LIBRUS_GATEWAY_LOGIN"
  | "LIBRUS_GATEWAY_PASSWORD"
  | "SYNERGIA_ID"
  | "SYNERGIA_PASSWORD";
type ApiBackendEnvValue = "api_v3" | "gateway_api_20";
type AuthModeEnvValue = "portal" | "synergia";

export type LibrusApiBackend = ApiBackendEnvValue;
export type LibrusAuthMode = AuthModeEnvValue;

interface PortalCredentialEnvField {
  label: string;
  primary: PortalCredentialEnvName;
  fallback: PortalCredentialEnvName;
}

interface GatewayCredentialEnvField {
  label: string;
  primary: GatewayCredentialEnvName;
  alias: GatewayCredentialEnvName;
}

const PORTAL_EMAIL_ENV: PortalCredentialEnvField = {
  label: "Email",
  primary: "LIBRUS_PORTAL_EMAIL",
  fallback: "LIBRUS_EMAIL",
};

const PORTAL_PASSWORD_ENV: PortalCredentialEnvField = {
  label: "Password",
  primary: "LIBRUS_PORTAL_PASSWORD",
  fallback: "LIBRUS_PASSWORD",
};

const GATEWAY_LOGIN_ENV: GatewayCredentialEnvField = {
  label: "Login",
  primary: "LIBRUS_GATEWAY_LOGIN",
  alias: "SYNERGIA_ID",
};

const GATEWAY_PASSWORD_ENV: GatewayCredentialEnvField = {
  label: "Password",
  primary: "LIBRUS_GATEWAY_PASSWORD",
  alias: "SYNERGIA_PASSWORD",
};

export interface LibrusSessionOptions {
  credentials: PortalCredentials | GatewayCredentials | SynergiaCredentials;
  apiBackend?: LibrusApiBackend;
  /** @deprecated Use apiBackend instead. */
  authMode?: LibrusAuthMode;
  portalClient?: PortalClient;
  portalClientOptions?: PortalClientOptions;
  gatewayApi20AuthClient?: GatewayApi20AuthClient;
  gatewayApi20AuthClientOptions?: GatewayApi20AuthClientOptions;
  /** @deprecated Use gatewayApi20AuthClient instead. */
  directSynergiaAuthClient?: GatewayApi20AuthClient;
  /** @deprecated Use gatewayApi20AuthClientOptions instead. */
  directSynergiaAuthClientOptions?: GatewayApi20AuthClientOptions;
  bffClientOptions?: BffApiClientOptions;
  synergiaClientOptions?: SynergiaApiClientOptions;
  wiadomosciClientOptions?: Omit<
    WiadomosciMessagesClientOptions,
    "ensurePortalLogin" | "portalClient"
  >;
  requestTimeoutMs?: number;
  logger?: Logger;
}

export class LibrusSession {
  private readonly apiBackend: LibrusApiBackend;
  private readonly portalCredentials: PortalCredentials | undefined;
  private readonly gatewayCredentials: GatewayCredentials | undefined;
  private readonly portalClient: PortalClient | undefined;
  private readonly gatewayApi20AuthClient: GatewayApi20AuthClient | undefined;
  private readonly bffClientOptions: BffApiClientOptions | undefined;
  private readonly synergiaClientOptions: SynergiaApiClientOptions | undefined;
  private readonly wiadomosciClientOptions:
    | Omit<
        WiadomosciMessagesClientOptions,
        "ensurePortalLogin" | "portalClient"
      >
    | undefined;
  private accountsCache?: SynergiaAccountsResponse;
  /**
   * Latest known bearer token per child id (keyed by `String(id)`). Updated
   * after every successful portal refresh so that:
   *   - `forChild(childObject)` always starts with the freshest token even when
   *     the caller holds a stale `ChildAccount` reference.
   *   - A delayed `401` (one that fires after an in-flight refresh has already
   *     cleared `refreshInFlight`) can detect the superseded token and return
   *     the already-refreshed value without a second portal round-trip.
   */
  private readonly latestTokenPerChild = new Map<string, string>();
  /**
   * In-flight bearer-token refreshes keyed by child id. Collapses concurrent
   * refreshes for the same child to a single portal round-trip (stampede
   * protection) while the refresh is pending.
   */
  private readonly refreshInFlight = new Map<string, Promise<string>>();

  constructor(options: LibrusSessionOptions) {
    if (options.authMode !== undefined) {
      emitDeprecationWarningOnce(
        "LIBRUS_AUTH_MODE_OPTION_DEPRECATED",
        "LibrusSessionOptions.authMode is deprecated; use apiBackend instead.",
      );
    }

    if (options.directSynergiaAuthClient !== undefined) {
      emitDeprecationWarningOnce(
        "LIBRUS_DIRECT_SYNERGIA_AUTH_CLIENT_DEPRECATED",
        "LibrusSessionOptions.directSynergiaAuthClient is deprecated; use gatewayApi20AuthClient instead.",
      );
    }

    if (options.directSynergiaAuthClientOptions !== undefined) {
      emitDeprecationWarningOnce(
        "LIBRUS_DIRECT_SYNERGIA_AUTH_CLIENT_OPTIONS_DEPRECATED",
        "LibrusSessionOptions.directSynergiaAuthClientOptions is deprecated; use gatewayApi20AuthClientOptions instead.",
      );
    }

    this.apiBackend =
      options.apiBackend ??
      mapAuthModeToApiBackend(options.authMode) ??
      "api_v3";
    const requestTimeoutMs = validateOptionalRequestTimeoutMs(
      options.requestTimeoutMs,
    );
    const portalClientOptions = applyRequestTimeout(
      options.portalClientOptions,
      requestTimeoutMs,
    );
    const loggedPortalClientOptions = applyLogger(
      portalClientOptions,
      options.logger,
    );
    const synergiaClientOptions = applyLogger(
      applyRequestTimeout(options.synergiaClientOptions, requestTimeoutMs),
      options.logger,
    );
    const bffClientOptions = applyRequestTimeout(
      options.bffClientOptions,
      requestTimeoutMs,
    );
    const wiadomosciClientOptions = applyRequestTimeout(
      options.wiadomosciClientOptions,
      requestTimeoutMs,
    );
    const gatewayApi20AuthClientOptions = applyRequestTimeout(
      options.gatewayApi20AuthClientOptions ??
        options.directSynergiaAuthClientOptions,
      requestTimeoutMs,
    );

    if (this.apiBackend === "api_v3") {
      this.portalCredentials = normalizePortalCredentials(options.credentials);
      this.portalClient =
        options.portalClient ?? new PortalClient(loggedPortalClientOptions);
    } else {
      this.gatewayCredentials = normalizeGatewayCredentials(
        options.credentials,
      );
      this.gatewayApi20AuthClient =
        options.gatewayApi20AuthClient ??
        options.directSynergiaAuthClient ??
        new GatewayApi20AuthClient(gatewayApi20AuthClientOptions);
    }

    this.bffClientOptions = bffClientOptions;
    this.synergiaClientOptions = synergiaClientOptions;
    this.wiadomosciClientOptions = wiadomosciClientOptions;
  }

  static fromEnv(
    env: NodeJS.ProcessEnv = process.env,
    options: Omit<
      LibrusSessionOptions,
      "apiBackend" | "authMode" | "credentials"
    > = {},
  ): LibrusSession {
    const apiBackend = resolveApiBackend(env);
    const requestTimeoutMs = parseRequestTimeoutMsFromEnv(
      env.LIBRUS_TIMEOUT_MS,
    );
    const sessionOptions =
      requestTimeoutMs === undefined
        ? options
        : {
            ...options,
            requestTimeoutMs: options.requestTimeoutMs ?? requestTimeoutMs,
          };

    if (apiBackend === "gateway_api_20") {
      return LibrusSession.fromGatewayCredentials(
        resolveGatewayCredentialsFromEnv(env),
        sessionOptions,
      );
    }

    return new LibrusSession({
      ...sessionOptions,
      apiBackend: "api_v3",
      credentials: resolvePortalCredentialsFromEnv(env),
    });
  }

  static fromGatewayCredentials(
    credentials: GatewayCredentials,
    options: Omit<
      LibrusSessionOptions,
      "apiBackend" | "authMode" | "credentials"
    > = {},
  ): LibrusSession {
    return new LibrusSession({
      ...options,
      apiBackend: "gateway_api_20",
      credentials,
    });
  }

  /** @deprecated Use fromGatewayCredentials instead. */
  static fromSynergiaCredentials(
    credentials: SynergiaCredentials,
    options: Omit<
      LibrusSessionOptions,
      "apiBackend" | "authMode" | "credentials"
    > = {},
  ): LibrusSession {
    emitDeprecationWarningOnce(
      "LIBRUS_FROM_SYNERGIA_CREDENTIALS_DEPRECATED",
      "LibrusSession.fromSynergiaCredentials() is deprecated; use fromGatewayCredentials() instead.",
    );

    return LibrusSession.fromGatewayCredentials(
      {
        login: credentials.id,
        password: credentials.password,
      },
      options,
    );
  }

  getApiBackend(): LibrusApiBackend {
    return this.apiBackend;
  }

  /** @deprecated Use getApiBackend instead. */
  getAuthMode(): LibrusAuthMode {
    emitDeprecationWarningOnce(
      "LIBRUS_GET_AUTH_MODE_DEPRECATED",
      "LibrusSession.getAuthMode() is deprecated; use getApiBackend() instead.",
    );

    return mapApiBackendToAuthMode(this.apiBackend);
  }

  async login(): Promise<void> {
    if (this.apiBackend === "gateway_api_20") {
      await this.getGatewayApi20AuthClient().login(
        this.getGatewayCredentials(),
      );
      return;
    }

    const portalClient = this.getPortalClient();

    if (portalClient.isLoggedIn()) {
      return;
    }

    await portalClient.login(this.getPortalCredentials());
  }

  async getPortalMe(): Promise<PortalMe> {
    this.assertApiV3Backend("getPortalMe");
    await this.login();
    return this.getPortalClient().getMe();
  }

  async getSynergiaAccounts(): Promise<SynergiaAccountsResponse> {
    this.assertApiV3Backend("getSynergiaAccounts");
    await this.login();

    if (!this.accountsCache) {
      this.accountsCache = await this.getPortalClient().getSynergiaAccounts();
    }

    return this.accountsCache;
  }

  async listChildren(): Promise<ChildAccount[]> {
    const response = await this.getSynergiaAccounts();
    return response.accounts;
  }

  async resolveChild(selector: string): Promise<ChildAccount> {
    const children = await this.listChildren();
    const byId = children.find((child) => String(child.id) === selector);

    if (byId) {
      return byId;
    }

    const byLogin = children.filter((child) => child.login === selector);

    if (byLogin.length === 1 && byLogin[0]) {
      return byLogin[0];
    }

    if (byLogin.length > 1) {
      throw new LibrusSdkError(
        "AMBIGUOUS_CHILD",
        `Multiple child accounts matched selector "${selector}".`,
        {
          matches: byLogin.map((child) => ({
            id: child.id,
            login: child.login,
            group: child.group,
            state: child.state,
          })),
        },
      );
    }

    throw new LibrusSdkError(
      "CHILD_NOT_FOUND",
      `No child account matched selector "${selector}".`,
    );
  }

  async forChild(
    selectorOrChild?: string | ChildAccount,
  ): Promise<SynergiaApiClient> {
    if (this.apiBackend === "gateway_api_20") {
      if (selectorOrChild !== undefined) {
        throw new LibrusSdkError(
          "UNSUPPORTED_BACKEND",
          "Child selection is not supported with gateway_api_20 because the gateway session is already scoped to one account.",
          { apiBackend: this.apiBackend },
        );
      }

      await this.login();
      return this.getGatewayApi20AuthClient().createApiClient(
        this.synergiaClientOptions,
      );
    }

    if (selectorOrChild === undefined) {
      throw new LibrusSdkError(
        "CHILD_REQUIRED",
        "Child account id, login, or ChildAccount is required for api_v3.",
      );
    }

    const child =
      typeof selectorOrChild === "string"
        ? await this.resolveChild(selectorOrChild)
        : selectorOrChild;

    const token =
      this.latestTokenPerChild.get(String(child.id)) ?? child.accessToken;

    return new SynergiaApiClient(token, {
      ...this.synergiaClientOptions,
      onAuthInvalidated: (staleToken: string) =>
        this.acquireFreshToken(String(child.id), staleToken),
    } as SynergiaApiClientOptions);
  }

  /**
   * Re-fetch a fresh Synergia bearer token for a known child, reusing the
   * cached portal login (and re-logging in if the portal session itself is
   * dead). Concurrent calls for the same child share one in-flight promise.
   */
  async refreshBearerToken(childId: string | number): Promise<string> {
    this.assertApiV3Backend("refreshBearerToken");
    return this.acquireFreshToken(String(childId), undefined);
  }

  /**
   * Internal refresh path used by the `onAuthInvalidated` callback. Accepts
   * the token the client actually used for the failed request so it can detect
   * when a sibling request already refreshed to a newer token and skip the
   * portal round-trip.
   */
  private acquireFreshToken(
    key: string,
    staleToken: string | undefined,
  ): Promise<string> {
    if (staleToken !== undefined) {
      const latest = this.latestTokenPerChild.get(key);

      if (latest !== undefined && latest !== staleToken) {
        return Promise.resolve(latest);
      }
    }

    const existing = this.refreshInFlight.get(key);

    if (existing) {
      return existing;
    }

    const promise = this.performBearerTokenRefresh(key).finally(() => {
      this.refreshInFlight.delete(key);
    });

    this.refreshInFlight.set(key, promise);

    return promise;
  }

  private async performBearerTokenRefresh(childId: string): Promise<string> {
    const child = await this.resolveChild(childId);
    const portalClient = this.getPortalClient();

    await this.login();

    let fresh: ChildAccount;

    try {
      fresh = await portalClient.getFreshSynergiaAccount(child.login);
    } catch (error) {
      if (!isUnauthorized(error)) {
        throw error;
      }

      // The cached portal session is dead. Force a fresh login and retry once.
      await portalClient.login(this.getPortalCredentials());
      fresh = await portalClient.getFreshSynergiaAccount(child.login);
    }

    // Record the latest token so delayed 401s and forChild(childObject) calls
    // can pick up the fresh value without another portal round-trip.
    this.latestTokenPerChild.set(String(fresh.id), fresh.accessToken);

    // Keep accountsCache in sync so resolveChild() returns the fresh account.
    if (this.accountsCache) {
      this.accountsCache = {
        ...this.accountsCache,
        accounts: this.accountsCache.accounts.map((a) =>
          a.id === fresh.id ? fresh : a,
        ),
      };
    }

    return fresh.accessToken;
  }

  async forChildWiadomosci(
    selectorOrChild: string | ChildAccount,
  ): Promise<SynergiaApiClient> {
    this.assertApiV3Backend("forChildWiadomosci");
    const child =
      typeof selectorOrChild === "string"
        ? await this.resolveChild(selectorOrChild)
        : selectorOrChild;
    const messageBackend = new WiadomosciMessagesClient(child, {
      ...this.wiadomosciClientOptions,
      ensurePortalLogin: () => this.login(),
      portalClient: this.getPortalClient(),
    });

    const token =
      this.latestTokenPerChild.get(String(child.id)) ?? child.accessToken;

    return new SynergiaApiClient(token, {
      ...this.synergiaClientOptions,
      messageBackend,
      onAuthInvalidated: (staleToken: string) =>
        this.acquireFreshToken(String(child.id), staleToken),
    } as SynergiaApiClientOptions);
  }

  async forChildBff(
    selectorOrChild: string | ChildAccount,
  ): Promise<BffApiClient> {
    this.assertApiV3Backend("forChildBff");
    const child =
      typeof selectorOrChild === "string"
        ? await this.resolveChild(selectorOrChild)
        : selectorOrChild;
    const token =
      this.latestTokenPerChild.get(String(child.id)) ?? child.accessToken;

    return new BffApiClient(token, this.bffClientOptions);
  }

  private getPortalCredentials(): PortalCredentials {
    const credentials = this.portalCredentials;

    if (!credentials) {
      throw new LibrusSdkError(
        "UNSUPPORTED_BACKEND",
        "This operation requires api_v3 portal credentials.",
        { apiBackend: this.apiBackend },
      );
    }

    return credentials;
  }

  private getGatewayCredentials(): GatewayCredentials {
    const credentials = this.gatewayCredentials;

    if (!credentials) {
      throw new LibrusSdkError(
        "UNSUPPORTED_BACKEND",
        "This operation requires gateway_api_20 credentials.",
        { apiBackend: this.apiBackend },
      );
    }

    return credentials;
  }

  private getPortalClient(): PortalClient {
    const portalClient = this.portalClient;

    if (!portalClient) {
      throw new LibrusSdkError(
        "UNSUPPORTED_BACKEND",
        "This operation requires the api_v3 portal backend.",
        { apiBackend: this.apiBackend },
      );
    }

    return portalClient;
  }

  private getGatewayApi20AuthClient(): GatewayApi20AuthClient {
    if (!this.gatewayApi20AuthClient) {
      throw new LibrusSdkError(
        "UNSUPPORTED_BACKEND",
        "This operation requires the gateway_api_20 backend.",
        { apiBackend: this.apiBackend },
      );
    }

    return this.gatewayApi20AuthClient;
  }

  private assertApiV3Backend(operation: string): void {
    if (this.apiBackend === "api_v3") {
      return;
    }

    throw new LibrusSdkError(
      "UNSUPPORTED_BACKEND",
      `${operation} requires api_v3 and is not available when using gateway_api_20.`,
      { apiBackend: this.apiBackend },
    );
  }
}

function isUnauthorized(error: unknown): boolean {
  return error instanceof LibrusApiError && error.details?.status === 401;
}

function resolveApiBackend(env: NodeJS.ProcessEnv): ApiBackendEnvValue {
  const rawApiBackend = env.LIBRUS_API_BACKEND;
  const rawAuthMode = env.LIBRUS_AUTH_MODE;

  if (rawAuthMode !== undefined) {
    emitDeprecationWarningOnce(
      "LIBRUS_AUTH_MODE_ENV_DEPRECATED",
      "LIBRUS_AUTH_MODE is deprecated; use LIBRUS_API_BACKEND instead.",
    );
  }

  if (rawApiBackend !== undefined) {
    return parseApiBackendEnvValue(rawApiBackend);
  }

  if (rawAuthMode !== undefined) {
    return parseAuthModeEnvValue(rawAuthMode);
  }

  if (hasCompletePortalCredentials(env)) {
    return "api_v3";
  }

  if (hasCompleteGatewayCredentials(env)) {
    return "gateway_api_20";
  }

  return "api_v3";
}

function parseApiBackendEnvValue(value: string): ApiBackendEnvValue {
  if (value === "api_v3" || value === "gateway_api_20") {
    return value;
  }

  throw new LibrusConfigurationError(
    'Invalid LIBRUS_API_BACKEND. Expected "api_v3" or "gateway_api_20".',
  );
}

function parseAuthModeEnvValue(value: string): ApiBackendEnvValue {
  if (value === "portal") {
    return "api_v3";
  }

  if (value === "synergia") {
    return "gateway_api_20";
  }

  throw new LibrusConfigurationError(
    'Invalid LIBRUS_AUTH_MODE. Expected "portal" or "synergia".',
  );
}

function mapAuthModeToApiBackend(
  authMode: LibrusAuthMode | undefined,
): LibrusApiBackend | undefined {
  if (authMode === "portal") {
    return "api_v3";
  }

  if (authMode === "synergia") {
    return "gateway_api_20";
  }

  return undefined;
}

function mapApiBackendToAuthMode(apiBackend: LibrusApiBackend): LibrusAuthMode {
  return apiBackend === "api_v3" ? "portal" : "synergia";
}

function hasCompletePortalCredentials(env: NodeJS.ProcessEnv): boolean {
  return Boolean(
    resolvePortalCredentialEnv(env, PORTAL_EMAIL_ENV) &&
    resolvePortalCredentialEnv(env, PORTAL_PASSWORD_ENV),
  );
}

function hasCompleteGatewayCredentials(env: NodeJS.ProcessEnv): boolean {
  return Boolean(
    resolveGatewayCredentialEnv(env, GATEWAY_LOGIN_ENV) &&
    resolveGatewayCredentialEnv(env, GATEWAY_PASSWORD_ENV),
  );
}

function resolvePortalCredentialsFromEnv(
  env: NodeJS.ProcessEnv,
): PortalCredentials {
  const email = resolvePortalCredentialEnv(env, PORTAL_EMAIL_ENV);
  const password = resolvePortalCredentialEnv(env, PORTAL_PASSWORD_ENV);

  if (!email || !password) {
    throw new LibrusConfigurationError(
      buildMissingPortalCredentialsMessage(env),
    );
  }

  return { email, password };
}

function resolveGatewayCredentialsFromEnv(
  env: NodeJS.ProcessEnv,
): GatewayCredentials {
  const login = resolveGatewayCredentialEnv(env, GATEWAY_LOGIN_ENV);
  const password = resolveGatewayCredentialEnv(env, GATEWAY_PASSWORD_ENV);

  if (!login || !password) {
    throw new LibrusConfigurationError(
      buildMissingGatewayCredentialsMessage(env),
    );
  }

  return { login, password };
}

function resolvePortalCredentialEnv(
  env: NodeJS.ProcessEnv,
  field: PortalCredentialEnvField,
): string | undefined {
  const primaryValue = env[field.primary];

  if (primaryValue !== undefined) {
    return primaryValue;
  }

  if (env[field.fallback] !== undefined) {
    emitDeprecationWarningOnce(
      `${field.fallback}_ENV_DEPRECATED`,
      `${field.fallback} is deprecated; use ${field.primary} instead.`,
    );
  }

  return env[field.fallback];
}

function resolveGatewayCredentialEnv(
  env: NodeJS.ProcessEnv,
  field: GatewayCredentialEnvField,
): string | undefined {
  const primaryValue = env[field.primary];

  if (primaryValue !== undefined) {
    return primaryValue;
  }

  if (env[field.alias] !== undefined) {
    emitDeprecationWarningOnce(
      `${field.alias}_ENV_DEPRECATED`,
      `${field.alias} is deprecated; use ${field.primary} instead.`,
    );
  }

  return env[field.alias];
}

function buildMissingPortalCredentialsMessage(env: NodeJS.ProcessEnv): string {
  return [
    "Missing portal credentials.",
    describePortalCredentialEnvIssue(env, PORTAL_EMAIL_ENV),
    describePortalCredentialEnvIssue(env, PORTAL_PASSWORD_ENV),
  ]
    .filter((part): part is string => part !== undefined)
    .join(" ");
}

function buildMissingGatewayCredentialsMessage(env: NodeJS.ProcessEnv): string {
  return [
    "Missing gateway API 2.0 credentials.",
    describeGatewayCredentialEnvIssue(env, GATEWAY_LOGIN_ENV),
    describeGatewayCredentialEnvIssue(env, GATEWAY_PASSWORD_ENV),
  ]
    .filter((part): part is string => part !== undefined)
    .join(" ");
}

function describePortalCredentialEnvIssue(
  env: NodeJS.ProcessEnv,
  field: PortalCredentialEnvField,
): string | undefined {
  const resolvedValue = resolvePortalCredentialEnv(env, field);

  if (resolvedValue) {
    return undefined;
  }

  const primaryValue = env[field.primary];

  if (primaryValue !== undefined) {
    return `${field.label}: ${field.primary} is ${describeEnvValueState(
      primaryValue,
    )}; fallback ${field.fallback} is ignored because ${field.primary} is set.`;
  }

  const fallbackValue = env[field.fallback];

  return `${field.label}: ${field.primary} is unset; fallback ${
    field.fallback
  } is ${describeEnvValueState(fallbackValue)}.`;
}

function describeGatewayCredentialEnvIssue(
  env: NodeJS.ProcessEnv,
  field: GatewayCredentialEnvField,
): string | undefined {
  const resolvedValue = resolveGatewayCredentialEnv(env, field);

  if (resolvedValue) {
    return undefined;
  }

  return `${field.label}: ${field.primary} is ${describeEnvValueState(
    env[field.primary],
  )}.`;
}

function describeEnvValueState(value: string | undefined): "empty" | "unset" {
  return value === undefined ? "unset" : "empty";
}

function normalizePortalCredentials(
  credentials: PortalCredentials | GatewayCredentials | SynergiaCredentials,
): PortalCredentials {
  if ("email" in credentials) {
    return credentials;
  }

  throw new LibrusConfigurationError(
    "api_v3 credentials require email and password.",
  );
}

function normalizeGatewayCredentials(
  credentials: PortalCredentials | GatewayCredentials | SynergiaCredentials,
): GatewayCredentials {
  if ("login" in credentials) {
    return credentials;
  }

  if ("id" in credentials) {
    emitDeprecationWarningOnce(
      "LIBRUS_SYNERGIA_CREDENTIALS_ID_DEPRECATED",
      'Gateway credentials with an "id" field are deprecated; use "login" instead.',
    );

    return {
      login: credentials.id,
      password: credentials.password,
    };
  }

  throw new LibrusConfigurationError(
    "gateway_api_20 credentials require login and password.",
  );
}

function applyRequestTimeout<T extends { requestTimeoutMs?: number }>(
  options: T | undefined,
  requestTimeoutMs: number | undefined,
): T | undefined {
  if (
    options?.requestTimeoutMs !== undefined ||
    requestTimeoutMs === undefined
  ) {
    return options;
  }

  return options
    ? { ...options, requestTimeoutMs }
    : ({ requestTimeoutMs } as T);
}

function applyLogger<T extends { logger?: Logger }>(
  options: T | undefined,
  logger: Logger | undefined,
): T | undefined {
  if (options?.logger !== undefined || logger === undefined) {
    return options;
  }

  return options ? { ...options, logger } : ({ logger } as T);
}
