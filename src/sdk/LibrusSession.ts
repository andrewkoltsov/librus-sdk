import {
  PortalClient,
  type PortalClientOptions,
} from "./portal/PortalClient.js";
import {
  SynergiaApiClient,
  type SynergiaApiClientOptions,
} from "./synergia/SynergiaApiClient.js";
import {
  LibrusConfigurationError,
  LibrusSdkError,
  type ChildAccount,
  type PortalCredentials,
  type PortalMe,
  type SynergiaAccountsResponse,
} from "./models/index.js";
import {
  parseRequestTimeoutMsFromEnv,
  validateOptionalRequestTimeoutMs,
} from "./requestTimeout.js";

export interface LibrusSessionOptions {
  credentials: PortalCredentials;
  portalClient?: PortalClient;
  portalClientOptions?: PortalClientOptions;
  synergiaClientOptions?: SynergiaApiClientOptions;
  requestTimeoutMs?: number;
}

export class LibrusSession {
  private readonly credentials: PortalCredentials;
  private readonly portalClient: PortalClient;
  private readonly synergiaClientOptions: SynergiaApiClientOptions | undefined;
  private accountsCache?: SynergiaAccountsResponse;

  constructor(options: LibrusSessionOptions) {
    const requestTimeoutMs = validateOptionalRequestTimeoutMs(
      options.requestTimeoutMs,
    );
    const portalClientOptions =
      options.portalClientOptions?.requestTimeoutMs !== undefined ||
      requestTimeoutMs === undefined
        ? options.portalClientOptions
        : options.portalClientOptions
          ? {
              ...options.portalClientOptions,
              requestTimeoutMs,
            }
          : { requestTimeoutMs };
    const synergiaClientOptions =
      options.synergiaClientOptions?.requestTimeoutMs !== undefined ||
      requestTimeoutMs === undefined
        ? options.synergiaClientOptions
        : options.synergiaClientOptions
          ? {
              ...options.synergiaClientOptions,
              requestTimeoutMs,
            }
          : { requestTimeoutMs };

    this.credentials = options.credentials;
    this.portalClient =
      options.portalClient ?? new PortalClient(portalClientOptions);
    this.synergiaClientOptions = synergiaClientOptions;
  }

  static fromEnv(env: NodeJS.ProcessEnv = process.env): LibrusSession {
    const email = env.LIBRUS_PORTAL_EMAIL ?? env.LIBRUS_EMAIL;
    const password = env.LIBRUS_PORTAL_PASSWORD ?? env.LIBRUS_PASSWORD;

    if (!email || !password) {
      throw new LibrusConfigurationError(
        "Missing portal credentials. Set LIBRUS_PORTAL_EMAIL and LIBRUS_PORTAL_PASSWORD.",
      );
    }

    const requestTimeoutMs = parseRequestTimeoutMsFromEnv(
      env.LIBRUS_TIMEOUT_MS,
    );
    const sessionOptions: LibrusSessionOptions = {
      credentials: { email, password },
    };

    if (requestTimeoutMs !== undefined) {
      sessionOptions.requestTimeoutMs = requestTimeoutMs;
    }

    return new LibrusSession(sessionOptions);
  }

  async login(): Promise<void> {
    if (this.portalClient.isLoggedIn()) {
      return;
    }

    await this.portalClient.login(this.credentials);
  }

  async getPortalMe(): Promise<PortalMe> {
    await this.login();
    return this.portalClient.getMe();
  }

  async getSynergiaAccounts(): Promise<SynergiaAccountsResponse> {
    await this.login();

    if (!this.accountsCache) {
      this.accountsCache = await this.portalClient.getSynergiaAccounts();
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
    selectorOrChild: string | ChildAccount,
  ): Promise<SynergiaApiClient> {
    const child =
      typeof selectorOrChild === "string"
        ? await this.resolveChild(selectorOrChild)
        : selectorOrChild;
    return new SynergiaApiClient(child.accessToken, this.synergiaClientOptions);
  }
}
