import type { JsonObject } from "../common.js";

import type { SynergiaResponseEnvelope } from "./common.js";

type SynergiaId = string | number;

export type AuthPhoto = JsonObject & {
  Id?: SynergiaId;
  content?: string;
  fileName?: string;
  id?: SynergiaId;
};

export type AuthPhotoPayload = JsonObject & {
  awaitingPhoto?: JsonObject | null;
  photo?: AuthPhoto | null;
  status?: boolean | number | string | null;
};

export interface AuthPhotosResponse extends SynergiaResponseEnvelope {
  data: AuthPhotoPayload;
}

export interface AuthPhotoResponse extends SynergiaResponseEnvelope {
  data: AuthPhotoPayload;
}

export type AuthUserInfoResponse = SynergiaResponseEnvelope &
  JsonObject & {
    AccountNumericIdentifier?: string | number;
    IdentifierOfClassOfStudentAssignedWithUser?: string | number | null;
    IdentifierOfStudentAssignedWithUser?: string | number | null;
    KindergartenGraduationYear?: string | number | null;
    Login?: string;
    SchoolId?: string | number;
    UserIdentifier?: string;
    UserNumericIdentifier?: string | number;
    UserSchoolClassId?: string | number | null;
    UserState?: string | number;
    UserType?: string | number;
  };

export type AuthTokenInfoResponse = SynergiaResponseEnvelope &
  JsonObject & {
    IdentifierOfClassOfStudentAssignedWithUser?: string | number | null;
    IdentifierOfStudentAssignedWithUser?: string | number | null;
    SchoolId?: string | number;
    SchoolNodeName?: string;
    Scopes?: unknown[];
    UserIdentifier?: string;
    UserType?: string | number;
  };

export type AuthClassroomResponse = SynergiaResponseEnvelope & JsonObject;
