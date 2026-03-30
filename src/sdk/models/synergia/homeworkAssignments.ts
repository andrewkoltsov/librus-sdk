import type { JsonObject } from "../common.js";

import type { SynergiaResponseEnvelope } from "./common.js";

export type HomeworkAssignment = JsonObject;

export interface HomeworkAssignmentsResponse extends SynergiaResponseEnvelope {
  HomeWorkAssignments: HomeworkAssignment[];
}
