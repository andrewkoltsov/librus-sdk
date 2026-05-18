import type { FetchLike } from "../models/common.js";
import { LibrusApiError, LibrusSdkError } from "../models/errors.js";
import type { SynergiaBinaryResult } from "../models/synergia/common.js";
import { parseApiResponse } from "../validation/responseValidation.js";
import type { BaseIssue, BaseSchema, InferOutput } from "valibot";

export type SynergiaQuery = Record<
  string,
  string | number | boolean | null | undefined
>;

export interface SynergiaRequestOptions {
  query?: SynergiaQuery;
}

export type SynergiaAuthMode = "bearer" | "cookie";

const LIBRUS_MOBILE_ORIGIN = "app://librus";
const LIBRUS_MOBILE_USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 LibrusMobileApp";

function buildSynergiaHeaders(
  accessToken: string,
  authMode: SynergiaAuthMode,
  extraHeaders: HeadersInit = {},
): HeadersInit {
  const headers: HeadersInit = {
    origin: LIBRUS_MOBILE_ORIGIN,
    "user-agent": LIBRUS_MOBILE_USER_AGENT,
    ...extraHeaders,
  };

  if (authMode === "bearer") {
    return {
      ...headers,
      authorization: `Bearer ${accessToken}`,
    };
  }

  return headers;
}

function normalizeApiBaseUrl(apiBaseUrl: string): string {
  return apiBaseUrl.endsWith("/") ? apiBaseUrl : `${apiBaseUrl}/`;
}

function normalizePath(path: string): string {
  return path.replace(/^\/+/, "");
}

async function throwForFailure(
  response: Response,
  endpoint: string,
): Promise<never> {
  const bodyText = await response.text();

  try {
    const payload = JSON.parse(bodyText) as { Status?: string };

    if (payload.Status === "Maintenance") {
      throw new LibrusSdkError(
        "SERVICE_MAINTENANCE",
        "Librus API is temporarily unavailable due to maintenance.",
        { endpoint, status: response.status },
      );
    }
  } catch (error) {
    if (error instanceof LibrusSdkError) {
      throw error;
    }
  }

  throw new LibrusApiError(
    endpoint,
    response.status,
    "Synergia API request failed",
  );
}

export function buildEndpoint(
  apiBaseUrl: string,
  path: string,
  query?: SynergiaQuery,
): string {
  const endpoint = new URL(
    normalizePath(path),
    normalizeApiBaseUrl(apiBaseUrl),
  );

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined) {
        endpoint.searchParams.append(key, String(value));
      }
    }
  }

  return endpoint.toString();
}

export async function getJson<
  TSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
>(
  fetchImpl: FetchLike,
  accessToken: string,
  apiBaseUrl: string,
  path: string,
  schema: TSchema,
  options: SynergiaRequestOptions = {},
  authMode: SynergiaAuthMode = "bearer",
): Promise<InferOutput<TSchema>> {
  const endpoint = buildEndpoint(apiBaseUrl, path, options.query);
  const response = await fetchImpl(endpoint, {
    method: "GET",
    headers: buildSynergiaHeaders(accessToken, authMode, {
      accept: "application/json",
    }),
  });

  if (!response.ok) {
    await throwForFailure(response, endpoint);
  }

  return parseApiResponse(schema, await response.json(), endpoint);
}

export async function getBinary(
  fetchImpl: FetchLike,
  accessToken: string,
  apiBaseUrl: string,
  path: string,
  options: SynergiaRequestOptions = {},
  authMode: SynergiaAuthMode = "bearer",
): Promise<SynergiaBinaryResult> {
  const endpoint = buildEndpoint(apiBaseUrl, path, options.query);
  const response = await fetchImpl(endpoint, {
    method: "GET",
    headers: buildSynergiaHeaders(accessToken, authMode),
  });

  if (!response.ok) {
    await throwForFailure(response, endpoint);
  }

  return {
    data: await response.arrayBuffer(),
    contentDisposition: response.headers.get("content-disposition"),
    contentType: response.headers.get("content-type"),
  };
}
