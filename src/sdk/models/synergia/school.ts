import type { JsonObject } from "../common.js";

import type { SynergiaResponseEnvelope } from "./common.js";

export type School = JsonObject;

export type SchoolClass = JsonObject;

export type Classroom = JsonObject;

export type Subject = JsonObject;

export type User = JsonObject;

export interface SchoolResponse extends SynergiaResponseEnvelope {
  School: School;
}

export interface ClassResponse extends SynergiaResponseEnvelope {
  Class: SchoolClass;
}

export interface ClassroomResponse extends SynergiaResponseEnvelope {
  Classroom: Classroom;
}

export interface SubjectsResponse extends SynergiaResponseEnvelope {
  Subjects: Subject[];
}

export interface SubjectResponse extends SynergiaResponseEnvelope {
  Subject: Subject;
}

export interface UsersResponse extends SynergiaResponseEnvelope {
  Users: User[];
}

export interface UserResponse extends SynergiaResponseEnvelope {
  User: User;
}
