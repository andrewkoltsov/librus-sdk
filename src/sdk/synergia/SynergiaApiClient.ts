import type { FetchLike } from "../models/common.js";
import {
  LibrusApiError,
  LibrusSdkError,
  type AttendancesResponse,
  type GradesResponse,
  type HomeWorksResponse,
  type SynergiaMeResponse,
} from "../models/index.js";
import {
  attendancesResponseSchema,
  gradesResponseSchema,
  homeWorksResponseSchema,
  synergiaMeResponseSchema,
} from "../validation/schemas.js";
import { parseApiResponse } from "../validation/responseValidation.js";
import type { BaseIssue, BaseSchema, InferOutput } from "valibot";

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
    return this.getJson("/Me", synergiaMeResponseSchema);
  }

  getGrades(): Promise<GradesResponse> {
    return this.getJson("/Grades", gradesResponseSchema);
  }

  getAttendances(): Promise<AttendancesResponse> {
    return this.getJson("/Attendances", attendancesResponseSchema);
  }

  getHomeWorks(): Promise<HomeWorksResponse> {
    return this.getJson("/HomeWorks", homeWorksResponseSchema);
  }

  private async getJson<
    TSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
  >(path: string, schema: TSchema): Promise<InferOutput<TSchema>> {
    const endpoint = `${this.apiBaseUrl}${path}`;
    const response = await this.fetchImpl(endpoint, {
      method: "GET",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
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

    return parseApiResponse(schema, await response.json(), endpoint);
  }
}
