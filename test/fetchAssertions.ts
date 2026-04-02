import { expect } from "vitest";

interface FetchMockLike {
  mock: {
    calls: Parameters<typeof fetch>[];
  };
}

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
