import * as v from "valibot";

import { apiRefSchema } from "../common.js";
import {
  synergiaEntityListSchema,
  synergiaEntitySchema,
  synergiaResponseEnvelopeSchema,
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

export const gradeAveragesResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  GradesAverages: synergiaEntityListSchema,
});

export const gradeCategoriesResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  GradesCategories: synergiaEntityListSchema,
});

export const gradeCommentsResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  GradesComments: synergiaEntityListSchema,
});

export const behaviourGradesResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  BehaviourGrades: synergiaEntityListSchema,
});

export const behaviourGradeTypesResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  BehaviourGradesTypes: synergiaEntityListSchema,
});

export const behaviourGradePointsResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  BehaviourGradesPoints: synergiaEntityListSchema,
});

export const behaviourPointCategoriesResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  BehaviourGradesPointsCategories: synergiaEntityListSchema,
});

export const behaviourPointCommentsResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  BehaviourGradesPointsComments: synergiaEntityListSchema,
});

export const behaviourSystemProposalResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  BehaviourGradesSystemProposal: v.union([
    synergiaEntitySchema,
    synergiaEntityListSchema,
    v.null(),
  ]),
});

export const descriptiveGradesResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  DescriptiveGrades: synergiaEntityListSchema,
});

export const descriptiveGradeCommentsResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  DescriptiveGradesComments: synergiaEntityListSchema,
});

export const descriptiveGradeSkillsResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  DescriptiveGradesSkills: synergiaEntityListSchema,
});

export const descriptiveGradeTextResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  DescriptiveGradesText: synergiaEntityListSchema,
});

export const descriptiveGradeTextCategoriesResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  DescriptiveGradesTextCategories: synergiaEntityListSchema,
});

export const descriptiveTextGradesResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  DescriptiveTextGrades: synergiaEntityListSchema,
});

export const descriptiveTextGradeSkillsResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  DescriptiveTextGradesSkills: synergiaEntityListSchema,
});

export const pointGradesResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  PointGrades: synergiaEntityListSchema,
});

export const pointGradeAveragesResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  PointGradesAverages: synergiaEntityListSchema,
});

export const pointGradeCategoriesResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  PointGradesCategories: synergiaEntityListSchema,
});

export const pointGradeCommentsResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  PointGradesComments: synergiaEntityListSchema,
});

export const textGradesResponseSchema = v.looseObject({
  ...synergiaResponseEnvelopeSchema.entries,
  TextGrades: synergiaEntityListSchema,
});
