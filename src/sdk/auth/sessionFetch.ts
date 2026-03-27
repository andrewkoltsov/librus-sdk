import fetchCookie from "fetch-cookie";
import { CookieJar } from "tough-cookie";

import type { FetchLike } from "../models/common.js";

export interface SessionFetch {
  fetch: FetchLike;
  cookieJar: CookieJar;
}

export function createSessionFetch(baseFetch: FetchLike = fetch): SessionFetch {
  const cookieJar = new CookieJar();
  const cookieFetch = fetchCookie(baseFetch, cookieJar) as unknown as FetchLike;

  return {
    fetch: cookieFetch,
    cookieJar,
  };
}
