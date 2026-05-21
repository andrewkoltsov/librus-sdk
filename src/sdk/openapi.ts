import { toJsonSchemaDefs } from "@valibot/to-json-schema";
import * as v from "valibot";

import {
  apiRefOrJsonSchema,
  apiRefSchema,
  nullableUnknownRecordSchema,
  unknownRecordSchema,
} from "./validation/common.js";
import {
  schoolNoticeResponseSchema,
  schoolNoticesResponseSchema,
} from "./validation/synergia/announcements.js";
import {
  attendanceTypesResponseSchema,
  attendancesResponseSchema,
} from "./validation/synergia/attendance.js";
import {
  authClassroomResponseSchema,
  authPhotoResponseSchema,
  authPhotosResponseSchema,
  authTokenInfoResponseSchema,
  authUserInfoResponseSchema,
} from "./validation/synergia/auth.js";
import {
  behaviourGradePointsResponseSchema,
  behaviourGradeTypesResponseSchema,
  behaviourGradesResponseSchema,
  behaviourPointCategoriesResponseSchema,
  behaviourPointCommentsResponseSchema,
  behaviourSystemProposalResponseSchema,
  descriptiveGradeCommentsResponseSchema,
  descriptiveGradeSkillsResponseSchema,
  descriptiveGradeTextCategoriesResponseSchema,
  descriptiveGradeTextResponseSchema,
  descriptiveGradesResponseSchema,
  descriptiveTextGradesResponseSchema,
  descriptiveTextGradeSkillsResponseSchema,
  gradeAveragesResponseSchema,
  gradeCategoriesResponseSchema,
  gradeCommentsResponseSchema,
  gradesResponseSchema,
  pointGradeAveragesResponseSchema,
  pointGradeCategoriesResponseSchema,
  pointGradeCommentsResponseSchema,
  pointGradesResponseSchema,
  textGradesResponseSchema,
} from "./validation/synergia/grades.js";
import {
  homeWorksResponseSchema,
  homeworkCategoriesResponseSchema,
} from "./validation/synergia/homework.js";
import { homeworkAssignmentsResponseSchema } from "./validation/synergia/homeworkAssignments.js";
import {
  justificationResponseSchema,
  justificationsResponseSchema,
  parentTeacherConferencesResponseSchema,
  systemDataResponseSchema,
} from "./validation/synergia/justifications.js";
import {
  lessonResponseSchema,
  lessonsResponseSchema,
  plannedLessonResponseSchema,
  plannedLessonsResponseSchema,
  realizationResponseSchema,
  realizationsResponseSchema,
} from "./validation/synergia/lessons.js";
import { synergiaMeResponseSchema } from "./validation/synergia/me.js";
import {
  messageReceiverGroupResponseSchema,
  messageReceiverGroupsResponseSchema,
  messageResponseSchema,
  messagesResponseSchema,
  unreadMessagesResponseSchema,
} from "./validation/synergia/messages.js";
import {
  luckyNumberResponseSchema,
  notificationCenterResponseSchema,
  pushConfigurationsResponseSchema,
} from "./validation/synergia/notifications.js";
import {
  noteCategoriesResponseSchema,
  noteResponseSchema,
  notesResponseSchema,
} from "./validation/synergia/notes.js";
import {
  synergiaEntityListSchema,
  synergiaEntitySchema,
  synergiaResponseEnvelopeSchema,
  synergiaStatusResponseSchema,
} from "./validation/synergia/common.js";
import {
  classResponseSchema,
  classroomResponseSchema,
  schoolResponseSchema,
  subjectResponseSchema,
  subjectsResponseSchema,
  userResponseSchema,
  usersResponseSchema,
} from "./validation/synergia/school.js";
import {
  calendarsResponseSchema,
  classFreeDaysResponseSchema,
  classFreeDayTypesResponseSchema,
  schoolFreeDaysResponseSchema,
  substitutionResponseSchema,
  teacherFreeDaysResponseSchema,
  timetableEntryResponseSchema,
  timetablesResponseSchema,
  virtualClassesResponseSchema,
} from "./validation/synergia/timetable.js";

type JsonObject = Record<string, unknown>;

export interface GenerateOpenApiDocumentOptions {
  title?: string;
  version?: string;
  serverUrl?: string;
}

export interface LibrusOpenApiDocument {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
  };
  servers: Array<{
    url: string;
    description: string;
  }>;
  tags: Array<{
    name: string;
    description: string;
  }>;
  security: Array<Record<string, string[]>>;
  paths: Record<string, JsonObject>;
  components: {
    securitySchemes: Record<string, JsonObject>;
    schemas: Record<string, unknown>;
  };
}

interface OpenApiParameter {
  name: string;
  in: "path" | "query";
  required: boolean;
  description: string;
  schema: JsonObject;
}

interface OpenApiOperationDefinition {
  path: string;
  operationId: string;
  summary: string;
  tag: string;
  description?: string;
  parameters?: readonly OpenApiParameter[];
  response:
    | {
        kind: "json";
        schemaName: string;
        description?: string;
      }
    | {
        kind: "binary";
        description?: string;
      };
}

const synergiaOpenApiSchemaDefinitions = {
  ApiRef: apiRefSchema,
  ApiRefOrJson: apiRefOrJsonSchema,
  UnknownRecord: unknownRecordSchema,
  NullableUnknownRecord: nullableUnknownRecordSchema,
  SynergiaResponseEnvelope: synergiaResponseEnvelopeSchema,
  SynergiaStatusResponse: synergiaStatusResponseSchema,
  SynergiaEntity: synergiaEntitySchema,
  SynergiaEntityList: synergiaEntityListSchema,
  SynergiaMeResponse: synergiaMeResponseSchema,
  GradesResponse: gradesResponseSchema,
  GradeAveragesResponse: gradeAveragesResponseSchema,
  GradeCategoriesResponse: gradeCategoriesResponseSchema,
  GradeCommentsResponse: gradeCommentsResponseSchema,
  BehaviourGradesResponse: behaviourGradesResponseSchema,
  BehaviourGradeTypesResponse: behaviourGradeTypesResponseSchema,
  BehaviourGradePointsResponse: behaviourGradePointsResponseSchema,
  BehaviourPointCategoriesResponse: behaviourPointCategoriesResponseSchema,
  BehaviourPointCommentsResponse: behaviourPointCommentsResponseSchema,
  BehaviourSystemProposalResponse: behaviourSystemProposalResponseSchema,
  DescriptiveGradesResponse: descriptiveGradesResponseSchema,
  DescriptiveGradeCommentsResponse: descriptiveGradeCommentsResponseSchema,
  DescriptiveGradeSkillsResponse: descriptiveGradeSkillsResponseSchema,
  DescriptiveGradeTextResponse: descriptiveGradeTextResponseSchema,
  DescriptiveGradeTextCategoriesResponse:
    descriptiveGradeTextCategoriesResponseSchema,
  DescriptiveTextGradesResponse: descriptiveTextGradesResponseSchema,
  DescriptiveTextGradeSkillsResponse: descriptiveTextGradeSkillsResponseSchema,
  PointGradesResponse: pointGradesResponseSchema,
  PointGradeAveragesResponse: pointGradeAveragesResponseSchema,
  PointGradeCategoriesResponse: pointGradeCategoriesResponseSchema,
  PointGradeCommentsResponse: pointGradeCommentsResponseSchema,
  TextGradesResponse: textGradesResponseSchema,
  AttendancesResponse: attendancesResponseSchema,
  AttendanceTypesResponse: attendanceTypesResponseSchema,
  AuthPhotosResponse: authPhotosResponseSchema,
  AuthPhotoResponse: authPhotoResponseSchema,
  AuthUserInfoResponse: authUserInfoResponseSchema,
  AuthTokenInfoResponse: authTokenInfoResponseSchema,
  AuthClassroomResponse: authClassroomResponseSchema,
  TimetablesResponse: timetablesResponseSchema,
  TimetableEntryResponse: timetableEntryResponseSchema,
  CalendarsResponse: calendarsResponseSchema,
  ClassFreeDaysResponse: classFreeDaysResponseSchema,
  ClassFreeDayTypesResponse: classFreeDayTypesResponseSchema,
  SchoolFreeDaysResponse: schoolFreeDaysResponseSchema,
  TeacherFreeDaysResponse: teacherFreeDaysResponseSchema,
  SubstitutionResponse: substitutionResponseSchema,
  VirtualClassesResponse: virtualClassesResponseSchema,
  LessonsResponse: lessonsResponseSchema,
  LessonResponse: lessonResponseSchema,
  PlannedLessonsResponse: plannedLessonsResponseSchema,
  PlannedLessonResponse: plannedLessonResponseSchema,
  RealizationsResponse: realizationsResponseSchema,
  RealizationResponse: realizationResponseSchema,
  LuckyNumberResponse: luckyNumberResponseSchema,
  NotificationCenterResponse: notificationCenterResponseSchema,
  PushConfigurationsResponse: pushConfigurationsResponseSchema,
  JustificationsResponse: justificationsResponseSchema,
  JustificationResponse: justificationResponseSchema,
  ParentTeacherConferencesResponse: parentTeacherConferencesResponseSchema,
  SystemDataResponse: systemDataResponseSchema,
  MessagesResponse: messagesResponseSchema,
  MessageResponse: messageResponseSchema,
  UnreadMessagesResponse: unreadMessagesResponseSchema,
  MessageReceiverGroupsResponse: messageReceiverGroupsResponseSchema,
  MessageReceiverGroupResponse: messageReceiverGroupResponseSchema,
  SchoolNoticesResponse: schoolNoticesResponseSchema,
  SchoolNoticeResponse: schoolNoticeResponseSchema,
  NotesResponse: notesResponseSchema,
  NoteResponse: noteResponseSchema,
  NoteCategoriesResponse: noteCategoriesResponseSchema,
  SchoolResponse: schoolResponseSchema,
  ClassResponse: classResponseSchema,
  ClassroomResponse: classroomResponseSchema,
  SubjectsResponse: subjectsResponseSchema,
  SubjectResponse: subjectResponseSchema,
  UsersResponse: usersResponseSchema,
  UserResponse: userResponseSchema,
  HomeWorksResponse: homeWorksResponseSchema,
  HomeworkAssignmentsResponse: homeworkAssignmentsResponseSchema,
  HomeworkCategoriesResponse: homeworkCategoriesResponseSchema,
} as const;

const wiadomosciMessageSchema = v.looseObject({
  messageId: v.exactOptional(v.union([v.string(), v.number()])),
  Id: v.exactOptional(v.union([v.string(), v.number()])),
  senderId: v.exactOptional(v.union([v.string(), v.number()])),
  receiverId: v.exactOptional(v.union([v.string(), v.number()])),
  receiver: v.exactOptional(unknownRecordSchema),
  topic: v.exactOptional(v.string()),
  Subject: v.exactOptional(v.string()),
  content: v.exactOptional(v.string()),
  Body: v.exactOptional(v.string()),
  readDate: v.exactOptional(v.union([v.string(), v.number(), v.null()])),
  ReadDate: v.exactOptional(v.union([v.string(), v.number(), v.null()])),
  sendDate: v.exactOptional(v.union([v.string(), v.number(), v.null()])),
  SendDate: v.exactOptional(v.union([v.string(), v.number(), v.null()])),
});

const wiadomosciOpenApiSchemaDefinitions = {
  UnknownRecord: unknownRecordSchema,
  WiadomosciMessage: wiadomosciMessageSchema,
  WiadomosciMessagesResponse: v.looseObject({
    data: v.array(wiadomosciMessageSchema),
  }),
  WiadomosciMessageResponse: v.looseObject({
    data: v.exactOptional(wiadomosciMessageSchema),
  }),
  WiadomosciUnreadMessagesCountResponse: v.looseObject({
    data: v.union([v.number(), v.string()]),
  }),
} as const;

const synergiaIdSchema: JsonObject = {
  oneOf: [{ type: "string" }, { type: "integer" }],
};

const binaryContentSchema: JsonObject = {
  type: "string",
  format: "binary",
};

const tagDescriptions = [
  {
    name: "account",
    description: "Account and profile data for the currently selected child.",
  },
  {
    name: "grades",
    description:
      "Grades, averages, categories, comments, and related grade views.",
  },
  {
    name: "attendance",
    description: "Attendance records and attendance-type dictionaries.",
  },
  {
    name: "timetable",
    description: "Timetable, calendar, and substitution endpoints.",
  },
  {
    name: "lessons",
    description: "Lessons, planned lessons, realizations, and attachments.",
  },
  {
    name: "notifications",
    description:
      "Lucky number, notification center, and push-configuration endpoints.",
  },
  {
    name: "justifications",
    description:
      "Justifications, parent-teacher conferences, and related administrative reads.",
  },
  {
    name: "system",
    description: "System metadata endpoints.",
  },
  {
    name: "auth",
    description: "Auth-prefixed photo, user, token, and classroom reads.",
  },
  {
    name: "messages",
    description: "Inbox, message metadata, receiver groups, and attachments.",
  },
  {
    name: "announcements",
    description: "School notices exposed by the child-scoped Synergia API.",
  },
  {
    name: "notes",
    description: "Behaviour notes and note categories.",
  },
  {
    name: "school",
    description: "School, class, subject, classroom, and user metadata.",
  },
  {
    name: "homework",
    description:
      "Homework lists, homework assignments, categories, and attachments.",
  },
] as const;

const synergiaOperations: readonly OpenApiOperationDefinition[] = [
  {
    path: "/Me",
    operationId: "getMe",
    summary: "Get the current child-scoped account context",
    tag: "account",
    response: { kind: "json", schemaName: "SynergiaMeResponse" },
  },
  {
    path: "/Grades",
    operationId: "getGrades",
    summary: "List standard grades",
    tag: "grades",
    response: { kind: "json", schemaName: "GradesResponse" },
  },
  {
    path: "/Grades/Averages",
    operationId: "getGradeAverages",
    summary: "List grade averages",
    tag: "grades",
    parameters: [
      {
        name: "subject",
        in: "query",
        required: false,
        description: "Optional subject identifier filter.",
        schema: synergiaIdSchema,
      },
    ],
    response: { kind: "json", schemaName: "GradeAveragesResponse" },
  },
  {
    path: "/Grades/Categories",
    operationId: "getGradeCategories",
    summary: "List grade categories",
    tag: "grades",
    response: { kind: "json", schemaName: "GradeCategoriesResponse" },
  },
  {
    path: "/Grades/Comments",
    operationId: "getGradeComments",
    summary: "List grade comments",
    tag: "grades",
    response: { kind: "json", schemaName: "GradeCommentsResponse" },
  },
  {
    path: "/BehaviourGrades",
    operationId: "getBehaviourGrades",
    summary: "List behaviour grades",
    tag: "grades",
    response: { kind: "json", schemaName: "BehaviourGradesResponse" },
  },
  {
    path: "/BehaviourGrades/Types",
    operationId: "getBehaviourGradeTypes",
    summary: "List behaviour grade types",
    tag: "grades",
    response: { kind: "json", schemaName: "BehaviourGradeTypesResponse" },
  },
  {
    path: "/BehaviourGrades/Points",
    operationId: "getBehaviourGradePoints",
    summary: "List behaviour grade points",
    tag: "grades",
    response: { kind: "json", schemaName: "BehaviourGradePointsResponse" },
  },
  {
    path: "/BehaviourGrades/Points/Categories",
    operationId: "getBehaviourPointCategories",
    summary: "List behaviour point categories",
    tag: "grades",
    response: { kind: "json", schemaName: "BehaviourPointCategoriesResponse" },
  },
  {
    path: "/BehaviourGrades/Points/Comments",
    operationId: "getBehaviourPointComments",
    summary: "List behaviour point comments",
    tag: "grades",
    response: { kind: "json", schemaName: "BehaviourPointCommentsResponse" },
  },
  {
    path: "/BehaviourGrades/SystemProposal",
    operationId: "getBehaviourSystemProposal",
    summary: "Get the behaviour system proposal",
    tag: "grades",
    response: { kind: "json", schemaName: "BehaviourSystemProposalResponse" },
  },
  {
    path: "/DescriptiveGrades",
    operationId: "getDescriptiveGrades",
    summary: "List descriptive grades",
    tag: "grades",
    response: { kind: "json", schemaName: "DescriptiveGradesResponse" },
  },
  {
    path: "/DescriptiveGrades/Comments",
    operationId: "getDescriptiveGradeComments",
    summary: "List descriptive grade comments",
    tag: "grades",
    response: { kind: "json", schemaName: "DescriptiveGradeCommentsResponse" },
  },
  {
    path: "/DescriptiveGrades/Skills",
    operationId: "getDescriptiveGradeSkills",
    summary: "List descriptive grade skills",
    tag: "grades",
    response: { kind: "json", schemaName: "DescriptiveGradeSkillsResponse" },
  },
  {
    path: "/DescriptiveGrades/Text",
    operationId: "getDescriptiveGradeText",
    summary: "List descriptive grade text entries",
    tag: "grades",
    parameters: [
      {
        name: "gradeGroupId",
        in: "query",
        required: false,
        description: "Optional descriptive grade group identifier filter.",
        schema: synergiaIdSchema,
      },
    ],
    response: { kind: "json", schemaName: "DescriptiveGradeTextResponse" },
  },
  {
    path: "/DescriptiveGrades/Text/Categories",
    operationId: "getDescriptiveGradeTextCategories",
    summary: "List descriptive grade text categories",
    tag: "grades",
    response: {
      kind: "json",
      schemaName: "DescriptiveGradeTextCategoriesResponse",
    },
  },
  {
    path: "/DescriptiveTextGrades",
    operationId: "getDescriptiveTextGrades",
    summary: "List descriptive text grades",
    tag: "grades",
    response: { kind: "json", schemaName: "DescriptiveTextGradesResponse" },
  },
  {
    path: "/DescriptiveTextGrades/Skills",
    operationId: "getDescriptiveTextGradeSkills",
    summary: "List descriptive text grade skills",
    tag: "grades",
    response: {
      kind: "json",
      schemaName: "DescriptiveTextGradeSkillsResponse",
    },
  },
  {
    path: "/PointGrades",
    operationId: "getPointGrades",
    summary: "List point-based grades",
    tag: "grades",
    parameters: [
      {
        name: "subject",
        in: "query",
        required: false,
        description: "Optional subject identifier filter.",
        schema: synergiaIdSchema,
      },
    ],
    response: { kind: "json", schemaName: "PointGradesResponse" },
  },
  {
    path: "/PointGrades/Averages",
    operationId: "getPointGradeAverages",
    summary: "List point-grade averages",
    tag: "grades",
    parameters: [
      {
        name: "subject",
        in: "query",
        required: false,
        description: "Optional subject identifier filter.",
        schema: synergiaIdSchema,
      },
    ],
    response: { kind: "json", schemaName: "PointGradeAveragesResponse" },
  },
  {
    path: "/PointGrades/Categories",
    operationId: "getPointGradeCategories",
    summary: "List point-grade categories",
    tag: "grades",
    response: { kind: "json", schemaName: "PointGradeCategoriesResponse" },
  },
  {
    path: "/PointGrades/Comments",
    operationId: "getPointGradeComments",
    summary: "List point-grade comments",
    tag: "grades",
    response: { kind: "json", schemaName: "PointGradeCommentsResponse" },
  },
  {
    path: "/TextGrades",
    operationId: "getTextGrades",
    summary: "List text grades",
    tag: "grades",
    response: { kind: "json", schemaName: "TextGradesResponse" },
  },
  {
    path: "/Attendances",
    operationId: "getAttendances",
    summary: "List attendance entries",
    tag: "attendance",
    response: { kind: "json", schemaName: "AttendancesResponse" },
  },
  {
    path: "/Attendances/Types",
    operationId: "getAttendanceTypes",
    summary: "List attendance types",
    tag: "attendance",
    response: { kind: "json", schemaName: "AttendanceTypesResponse" },
  },
  {
    path: "/Timetables",
    operationId: "getTimetables",
    summary: "Get timetable data for a week start or specific day",
    tag: "timetable",
    description:
      "Provide exactly one of `weekStart` or `day` to mirror the supported SDK calls.",
    parameters: [
      {
        name: "weekStart",
        in: "query",
        required: false,
        description: "Week start date in `YYYY-MM-DD` format.",
        schema: { type: "string", format: "date" },
      },
      {
        name: "day",
        in: "query",
        required: false,
        description: "Specific day in `YYYY-MM-DD` format.",
        schema: { type: "string", format: "date" },
      },
    ],
    response: { kind: "json", schemaName: "TimetablesResponse" },
  },
  {
    path: "/TimetableEntries/{entryId}",
    operationId: "getTimetableEntry",
    summary: "Get a timetable entry by id",
    tag: "timetable",
    parameters: [
      {
        name: "entryId",
        in: "path",
        required: true,
        description: "Timetable entry identifier.",
        schema: synergiaIdSchema,
      },
    ],
    response: { kind: "json", schemaName: "TimetableEntryResponse" },
  },
  {
    path: "/Calendars",
    operationId: "getCalendars",
    summary: "List calendar entries",
    tag: "timetable",
    response: { kind: "json", schemaName: "CalendarsResponse" },
  },
  {
    path: "/Calendars/ClassFreeDays",
    operationId: "getClassFreeDays",
    summary: "List class free days",
    tag: "timetable",
    response: { kind: "json", schemaName: "ClassFreeDaysResponse" },
  },
  {
    path: "/Calendars/ClassFreeDays/Types",
    operationId: "getClassFreeDayTypes",
    summary: "List class free-day types",
    tag: "timetable",
    response: { kind: "json", schemaName: "ClassFreeDayTypesResponse" },
  },
  {
    path: "/Calendars/SchoolFreeDays",
    operationId: "getSchoolFreeDays",
    summary: "List school free days",
    tag: "timetable",
    response: { kind: "json", schemaName: "SchoolFreeDaysResponse" },
  },
  {
    path: "/Calendars/TeacherFreeDays",
    operationId: "getTeacherFreeDays",
    summary: "List teacher free days",
    tag: "timetable",
    response: { kind: "json", schemaName: "TeacherFreeDaysResponse" },
  },
  {
    path: "/Calendars/Substitutions/{substitutionId}",
    operationId: "getSubstitution",
    summary: "Get a substitution by id",
    tag: "timetable",
    parameters: [
      {
        name: "substitutionId",
        in: "path",
        required: true,
        description: "Substitution identifier.",
        schema: synergiaIdSchema,
      },
    ],
    response: { kind: "json", schemaName: "SubstitutionResponse" },
  },
  {
    path: "/VirtualClasses",
    operationId: "getVirtualClasses",
    summary: "List virtual classes",
    tag: "timetable",
    response: { kind: "json", schemaName: "VirtualClassesResponse" },
  },
  {
    path: "/Lessons",
    operationId: "listLessons",
    summary: "List lessons",
    tag: "lessons",
    response: { kind: "json", schemaName: "LessonsResponse" },
  },
  {
    path: "/Lessons/{lessonId}",
    operationId: "getLesson",
    summary: "Get a lesson by id",
    tag: "lessons",
    parameters: [
      {
        name: "lessonId",
        in: "path",
        required: true,
        description: "Lesson identifier.",
        schema: synergiaIdSchema,
      },
    ],
    response: { kind: "json", schemaName: "LessonResponse" },
  },
  {
    path: "/PlannedLessons",
    operationId: "listPlannedLessons",
    summary: "List planned lessons",
    tag: "lessons",
    response: { kind: "json", schemaName: "PlannedLessonsResponse" },
  },
  {
    path: "/PlannedLessons/{plannedLessonId}",
    operationId: "getPlannedLesson",
    summary: "Get a planned lesson by id",
    tag: "lessons",
    parameters: [
      {
        name: "plannedLessonId",
        in: "path",
        required: true,
        description: "Planned lesson identifier.",
        schema: synergiaIdSchema,
      },
    ],
    response: { kind: "json", schemaName: "PlannedLessonResponse" },
  },
  {
    path: "/PlannedLessons/Attachment/{attachmentId}",
    operationId: "getPlannedLessonAttachment",
    summary: "Download a planned-lesson attachment",
    tag: "lessons",
    parameters: [
      {
        name: "attachmentId",
        in: "path",
        required: true,
        description: "Attachment identifier.",
        schema: synergiaIdSchema,
      },
    ],
    response: {
      kind: "binary",
      description:
        "Attachment payload. The live API may return a more specific content type.",
    },
  },
  {
    path: "/Realizations",
    operationId: "listRealizations",
    summary: "List lesson realizations",
    tag: "lessons",
    response: { kind: "json", schemaName: "RealizationsResponse" },
  },
  {
    path: "/Realizations/{realizationId}",
    operationId: "getRealization",
    summary: "Get a realization by id",
    tag: "lessons",
    parameters: [
      {
        name: "realizationId",
        in: "path",
        required: true,
        description: "Realization identifier.",
        schema: synergiaIdSchema,
      },
    ],
    response: { kind: "json", schemaName: "RealizationResponse" },
  },
  {
    path: "/LuckyNumbers",
    operationId: "getLuckyNumber",
    summary: "Get the lucky number",
    tag: "notifications",
    parameters: [
      {
        name: "forDay",
        in: "query",
        required: false,
        description: "Optional day in `YYYY-MM-DD` format.",
        schema: { type: "string", format: "date" },
      },
    ],
    response: { kind: "json", schemaName: "LuckyNumberResponse" },
  },
  {
    path: "/NotificationCenter",
    operationId: "getNotificationCenter",
    summary: "Get notification center data",
    tag: "notifications",
    response: { kind: "json", schemaName: "NotificationCenterResponse" },
  },
  {
    path: "/PushConfigurations",
    operationId: "getPushConfigurations",
    summary: "Get push notification configuration",
    tag: "notifications",
    response: { kind: "json", schemaName: "PushConfigurationsResponse" },
  },
  {
    path: "/Justifications",
    operationId: "listJustifications",
    summary: "List justifications",
    tag: "justifications",
    parameters: [
      {
        name: "dateFrom",
        in: "query",
        required: false,
        description: "Optional lower date bound in `YYYY-MM-DD` format.",
        schema: { type: "string", format: "date" },
      },
    ],
    response: { kind: "json", schemaName: "JustificationsResponse" },
  },
  {
    path: "/Justifications/{justificationId}",
    operationId: "getJustification",
    summary: "Get a justification by id",
    tag: "justifications",
    parameters: [
      {
        name: "justificationId",
        in: "path",
        required: true,
        description: "Justification identifier.",
        schema: synergiaIdSchema,
      },
    ],
    response: { kind: "json", schemaName: "JustificationResponse" },
  },
  {
    path: "/ParentTeacherConferences",
    operationId: "listParentTeacherConferences",
    summary: "List parent-teacher conferences",
    tag: "justifications",
    response: {
      kind: "json",
      schemaName: "ParentTeacherConferencesResponse",
    },
  },
  {
    path: "/SystemData",
    operationId: "getSystemData",
    summary: "Get system metadata",
    tag: "system",
    response: { kind: "json", schemaName: "SystemDataResponse" },
  },
  {
    path: "/Auth/Photos",
    operationId: "listAuthPhotos",
    summary: "List auth photo payloads",
    tag: "auth",
    response: { kind: "json", schemaName: "AuthPhotosResponse" },
  },
  {
    path: "/Auth/Photos/{photoId}",
    operationId: "getAuthPhoto",
    summary: "Get an auth photo by id",
    tag: "auth",
    parameters: [
      {
        name: "photoId",
        in: "path",
        required: true,
        description: "Photo identifier.",
        schema: synergiaIdSchema,
      },
    ],
    response: { kind: "json", schemaName: "AuthPhotoResponse" },
  },
  {
    path: "/Auth/UserInfo/{userId}",
    operationId: "getAuthUserInfo",
    summary: "Get auth-scoped user info by id",
    tag: "auth",
    parameters: [
      {
        name: "userId",
        in: "path",
        required: true,
        description: "User identifier.",
        schema: synergiaIdSchema,
      },
    ],
    response: { kind: "json", schemaName: "AuthUserInfoResponse" },
  },
  {
    path: "/Auth/TokenInfo",
    operationId: "getAuthTokenInfo",
    summary: "Get auth token information",
    tag: "auth",
    response: { kind: "json", schemaName: "AuthTokenInfoResponse" },
  },
  {
    path: "/Auth/Classrooms/{classroomId}",
    operationId: "getAuthClassroom",
    summary: "Get an auth-scoped classroom by id",
    tag: "auth",
    parameters: [
      {
        name: "classroomId",
        in: "path",
        required: true,
        description: "Classroom identifier.",
        schema: synergiaIdSchema,
      },
    ],
    response: { kind: "json", schemaName: "AuthClassroomResponse" },
  },
  {
    path: "/Messages",
    operationId: "listMessages",
    summary: "List messages",
    tag: "messages",
    parameters: [
      {
        name: "afterId",
        in: "query",
        required: false,
        description: "Return messages after this message id.",
        schema: synergiaIdSchema,
      },
      {
        name: "alternativeBody",
        in: "query",
        required: false,
        description: "Request the alternative message-body representation.",
        schema: { type: "boolean", default: true },
      },
      {
        name: "changeNewLine",
        in: "query",
        required: false,
        description: "Widget-style newline handling flag.",
        schema: { type: "integer", default: 1 },
      },
      {
        name: "getAllTypes",
        in: "query",
        required: false,
        description: "Request all message type categories.",
        schema: { type: "integer", default: 1 },
      },
      {
        name: "page",
        in: "query",
        required: false,
        description: "Message list page number.",
        schema: { type: "integer", default: 1 },
      },
      {
        name: "limit",
        in: "query",
        required: false,
        description: "Maximum messages to return for the page.",
        schema: { type: "integer", default: 300 },
      },
    ],
    response: { kind: "json", schemaName: "MessagesResponse" },
  },
  {
    path: "/Messages/{messageId}",
    operationId: "getMessage",
    summary: "Get a message by id",
    tag: "messages",
    parameters: [
      {
        name: "messageId",
        in: "path",
        required: true,
        description: "Message identifier.",
        schema: synergiaIdSchema,
      },
    ],
    response: { kind: "json", schemaName: "MessageResponse" },
  },
  {
    path: "/Messages/Unread",
    operationId: "getUnreadMessages",
    summary: "Get the unread message count",
    tag: "messages",
    response: { kind: "json", schemaName: "UnreadMessagesResponse" },
  },
  {
    path: "/Messages/User/{userId}",
    operationId: "listMessagesForUser",
    summary: "List messages for a specific user",
    tag: "messages",
    parameters: [
      {
        name: "userId",
        in: "path",
        required: true,
        description: "User identifier.",
        schema: synergiaIdSchema,
      },
    ],
    response: { kind: "json", schemaName: "MessagesResponse" },
  },
  {
    path: "/Messages/ReceiversGroup",
    operationId: "listMessageReceiverGroups",
    summary: "List message receiver groups",
    tag: "messages",
    response: { kind: "json", schemaName: "MessageReceiverGroupsResponse" },
  },
  {
    path: "/Messages/ReceiversGroup/{groupId}",
    operationId: "getMessageReceiverGroup",
    summary: "Get a message receiver group by id",
    tag: "messages",
    parameters: [
      {
        name: "groupId",
        in: "path",
        required: true,
        description: "Receiver-group identifier.",
        schema: synergiaIdSchema,
      },
    ],
    response: { kind: "json", schemaName: "MessageReceiverGroupResponse" },
  },
  {
    path: "/Messages/Attachment/{attachmentId}",
    operationId: "getMessageAttachment",
    summary: "Download a message attachment",
    tag: "messages",
    parameters: [
      {
        name: "attachmentId",
        in: "path",
        required: true,
        description: "Attachment identifier.",
        schema: synergiaIdSchema,
      },
    ],
    response: {
      kind: "binary",
      description:
        "Attachment payload. The live API may return a more specific content type.",
    },
  },
  {
    path: "/SchoolNotices",
    operationId: "listSchoolNotices",
    summary: "List school notices",
    tag: "announcements",
    response: { kind: "json", schemaName: "SchoolNoticesResponse" },
  },
  {
    path: "/SchoolNotices/{noticeId}",
    operationId: "getSchoolNotice",
    summary: "Get a school notice by id",
    tag: "announcements",
    parameters: [
      {
        name: "noticeId",
        in: "path",
        required: true,
        description: "School notice identifier.",
        schema: synergiaIdSchema,
      },
    ],
    response: { kind: "json", schemaName: "SchoolNoticeResponse" },
  },
  {
    path: "/Notes",
    operationId: "listNotes",
    summary: "List notes",
    tag: "notes",
    response: { kind: "json", schemaName: "NotesResponse" },
  },
  {
    path: "/Notes/{noteId}",
    operationId: "getNote",
    summary: "Get a note by id",
    tag: "notes",
    parameters: [
      {
        name: "noteId",
        in: "path",
        required: true,
        description: "Note identifier.",
        schema: synergiaIdSchema,
      },
    ],
    response: { kind: "json", schemaName: "NoteResponse" },
  },
  {
    path: "/Notes/Categories",
    operationId: "listNoteCategories",
    summary: "List note categories",
    tag: "notes",
    response: { kind: "json", schemaName: "NoteCategoriesResponse" },
  },
  {
    path: "/Schools",
    operationId: "getSchool",
    summary: "Get the current school metadata",
    tag: "school",
    response: { kind: "json", schemaName: "SchoolResponse" },
  },
  {
    path: "/Schools/{schoolId}",
    operationId: "getSchoolById",
    summary: "Get school metadata by id",
    tag: "school",
    parameters: [
      {
        name: "schoolId",
        in: "path",
        required: true,
        description: "School identifier.",
        schema: synergiaIdSchema,
      },
    ],
    response: { kind: "json", schemaName: "SchoolResponse" },
  },
  {
    path: "/Classes",
    operationId: "getClass",
    summary: "Get the current class metadata",
    tag: "school",
    response: { kind: "json", schemaName: "ClassResponse" },
  },
  {
    path: "/Classrooms/{classroomId}",
    operationId: "getClassroom",
    summary: "Get classroom metadata by id",
    tag: "school",
    parameters: [
      {
        name: "classroomId",
        in: "path",
        required: true,
        description: "Classroom identifier.",
        schema: synergiaIdSchema,
      },
    ],
    response: { kind: "json", schemaName: "ClassroomResponse" },
  },
  {
    path: "/Subjects",
    operationId: "listSubjects",
    summary: "List subjects",
    tag: "school",
    response: { kind: "json", schemaName: "SubjectsResponse" },
  },
  {
    path: "/Subjects/{subjectId}",
    operationId: "getSubject",
    summary: "Get subject metadata by id",
    tag: "school",
    parameters: [
      {
        name: "subjectId",
        in: "path",
        required: true,
        description: "Subject identifier.",
        schema: synergiaIdSchema,
      },
    ],
    response: { kind: "json", schemaName: "SubjectResponse" },
  },
  {
    path: "/Users",
    operationId: "listUsers",
    summary: "List users",
    tag: "school",
    response: { kind: "json", schemaName: "UsersResponse" },
  },
  {
    path: "/Users/{userId}",
    operationId: "getUser",
    summary: "Get user metadata by id",
    tag: "school",
    parameters: [
      {
        name: "userId",
        in: "path",
        required: true,
        description: "User identifier.",
        schema: synergiaIdSchema,
      },
    ],
    response: { kind: "json", schemaName: "UserResponse" },
  },
  {
    path: "/HomeWorks",
    operationId: "getHomeWorks",
    summary: "List homework entries",
    tag: "homework",
    response: { kind: "json", schemaName: "HomeWorksResponse" },
  },
  {
    path: "/HomeWorkAssignments",
    operationId: "getHomeworkAssignments",
    summary: "List homework assignments",
    tag: "homework",
    response: { kind: "json", schemaName: "HomeworkAssignmentsResponse" },
  },
  {
    path: "/HomeWorkAssignments/Attachment/{attachmentId}",
    operationId: "getHomeworkAssignmentAttachment",
    summary: "Download a homework-assignment attachment",
    tag: "homework",
    parameters: [
      {
        name: "attachmentId",
        in: "path",
        required: true,
        description: "Attachment identifier.",
        schema: synergiaIdSchema,
      },
    ],
    response: {
      kind: "binary",
      description:
        "Attachment payload. The live API may return a more specific content type.",
    },
  },
  {
    path: "/HomeWorks/Categories",
    operationId: "getHomeworkCategories",
    summary: "List homework categories",
    tag: "homework",
    response: { kind: "json", schemaName: "HomeworkCategoriesResponse" },
  },
] as const;

const wiadomosciTagDescriptions = [
  {
    name: "messages",
    description:
      "Portal-authenticated inbox reads exposed by wiadomosci.librus.pl.",
  },
] as const;

const wiadomosciOperations: readonly OpenApiOperationDefinition[] = [
  {
    path: "/inbox/messages",
    operationId: "listWiadomosciMessages",
    summary: "List inbox messages",
    tag: "messages",
    parameters: [
      {
        name: "page",
        in: "query",
        required: false,
        description: "Message list page number.",
        schema: { type: "integer", default: 1 },
      },
      {
        name: "limit",
        in: "query",
        required: false,
        description: "Maximum messages to return for the page.",
        schema: { type: "integer", default: 300 },
      },
      {
        name: "afterId",
        in: "query",
        required: false,
        description: "Return messages after this message id.",
        schema: synergiaIdSchema,
      },
    ],
    response: {
      kind: "json",
      schemaName: "WiadomosciMessagesResponse",
    },
  },
  {
    path: "/inbox/messages/{messageId}",
    operationId: "getWiadomosciMessage",
    summary: "Get an inbox message by id",
    tag: "messages",
    parameters: [
      {
        name: "messageId",
        in: "path",
        required: true,
        description: "Message identifier.",
        schema: synergiaIdSchema,
      },
    ],
    response: {
      kind: "json",
      schemaName: "WiadomosciMessageResponse",
    },
  },
  {
    path: "/inbox/unreadMessagesCount",
    operationId: "getWiadomosciUnreadMessagesCount",
    summary: "Get the unread inbox message count",
    tag: "messages",
    response: {
      kind: "json",
      schemaName: "WiadomosciUnreadMessagesCountResponse",
    },
  },
] as const;

function createJsonResponse(
  schemaName: string,
  description?: string,
): JsonObject {
  return {
    description: description ?? "Successful JSON response.",
    content: {
      "application/json": {
        schema: {
          $ref: `#/components/schemas/${schemaName}`,
        },
      },
    },
  };
}

function createBinaryResponse(description?: string): JsonObject {
  return {
    description: description ?? "Successful binary response.",
    content: {
      "application/octet-stream": {
        schema: binaryContentSchema,
      },
    },
  };
}

function createOperation(
  operation: OpenApiOperationDefinition,
  security: Array<Record<string, string[]>>,
): JsonObject {
  const result: JsonObject = {
    operationId: operation.operationId,
    summary: operation.summary,
    tags: [operation.tag],
    security,
    responses: {
      "200":
        operation.response.kind === "json"
          ? createJsonResponse(
              operation.response.schemaName,
              operation.response.description,
            )
          : createBinaryResponse(operation.response.description),
    },
  };

  if (operation.description) {
    result.description = operation.description;
  }

  if (operation.parameters?.length) {
    result.parameters = operation.parameters;
  }

  return result;
}

function createPaths(
  operations: readonly OpenApiOperationDefinition[],
  security: Array<Record<string, string[]>>,
): Record<string, JsonObject> {
  const paths: Record<string, JsonObject> = {};

  for (const operation of operations) {
    paths[operation.path] = {
      get: createOperation(operation, security),
    };
  }

  return paths;
}

function createSchemas(
  definitions: Record<
    string,
    v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>
  >,
): Record<string, unknown> {
  return toJsonSchemaDefs(definitions, {
    target: "openapi-3.0",
    overrideRef: (context) => `#/components/schemas/${context.referenceId}`,
  });
}

function generateSynergiaOpenApiDocument(
  options: GenerateOpenApiDocumentOptions = {},
  backend: "api_v3" | "gateway_api_20",
): LibrusOpenApiDocument {
  const isGateway = backend === "gateway_api_20";
  const title =
    options.title ??
    (isGateway
      ? "Librus Gateway API 2.0 (SDK-supported subset)"
      : "Librus Synergia API (SDK-supported subset)");
  const version = options.version ?? "0.0.0";
  const serverUrl =
    options.serverUrl ??
    (isGateway
      ? "https://synergia.librus.pl/gateway/api/2.0"
      : "https://api.librus.pl/3.0");
  const security = isGateway ? [{ cookieAuth: [] }] : [{ bearerAuth: [] }];

  return {
    openapi: "3.0.3",
    info: {
      title,
      version,
      description: isGateway
        ? "Best-effort OpenAPI document generated from the SDK's supported Gateway API 2.0 GET surface. Authentication starts with the school-issued login/password flow; this document covers the subsequent cookie-backed calls against synergia.librus.pl/gateway/api/2.0."
        : "Best-effort OpenAPI document generated from the SDK's supported child-scoped Synergia GET surface. Authentication starts on portal.librus.pl; this document covers the subsequent bearer-token calls against api.librus.pl/3.0.",
    },
    servers: [
      {
        url: serverUrl,
        description: isGateway
          ? "Cookie-backed Librus Gateway API 2.0 base URL."
          : "Child-scoped Librus Synergia API base URL.",
      },
    ],
    tags: [...tagDescriptions],
    security,
    paths: createPaths(synergiaOperations, security),
    components: {
      securitySchemes: isGateway
        ? {
            cookieAuth: {
              type: "apiKey",
              in: "header",
              name: "Cookie",
              description:
                "Cookie-backed Synergia session established by the Gateway API 2.0 login flow.",
            },
          }
        : {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              description:
                "Child-scoped bearer token returned by the Librus family portal flow.",
            },
          },
      schemas: createSchemas(synergiaOpenApiSchemaDefinitions),
    },
  };
}

export function generateOpenApiDocument(
  options: GenerateOpenApiDocumentOptions = {},
): LibrusOpenApiDocument {
  return generateSynergiaOpenApiDocument(options, "api_v3");
}

export function generateGatewayApi20OpenApiDocument(
  options: GenerateOpenApiDocumentOptions = {},
): LibrusOpenApiDocument {
  return generateSynergiaOpenApiDocument(options, "gateway_api_20");
}

export function generateWiadomosciOpenApiDocument(
  options: GenerateOpenApiDocumentOptions = {},
): LibrusOpenApiDocument {
  const title = options.title ?? "Librus Wiadomosci API (SDK-supported subset)";
  const version = options.version ?? "0.0.0";
  const serverUrl = options.serverUrl ?? "https://wiadomosci.librus.pl/api";
  const security = [{ cookieAuth: [] }];

  return {
    openapi: "3.0.3",
    info: {
      title,
      version,
      description:
        "Best-effort OpenAPI document generated from the SDK's supported wiadomosci.librus.pl inbox API surface. Authentication starts with the Portal/Synergia handoff; this document covers the subsequent cookie-backed JSON calls against wiadomosci.librus.pl/api.",
    },
    servers: [
      {
        url: serverUrl,
        description: "Portal-authenticated Librus Wiadomosci API base URL.",
      },
    ],
    tags: [...wiadomosciTagDescriptions],
    security,
    paths: createPaths(wiadomosciOperations, security),
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "header",
          name: "Cookie",
          description:
            "Cookie-backed wiadomosci.librus.pl session established by the Portal/Synergia handoff.",
        },
      },
      schemas: createSchemas(wiadomosciOpenApiSchemaDefinitions),
    },
  };
}
