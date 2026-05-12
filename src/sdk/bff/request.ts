import type { FetchLike } from "../models/common.js";
import { LibrusApiError } from "../models/errors.js";
import { parseApiResponse } from "../validation/responseValidation.js";
import type { BaseIssue, BaseSchema, InferOutput } from "valibot";

const LIBRUS_MOBILE_USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 LibrusMobileApp";

function normalizeBffBaseUrl(bffBaseUrl: string): string {
  return bffBaseUrl.endsWith("/") ? bffBaseUrl : `${bffBaseUrl}/`;
}

function normalizePath(path: string): string {
  return path.replace(/^\/+/, "");
}

function buildBffHeaders(synergiaAccessToken: string): HeadersInit {
  return {
    accept: "application/json",
    "user-agent": LIBRUS_MOBILE_USER_AGENT,
    "x-zse-authorization": `Bearer ${synergiaAccessToken}`,
  };
}

async function throwForBffFailure(
  response: Response,
  endpoint: string,
): Promise<never> {
  await response.arrayBuffer();
  throw new LibrusApiError(endpoint, response.status, "BFF API request failed");
}

export function buildBffEndpoint(bffBaseUrl: string, path: string): string {
  return new URL(
    normalizePath(path),
    normalizeBffBaseUrl(bffBaseUrl),
  ).toString();
}

export async function getBffJson<
  TSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
>(
  fetchImpl: FetchLike,
  synergiaAccessToken: string,
  bffBaseUrl: string,
  path: string,
  schema: TSchema,
): Promise<InferOutput<TSchema>> {
  const endpoint = buildBffEndpoint(bffBaseUrl, path);
  const response = await fetchImpl(endpoint, {
    method: "GET",
    headers: buildBffHeaders(synergiaAccessToken),
  });

  if (!response.ok) {
    await throwForBffFailure(response, endpoint);
  }

  return parseApiResponse(schema, await response.json(), endpoint);
}
