import { expect } from "vitest";

interface FetchMockLike {
  mock: {
    calls: Parameters<typeof fetch>[];
  };
}

const LIBRUS_MOBILE_USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 LibrusMobileApp";

export function expectJsonGetRequest(
  fetchMock: FetchMockLike,
  expectedUrl: string,
): void {
  expectNthJsonGetRequest(fetchMock, 1, expectedUrl);
}

export function expectNthJsonGetRequest(
  fetchMock: FetchMockLike,
  callNumber: number,
  expectedUrl: string,
): void {
  expectNthGetRequest(fetchMock, callNumber, expectedUrl, {
    accept: "application/json",
    authorization: "Bearer token",
    origin: "app://librus",
    "user-agent": LIBRUS_MOBILE_USER_AGENT,
  });
}

export function expectBinaryGetRequest(
  fetchMock: FetchMockLike,
  expectedUrl: string,
): void {
  expectNthBinaryGetRequest(fetchMock, 1, expectedUrl);
}

export function expectNthBinaryGetRequest(
  fetchMock: FetchMockLike,
  callNumber: number,
  expectedUrl: string,
): void {
  expectNthGetRequest(fetchMock, callNumber, expectedUrl, {
    authorization: "Bearer token",
    origin: "app://librus",
    "user-agent": LIBRUS_MOBILE_USER_AGENT,
  });
}

function expectNthGetRequest(
  fetchMock: FetchMockLike,
  callNumber: number,
  expectedUrl: string,
  expectedHeaders: HeadersInit,
): void {
  const [url, init] = fetchMock.mock.calls[callNumber - 1] ?? [];

  expect(url).toBe(expectedUrl);
  expect(init).toMatchObject({
    method: "GET",
    headers: expectedHeaders,
  });
  expect(init?.signal).toBeInstanceOf(AbortSignal);
}
