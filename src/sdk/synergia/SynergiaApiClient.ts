import type { FetchLike } from "../models/common.js";
import type { AttendancesResponse } from "../models/synergia/attendance.js";
import type { GradesResponse } from "../models/synergia/grades.js";
import type { HomeWorksResponse } from "../models/synergia/homework.js";
import type { SynergiaMeResponse } from "../models/synergia/me.js";
import { attendancesResponseSchema } from "../validation/synergia/attendance.js";
import { gradesResponseSchema } from "../validation/synergia/grades.js";
import { homeWorksResponseSchema } from "../validation/synergia/homework.js";
import { synergiaMeResponseSchema } from "../validation/synergia/me.js";

import { getJson } from "./request.js";

export interface SynergiaApiClientOptions {
  fetch?: FetchLike;
  apiBaseUrl?: string;
}

export class SynergiaApiClient {
  private readonly fetchImpl: FetchLike;
  private readonly apiBaseUrl: string;
  private readonly accessToken: string;

  constructor(accessToken: string, options: SynergiaApiClientOptions = {}) {
    this.accessToken = accessToken;
    this.fetchImpl = options.fetch ?? fetch;
    this.apiBaseUrl = options.apiBaseUrl ?? "https://api.librus.pl/3.0";
  }

  getMe(): Promise<SynergiaMeResponse> {
    return getJson(
      this.fetchImpl,
      this.accessToken,
      this.apiBaseUrl,
      "/Me",
      synergiaMeResponseSchema,
    );
  }

  getGrades(): Promise<GradesResponse> {
    return getJson(
      this.fetchImpl,
      this.accessToken,
      this.apiBaseUrl,
      "/Grades",
      gradesResponseSchema,
    );
  }

  getAttendances(): Promise<AttendancesResponse> {
    return getJson(
      this.fetchImpl,
      this.accessToken,
      this.apiBaseUrl,
      "/Attendances",
      attendancesResponseSchema,
    );
  }

  getHomeWorks(): Promise<HomeWorksResponse> {
    return getJson(
      this.fetchImpl,
      this.accessToken,
      this.apiBaseUrl,
      "/HomeWorks",
      homeWorksResponseSchema,
    );
  }
}
