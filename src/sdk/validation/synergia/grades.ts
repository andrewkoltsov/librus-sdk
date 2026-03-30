import * as v from "valibot";

import { apiRefSchema } from "../common.js";
import {
  synergiaEntityListSchema,
  synergiaEntitySchema,
  synergiaResponseEnvelopeSchema,
  synergiaStatusResponseSchema,
} from "./common.js";

const gradeSchema = v.looseObject({
  AddDate: v.string(),
  AddedBy: apiRefSchema,
  Category: apiRefSchema,
  Date: v.string(),
  Grade: v.string(),
  Id: v.number(),
  IsConstituent: v.boolean(),
  IsFinal: v.boolean(),
  IsFinalProposition: v.boolean(),
  IsSemester: v.boolean(),
  IsSemesterProposition: v.boolean(),
  Lesson: apiRefSchema,
  Semester: v.number(),
  Student: apiRefSchema,
  Subject: apiRefSchema,
});

export const gradesResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  Grades: v.array(gradeSchema),
});

export const gradeAveragesResponseSchema = v.union([
  v.looseObject({
    ...synergiaResponseEnvelopeSchema.entries,
    Averages: synergiaEntityListSchema,
  }),
  synergiaStatusResponseSchema,
]);

export const gradeCategoriesResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  Categories: synergiaEntityListSchema,
});

export const gradeCommentsResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  Comments: synergiaEntityListSchema,
});

export const behaviourGradesResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  Grades: synergiaEntityListSchema,
});

export const behaviourGradeTypesResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  Types: synergiaEntityListSchema,
});

export const behaviourGradePointsResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  Grades: synergiaEntityListSchema,
});

export const behaviourPointCategoriesResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  Categories: synergiaEntityListSchema,
});

export const behaviourPointCommentsResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  Comments: synergiaEntityListSchema,
});

export const behaviourSystemProposalResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  BehaviourGradesSystemProposal: v.union([
    synergiaEntityListSchema,
    synergiaEntitySchema,
    v.null(),
  ]),
});

export const descriptiveGradesResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  Grades: synergiaEntityListSchema,
});

export const descriptiveGradeCommentsResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  Comments: synergiaEntityListSchema,
});

export const descriptiveGradeSkillsResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  Skills: synergiaEntityListSchema,
});

export const descriptiveGradeTextResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  Grades: synergiaEntityListSchema,
});

export const descriptiveGradeTextCategoriesResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  Categories: synergiaEntityListSchema,
});

export const descriptiveTextGradesResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  Grades: synergiaEntityListSchema,
});

export const descriptiveTextGradeSkillsResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  Skills: synergiaEntityListSchema,
});

export const pointGradesResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  Grades: synergiaEntityListSchema,
});

export const pointGradeAveragesResponseSchema = v.union([
  v.looseObject({
    ...synergiaResponseEnvelopeSchema.entries,
    Averages: synergiaEntityListSchema,
  }),
  synergiaStatusResponseSchema,
]);

export const pointGradeCategoriesResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  Categories: synergiaEntityListSchema,
});

export const pointGradeCommentsResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  Comments: synergiaEntityListSchema,
});

export const textGradesResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  Grades: synergiaEntityListSchema,
});
