export interface PortalCredentials {
  email: string;
  password: string;
}

export interface PortalSubscription {
  state?: string;
  purchase?: Record<string, unknown> | null;
  slots?: Record<string, unknown> | null;
  [key: string]: unknown;
}

export interface PortalMe {
  identifier: number;
  email: string;
  subscription?: PortalSubscription;
  [key: string]: unknown;
}

export interface ChildAccount {
  id: number;
  accountIdentifier: string;
  group: string;
  login: string;
  studentName: string;
  accessToken: string;
  state: string;
  scopes?: string[];
}

export interface SynergiaAccountsResponse {
  lastModification: number;
  accounts: ChildAccount[];
}

export type ChildAccountSummary = Omit<ChildAccount, "accessToken">;
