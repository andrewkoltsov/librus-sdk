import type { FetchLike } from "../models/common.js";
import type {
  SchoolNoticeResponse,
  SchoolNoticesResponse,
} from "../models/synergia/announcements.js";
import type {
  AttendanceTypesResponse,
  AttendancesResponse,
} from "../models/synergia/attendance.js";
import type {
  AuthClassroomResponse,
  AuthPhotoResponse,
  AuthPhotosResponse,
  AuthTokenInfoResponse,
  AuthUserInfoResponse,
} from "../models/synergia/auth.js";
import type {
  BehaviourGradePointsResponse,
  BehaviourGradeTypesResponse,
  BehaviourGradesResponse,
  BehaviourPointCategoriesResponse,
  BehaviourPointCommentsResponse,
  BehaviourSystemProposalResponse,
  DescriptiveGradeCommentsResponse,
  DescriptiveGradeSkillsResponse,
  DescriptiveGradeTextCategoriesResponse,
  DescriptiveGradeTextResponse,
  DescriptiveGradesResponse,
  DescriptiveTextGradesResponse,
  DescriptiveTextGradeSkillsResponse,
  GradeAveragesResponse,
  GradeCategoriesResponse,
  GradeCommentsResponse,
  GradesResponse,
  PointGradeAveragesResponse,
  PointGradeCategoriesResponse,
  PointGradeCommentsResponse,
  PointGradesResponse,
  TextGradesResponse,
} from "../models/synergia/grades.js";
import type { SynergiaBinaryResult } from "../models/synergia/common.js";
import type {
  HomeworkCategoriesResponse,
  HomeWorksResponse,
} from "../models/synergia/homework.js";
import type { HomeworkAssignmentsResponse } from "../models/synergia/homeworkAssignments.js";
import type {
  JustificationResponse,
  JustificationsResponse,
  ListJustificationsOptions,
  ParentTeacherConferencesResponse,
  SystemDataResponse,
} from "../models/synergia/justifications.js";
import type {
  LessonResponse,
  LessonsResponse,
  PlannedLessonResponse,
  PlannedLessonsResponse,
  RealizationResponse,
  RealizationsResponse,
} from "../models/synergia/lessons.js";
import type { SynergiaMeResponse } from "../models/synergia/me.js";
import type {
  ListMessagesOptions,
  MessageReceiverGroupResponse,
  MessageReceiverGroupsResponse,
  MessageResponse,
  MessagesResponse,
  UnreadMessagesResponse,
} from "../models/synergia/messages.js";
import type {
  NoteCategoriesResponse,
  NoteResponse,
  NotesResponse,
} from "../models/synergia/notes.js";
import type {
  LuckyNumberResponse,
  NotificationCenterResponse,
  PushConfigurationsResponse,
} from "../models/synergia/notifications.js";
import type {
  ClassResponse,
  ClassroomResponse,
  SchoolResponse,
  SubjectResponse,
  SubjectsResponse,
  UserResponse,
  UsersResponse,
} from "../models/synergia/school.js";
import type {
  CalendarsResponse,
  ClassFreeDaysResponse,
  ClassFreeDayTypesResponse,
  SchoolFreeDaysResponse,
  SubstitutionResponse,
  TeacherFreeDaysResponse,
  TimetableEntryResponse,
  TimetablesResponse,
  VirtualClassesResponse,
} from "../models/synergia/timetable.js";
import {
  schoolNoticeResponseSchema,
  schoolNoticesResponseSchema,
} from "../validation/synergia/announcements.js";
import {
  attendanceTypesResponseSchema,
  attendancesResponseSchema,
} from "../validation/synergia/attendance.js";
import {
  authClassroomResponseSchema,
  authPhotoResponseSchema,
  authPhotosResponseSchema,
  authTokenInfoResponseSchema,
  authUserInfoResponseSchema,
} from "../validation/synergia/auth.js";
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
} from "../validation/synergia/grades.js";
import {
  homeWorksResponseSchema,
  homeworkCategoriesResponseSchema,
} from "../validation/synergia/homework.js";
import { homeworkAssignmentsResponseSchema } from "../validation/synergia/homeworkAssignments.js";
import {
  justificationResponseSchema,
  justificationsResponseSchema,
  parentTeacherConferencesResponseSchema,
  systemDataResponseSchema,
} from "../validation/synergia/justifications.js";
import {
  lessonResponseSchema,
  lessonsResponseSchema,
  plannedLessonResponseSchema,
  plannedLessonsResponseSchema,
  realizationResponseSchema,
  realizationsResponseSchema,
} from "../validation/synergia/lessons.js";
import { synergiaMeResponseSchema } from "../validation/synergia/me.js";
import {
  messageReceiverGroupResponseSchema,
  messageReceiverGroupsResponseSchema,
  messageResponseSchema,
  messagesResponseSchema,
  unreadMessagesResponseSchema,
} from "../validation/synergia/messages.js";
import {
  noteCategoriesResponseSchema,
  noteResponseSchema,
  notesResponseSchema,
} from "../validation/synergia/notes.js";
import {
  luckyNumberResponseSchema,
  notificationCenterResponseSchema,
  pushConfigurationsResponseSchema,
} from "../validation/synergia/notifications.js";
import {
  classResponseSchema,
  classroomResponseSchema,
  schoolResponseSchema,
  subjectResponseSchema,
  subjectsResponseSchema,
  userResponseSchema,
  usersResponseSchema,
} from "../validation/synergia/school.js";
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
} from "../validation/synergia/timetable.js";
import type { BaseIssue, BaseSchema, InferOutput } from "valibot";

import {
  getBinary as requestGetBinary,
  getJson as requestGetJson,
} from "./request.js";
import type { SynergiaRequestOptions } from "./request.js";

export interface SynergiaApiClientOptions {
  fetch?: FetchLike;
  apiBaseUrl?: string;
}

type SynergiaId = string | number;

export class SynergiaApiClient {
  private readonly fetchImpl: FetchLike;
  private readonly apiBaseUrl: string;
  private readonly accessToken: string;

  constructor(accessToken: string, options: SynergiaApiClientOptions = {}) {
    this.accessToken = accessToken;
    this.fetchImpl = options.fetch ?? fetch;
    this.apiBaseUrl = options.apiBaseUrl ?? "https://api.librus.pl/3.0";
  }

  private getJson<
    TSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
  >(
    path: string,
    schema: TSchema,
    options: SynergiaRequestOptions = {},
  ): Promise<InferOutput<TSchema>> {
    return requestGetJson(
      this.fetchImpl,
      this.accessToken,
      this.apiBaseUrl,
      path,
      schema,
      options,
    );
  }

  private getBinary(
    path: string,
    options: SynergiaRequestOptions = {},
  ): Promise<SynergiaBinaryResult> {
    return requestGetBinary(
      this.fetchImpl,
      this.accessToken,
      this.apiBaseUrl,
      path,
      options,
    );
  }

  getMe(): Promise<SynergiaMeResponse> {
    return this.getJson("/Me", synergiaMeResponseSchema);
  }

  getGrades(): Promise<GradesResponse> {
    return this.getJson("/Grades", gradesResponseSchema);
  }

  getGradeAverages(subjectId?: SynergiaId): Promise<GradeAveragesResponse> {
    return this.getJson("/Grades/Averages", gradeAveragesResponseSchema, {
      query: { subject: subjectId },
    });
  }

  getGradeCategories(): Promise<GradeCategoriesResponse> {
    return this.getJson("/Grades/Categories", gradeCategoriesResponseSchema);
  }

  getGradeComments(): Promise<GradeCommentsResponse> {
    return this.getJson("/Grades/Comments", gradeCommentsResponseSchema);
  }

  getBehaviourGrades(): Promise<BehaviourGradesResponse> {
    return this.getJson("/BehaviourGrades", behaviourGradesResponseSchema);
  }

  getBehaviourGradeTypes(): Promise<BehaviourGradeTypesResponse> {
    return this.getJson(
      "/BehaviourGrades/Types",
      behaviourGradeTypesResponseSchema,
    );
  }

  getBehaviourGradePoints(): Promise<BehaviourGradePointsResponse> {
    return this.getJson(
      "/BehaviourGrades/Points",
      behaviourGradePointsResponseSchema,
    );
  }

  getBehaviourPointCategories(): Promise<BehaviourPointCategoriesResponse> {
    return this.getJson(
      "/BehaviourGrades/Points/Categories",
      behaviourPointCategoriesResponseSchema,
    );
  }

  getBehaviourPointComments(): Promise<BehaviourPointCommentsResponse> {
    return this.getJson(
      "/BehaviourGrades/Points/Comments",
      behaviourPointCommentsResponseSchema,
    );
  }

  getBehaviourSystemProposal(): Promise<BehaviourSystemProposalResponse> {
    return this.getJson(
      "/BehaviourGrades/SystemProposal",
      behaviourSystemProposalResponseSchema,
    );
  }

  getDescriptiveGrades(): Promise<DescriptiveGradesResponse> {
    return this.getJson("/DescriptiveGrades", descriptiveGradesResponseSchema);
  }

  getDescriptiveGradeComments(): Promise<DescriptiveGradeCommentsResponse> {
    return this.getJson(
      "/DescriptiveGrades/Comments",
      descriptiveGradeCommentsResponseSchema,
    );
  }

  getDescriptiveGradeSkills(): Promise<DescriptiveGradeSkillsResponse> {
    return this.getJson(
      "/DescriptiveGrades/Skills",
      descriptiveGradeSkillsResponseSchema,
    );
  }

  getDescriptiveGradeText(
    gradeGroupId?: SynergiaId,
  ): Promise<DescriptiveGradeTextResponse> {
    return this.getJson(
      "/DescriptiveGrades/Text",
      descriptiveGradeTextResponseSchema,
      {
        query: { gradeGroupId },
      },
    );
  }

  getDescriptiveGradeTextCategories(): Promise<DescriptiveGradeTextCategoriesResponse> {
    return this.getJson(
      "/DescriptiveGrades/Text/Categories",
      descriptiveGradeTextCategoriesResponseSchema,
    );
  }

  getDescriptiveTextGrades(): Promise<DescriptiveTextGradesResponse> {
    return this.getJson(
      "/DescriptiveTextGrades",
      descriptiveTextGradesResponseSchema,
    );
  }

  getDescriptiveTextGradeSkills(): Promise<DescriptiveTextGradeSkillsResponse> {
    return this.getJson(
      "/DescriptiveTextGrades/Skills",
      descriptiveTextGradeSkillsResponseSchema,
    );
  }

  getPointGrades(subjectId?: SynergiaId): Promise<PointGradesResponse> {
    return this.getJson("/PointGrades", pointGradesResponseSchema, {
      query: { subject: subjectId },
    });
  }

  getPointGradeAverages(
    subjectId?: SynergiaId,
  ): Promise<PointGradeAveragesResponse> {
    return this.getJson(
      "/PointGrades/Averages",
      pointGradeAveragesResponseSchema,
      {
        query: { subject: subjectId },
      },
    );
  }

  getPointGradeCategories(): Promise<PointGradeCategoriesResponse> {
    return this.getJson(
      "/PointGrades/Categories",
      pointGradeCategoriesResponseSchema,
    );
  }

  getPointGradeComments(): Promise<PointGradeCommentsResponse> {
    return this.getJson(
      "/PointGrades/Comments",
      pointGradeCommentsResponseSchema,
    );
  }

  getTextGrades(): Promise<TextGradesResponse> {
    return this.getJson("/TextGrades", textGradesResponseSchema);
  }

  getAttendances(): Promise<AttendancesResponse> {
    return this.getJson("/Attendances", attendancesResponseSchema);
  }

  getAttendanceTypes(): Promise<AttendanceTypesResponse> {
    return this.getJson("/Attendances/Types", attendanceTypesResponseSchema);
  }

  getTimetableWeek(weekStart: string): Promise<TimetablesResponse> {
    return this.getJson("/Timetables", timetablesResponseSchema, {
      query: { weekStart },
    });
  }

  getTimetableDay(day: string): Promise<TimetablesResponse> {
    return this.getJson("/Timetables", timetablesResponseSchema, {
      query: { day },
    });
  }

  getTimetableEntry(id: SynergiaId): Promise<TimetableEntryResponse> {
    return this.getJson(
      `/TimetableEntries/${encodeURIComponent(String(id))}`,
      timetableEntryResponseSchema,
    );
  }

  getCalendars(): Promise<CalendarsResponse> {
    return this.getJson("/Calendars", calendarsResponseSchema);
  }

  getClassFreeDays(): Promise<ClassFreeDaysResponse> {
    return this.getJson(
      "/Calendars/ClassFreeDays",
      classFreeDaysResponseSchema,
    );
  }

  getClassFreeDayTypes(): Promise<ClassFreeDayTypesResponse> {
    return this.getJson(
      "/Calendars/ClassFreeDays/Types",
      classFreeDayTypesResponseSchema,
    );
  }

  getSchoolFreeDays(): Promise<SchoolFreeDaysResponse> {
    return this.getJson(
      "/Calendars/SchoolFreeDays",
      schoolFreeDaysResponseSchema,
    );
  }

  getTeacherFreeDays(): Promise<TeacherFreeDaysResponse> {
    return this.getJson(
      "/Calendars/TeacherFreeDays",
      teacherFreeDaysResponseSchema,
    );
  }

  getSubstitution(id: SynergiaId): Promise<SubstitutionResponse> {
    return this.getJson(
      `/Calendars/Substitutions/${encodeURIComponent(String(id))}`,
      substitutionResponseSchema,
    );
  }

  getVirtualClasses(): Promise<VirtualClassesResponse> {
    return this.getJson("/VirtualClasses", virtualClassesResponseSchema);
  }

  listLessons(): Promise<LessonsResponse> {
    return this.getJson("/Lessons", lessonsResponseSchema);
  }

  getLesson(id: SynergiaId): Promise<LessonResponse> {
    return this.getJson(
      `/Lessons/${encodeURIComponent(String(id))}`,
      lessonResponseSchema,
    );
  }

  listPlannedLessons(): Promise<PlannedLessonsResponse> {
    return this.getJson("/PlannedLessons", plannedLessonsResponseSchema);
  }

  getPlannedLesson(id: SynergiaId): Promise<PlannedLessonResponse> {
    return this.getJson(
      `/PlannedLessons/${encodeURIComponent(String(id))}`,
      plannedLessonResponseSchema,
    );
  }

  getPlannedLessonAttachment(id: SynergiaId): Promise<SynergiaBinaryResult> {
    return this.getBinary(
      `/PlannedLessons/Attachment/${encodeURIComponent(String(id))}`,
    );
  }

  listRealizations(): Promise<RealizationsResponse> {
    return this.getJson("/Realizations", realizationsResponseSchema);
  }

  getRealization(id: SynergiaId): Promise<RealizationResponse> {
    return this.getJson(
      `/Realizations/${encodeURIComponent(String(id))}`,
      realizationResponseSchema,
    );
  }

  getLuckyNumber(forDay?: string): Promise<LuckyNumberResponse> {
    return this.getJson("/LuckyNumbers", luckyNumberResponseSchema, {
      query: { forDay },
    });
  }

  getNotificationCenter(): Promise<NotificationCenterResponse> {
    return this.getJson(
      "/NotificationCenter",
      notificationCenterResponseSchema,
    );
  }

  getPushConfigurations(): Promise<PushConfigurationsResponse> {
    return this.getJson(
      "/PushConfigurations",
      pushConfigurationsResponseSchema,
    );
  }

  listJustifications(
    options: ListJustificationsOptions = {},
  ): Promise<JustificationsResponse> {
    return this.getJson("/Justifications", justificationsResponseSchema, {
      query: { dateFrom: options.dateFrom },
    });
  }

  getJustification(id: SynergiaId): Promise<JustificationResponse> {
    return this.getJson(
      `/Justifications/${encodeURIComponent(String(id))}`,
      justificationResponseSchema,
    );
  }

  listParentTeacherConferences(): Promise<ParentTeacherConferencesResponse> {
    return this.getJson(
      "/ParentTeacherConferences",
      parentTeacherConferencesResponseSchema,
    );
  }

  getSystemData(): Promise<SystemDataResponse> {
    return this.getJson("/SystemData", systemDataResponseSchema);
  }

  listAuthPhotos(): Promise<AuthPhotosResponse> {
    return this.getJson("/Auth/Photos", authPhotosResponseSchema);
  }

  getAuthPhoto(id: SynergiaId): Promise<AuthPhotoResponse> {
    return this.getJson(
      `/Auth/Photos/${encodeURIComponent(String(id))}`,
      authPhotoResponseSchema,
    );
  }

  getAuthUserInfo(id: SynergiaId): Promise<AuthUserInfoResponse> {
    return this.getJson(
      `/Auth/UserInfo/${encodeURIComponent(String(id))}`,
      authUserInfoResponseSchema,
    );
  }

  getAuthTokenInfo(): Promise<AuthTokenInfoResponse> {
    return this.getJson("/Auth/TokenInfo", authTokenInfoResponseSchema);
  }

  getAuthClassroom(id: SynergiaId): Promise<AuthClassroomResponse> {
    return this.getJson(
      `/Auth/Classrooms/${encodeURIComponent(String(id))}`,
      authClassroomResponseSchema,
    );
  }

  listMessages(options: ListMessagesOptions = {}): Promise<MessagesResponse> {
    const { afterId, alternativeBody = true, changeNewLine = 1 } = options;

    return this.getJson("/Messages", messagesResponseSchema, {
      query: {
        afterId,
        alternativeBody,
        changeNewLine,
      },
    });
  }

  getMessage(id: SynergiaId): Promise<MessageResponse> {
    return this.getJson(
      `/Messages/${encodeURIComponent(String(id))}`,
      messageResponseSchema,
    );
  }

  getUnreadMessages(): Promise<UnreadMessagesResponse> {
    return this.getJson("/Messages/Unread", unreadMessagesResponseSchema);
  }

  listMessagesForUser(userId: SynergiaId): Promise<MessagesResponse> {
    return this.getJson(
      `/Messages/User/${encodeURIComponent(String(userId))}`,
      messagesResponseSchema,
    );
  }

  listMessageReceiverGroups(): Promise<MessageReceiverGroupsResponse> {
    return this.getJson(
      "/Messages/ReceiversGroup",
      messageReceiverGroupsResponseSchema,
    );
  }

  getMessageReceiverGroup(
    id: SynergiaId,
  ): Promise<MessageReceiverGroupResponse> {
    return this.getJson(
      `/Messages/ReceiversGroup/${encodeURIComponent(String(id))}`,
      messageReceiverGroupResponseSchema,
    );
  }

  getMessageAttachment(id: SynergiaId): Promise<SynergiaBinaryResult> {
    return this.getBinary(
      `/Messages/Attachment/${encodeURIComponent(String(id))}`,
    );
  }

  listSchoolNotices(): Promise<SchoolNoticesResponse> {
    return this.getJson("/SchoolNotices", schoolNoticesResponseSchema);
  }

  getSchoolNotice(id: SynergiaId): Promise<SchoolNoticeResponse> {
    return this.getJson(
      `/SchoolNotices/${encodeURIComponent(String(id))}`,
      schoolNoticeResponseSchema,
    );
  }

  listNotes(): Promise<NotesResponse> {
    return this.getJson("/Notes", notesResponseSchema);
  }

  getNote(id: SynergiaId): Promise<NoteResponse> {
    return this.getJson(
      `/Notes/${encodeURIComponent(String(id))}`,
      noteResponseSchema,
    );
  }

  listNoteCategories(): Promise<NoteCategoriesResponse> {
    return this.getJson("/Notes/Categories", noteCategoriesResponseSchema);
  }

  getSchool(): Promise<SchoolResponse> {
    return this.getJson("/Schools", schoolResponseSchema);
  }

  getSchoolById(id: SynergiaId): Promise<SchoolResponse> {
    return this.getJson(
      `/Schools/${encodeURIComponent(String(id))}`,
      schoolResponseSchema,
    );
  }

  getClass(): Promise<ClassResponse> {
    return this.getJson("/Classes", classResponseSchema);
  }

  getClassroom(id: SynergiaId): Promise<ClassroomResponse> {
    return this.getJson(
      `/Classrooms/${encodeURIComponent(String(id))}`,
      classroomResponseSchema,
    );
  }

  listSubjects(): Promise<SubjectsResponse> {
    return this.getJson("/Subjects", subjectsResponseSchema);
  }

  getSubject(id: SynergiaId): Promise<SubjectResponse> {
    return this.getJson(
      `/Subjects/${encodeURIComponent(String(id))}`,
      subjectResponseSchema,
    );
  }

  listUsers(): Promise<UsersResponse> {
    return this.getJson("/Users", usersResponseSchema);
  }

  getUser(id: SynergiaId): Promise<UserResponse> {
    return this.getJson(
      `/Users/${encodeURIComponent(String(id))}`,
      userResponseSchema,
    );
  }

  getHomeWorks(): Promise<HomeWorksResponse> {
    return this.getJson("/HomeWorks", homeWorksResponseSchema);
  }

  getHomeworkAssignments(): Promise<HomeworkAssignmentsResponse> {
    return this.getJson(
      "/HomeWorkAssignments",
      homeworkAssignmentsResponseSchema,
    );
  }

  getHomeworkAssignmentAttachment(
    id: SynergiaId,
  ): Promise<SynergiaBinaryResult> {
    return this.getBinary(
      `/HomeWorkAssignments/Attachment/${encodeURIComponent(String(id))}`,
    );
  }

  getHomeworkCategories(): Promise<HomeworkCategoriesResponse> {
    return this.getJson(
      "/HomeWorks/Categories",
      homeworkCategoriesResponseSchema,
    );
  }
}
