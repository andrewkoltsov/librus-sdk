import { accessSync, constants } from "node:fs";
import { fileURLToPath } from "node:url";

import { selectTargetChildren, summarizeChild } from "./children.mjs";
import { serializeError } from "./errors.mjs";

const sdkEntryUrl = new URL("../../../dist/sdk/index.js", import.meta.url);
const sdkEntryPath = fileURLToPath(sdkEntryUrl);

function assertBuiltSdk() {
  try {
    accessSync(sdkEntryPath, constants.R_OK);
  } catch {
    throw new Error(
      `Missing built SDK artifact at ${sdkEntryPath}. Run "npm run build" first.`,
    );
  }
}

async function loadSdkModule() {
  assertBuiltSdk();
  return import(sdkEntryUrl.href);
}

async function runCheck(load, summarize) {
  try {
    const payload = await load();

    return {
      ok: true,
      ...summarize(payload),
    };
  } catch (error) {
    return {
      ok: false,
      error: serializeError(error),
    };
  }
}

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getCurrentDay() {
  return formatLocalDate(new Date());
}

function getCurrentWeekStart() {
  const date = new Date();
  const weekStart = new Date(date);
  const day = weekStart.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  weekStart.setDate(weekStart.getDate() + diff);

  return formatLocalDate(weekStart);
}

function summarizeArrayResponse(payload, key) {
  return {
    count: Array.isArray(payload[key]) ? payload[key].length : 0,
  };
}

function summarizeCountResponse(payload, key) {
  return {
    count: typeof payload[key] === "number" ? payload[key] : 0,
  };
}

function summarizeArrayOrStatusResponse(payload, key) {
  if (Array.isArray(payload[key])) {
    return {
      count: payload[key].length,
    };
  }

  if (typeof payload.Status === "string") {
    return {
      status: payload.Status,
    };
  }

  return {
    count: 0,
  };
}

function summarizeObjectResponse(payload, key) {
  return {
    keys:
      payload[key] && typeof payload[key] === "object"
        ? Object.keys(payload[key])
        : [],
  };
}

function summarizeTimetableResponse(payload) {
  const timetable = payload.Timetable;

  if (!timetable || typeof timetable !== "object" || Array.isArray(timetable)) {
    return {
      count: 0,
      days: 0,
    };
  }

  let count = 0;

  for (const value of Object.values(timetable)) {
    if (!Array.isArray(value)) {
      continue;
    }

    for (const slot of value) {
      if (Array.isArray(slot)) {
        count += slot.length;
      }
    }
  }

  return {
    count,
    days: Object.keys(timetable).length,
  };
}

function summarizeBehaviourSystemProposal(payload) {
  const proposal = payload.BehaviourGradesSystemProposal;

  if (proposal === null) {
    return {
      kind: "null",
      count: 0,
    };
  }

  if (Array.isArray(proposal)) {
    return {
      kind: "array",
      count: proposal.length,
    };
  }

  return {
    kind: typeof proposal,
    count:
      proposal && typeof proposal === "object"
        ? Object.keys(proposal).length
        : 0,
  };
}

function summarizeBinaryResponse(payload) {
  return {
    bytes: payload.data.byteLength,
    contentType: payload.contentType,
    contentDisposition: payload.contentDisposition,
  };
}

function arrayCheck(name, load, key) {
  return {
    name,
    load,
    summarize: (payload) => summarizeArrayResponse(payload, key),
  };
}

function countCheck(name, load, key) {
  return {
    name,
    load,
    summarize: (payload) => summarizeCountResponse(payload, key),
  };
}

function arrayOrStatusCheck(name, load, key) {
  return {
    name,
    load,
    summarize: (payload) => summarizeArrayOrStatusResponse(payload, key),
  };
}

function objectCheck(name, load, key) {
  return {
    name,
    load,
    summarize: (payload) => summarizeObjectResponse(payload, key),
  };
}

function timetableCheck(name, load) {
  return {
    name,
    load,
    summarize: summarizeTimetableResponse,
  };
}

function extractAttachmentIdCandidate(value) {
  if (typeof value === "string" || typeof value === "number") {
    return value;
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const candidate = extractAttachmentIdCandidate(item);

      if (candidate !== null) {
        return candidate;
      }
    }

    return null;
  }

  if ("Id" in value) {
    const { Id } = value;

    if (typeof Id === "string" || typeof Id === "number") {
      return Id;
    }
  }

  for (const nested of Object.values(value)) {
    const candidate = extractAttachmentIdCandidate(nested);

    if (candidate !== null) {
      return candidate;
    }
  }

  return null;
}

function findEntityId(items) {
  if (!Array.isArray(items)) {
    return null;
  }

  for (const item of items) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      continue;
    }

    if (!("Id" in item)) {
      continue;
    }

    const { Id } = item;

    if (typeof Id === "string" || typeof Id === "number") {
      return Id;
    }
  }

  return null;
}

function findTimetableEntryId(timetable) {
  if (!timetable || typeof timetable !== "object" || Array.isArray(timetable)) {
    return null;
  }

  for (const value of Object.values(timetable)) {
    if (!Array.isArray(value)) {
      continue;
    }

    for (const slot of value) {
      if (!Array.isArray(slot)) {
        continue;
      }

      for (const entry of slot) {
        if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
          continue;
        }

        const entryId = entry.TimetableEntry?.Id ?? entry.Id;

        if (typeof entryId === "string" || typeof entryId === "number") {
          return entryId;
        }
      }
    }
  }

  return null;
}

function findHomeworkAssignmentAttachmentId(assignments) {
  if (!Array.isArray(assignments)) {
    return null;
  }

  for (const assignment of assignments) {
    if (
      !assignment ||
      typeof assignment !== "object" ||
      Array.isArray(assignment)
    ) {
      continue;
    }

    for (const [key, value] of Object.entries(assignment)) {
      if (!/attachment/i.test(key)) {
        continue;
      }

      const candidate = extractAttachmentIdCandidate(value);

      if (candidate !== null) {
        return candidate;
      }
    }
  }

  return null;
}

async function runHomeworkAssignmentAttachmentCheck(api) {
  try {
    const assignments = await api.getHomeworkAssignments();
    const attachmentId = findHomeworkAssignmentAttachmentId(
      assignments.HomeWorkAssignments,
    );

    if (attachmentId === null) {
      return {
        ok: true,
        skipped: true,
        reason: "No homework assignment attachment id found in live payload.",
      };
    }

    const payload = await api.getHomeworkAssignmentAttachment(attachmentId);

    return {
      ok: true,
      attachmentId: String(attachmentId),
      ...summarizeBinaryResponse(payload),
    };
  } catch (error) {
    return {
      ok: false,
      error: serializeError(error),
    };
  }
}

async function runBehaviourSystemProposalCheck(api) {
  try {
    const payload = await api.getBehaviourSystemProposal();

    return {
      ok: true,
      ...summarizeBehaviourSystemProposal(payload),
    };
  } catch (error) {
    if (
      error instanceof Error &&
      "details" in error &&
      error.details &&
      typeof error.details === "object" &&
      "status" in error.details &&
      error.details.status === 403
    ) {
      return {
        ok: true,
        skipped: true,
        reason: "System proposal view is disabled for parent accounts.",
      };
    }

    return {
      ok: false,
      error: serializeError(error),
    };
  }
}

async function runTimetableEntryCheck(api) {
  try {
    const payload = await api.getTimetableDay(getCurrentDay());
    const entryId = findTimetableEntryId(payload.Timetable);

    if (entryId === null) {
      return {
        ok: true,
        skipped: true,
        reason: "No timetable entry id found in the current day payload.",
      };
    }

    const entry = await api.getTimetableEntry(entryId);

    return {
      ok: true,
      entryId: String(entryId),
      keys: Object.keys(entry.TimetableEntry ?? {}),
    };
  } catch (error) {
    return {
      ok: false,
      error: serializeError(error),
    };
  }
}

async function runMessageDetailCheck(api) {
  try {
    const payload = await api.listMessages();
    const messageId = findEntityId(payload.Messages);

    if (messageId === null) {
      return {
        ok: true,
        skipped: true,
        reason: "No message id found in the live messages payload.",
      };
    }

    const message = await api.getMessage(messageId);

    return {
      ok: true,
      messageId: String(messageId),
      keys: Object.keys(message.Message ?? {}),
    };
  } catch (error) {
    return {
      ok: false,
      error: serializeError(error),
    };
  }
}

async function runMessageReceiverGroupDetailCheck(api) {
  try {
    const payload = await api.listMessageReceiverGroups();
    const groupId = findEntityId(payload.ReceiversGroup);

    if (groupId === null) {
      return {
        ok: true,
        skipped: true,
        reason: "No message receiver group id found in the live payload.",
      };
    }

    const group = await api.getMessageReceiverGroup(groupId);

    return {
      ok: true,
      groupId: String(groupId),
      kind: Array.isArray(group.ReceiversGroup)
        ? "array"
        : typeof group.ReceiversGroup,
    };
  } catch (error) {
    return {
      ok: false,
      error: serializeError(error),
    };
  }
}

async function runSchoolNoticeDetailCheck(api) {
  try {
    const payload = await api.listSchoolNotices();
    const noticeId = findEntityId(payload.SchoolNotices);

    if (noticeId === null) {
      return {
        ok: true,
        skipped: true,
        reason: "No school notice id found in the live payload.",
      };
    }

    const notice = await api.getSchoolNotice(noticeId);

    return {
      ok: true,
      noticeId: String(noticeId),
      keys: Object.keys(notice.SchoolNotice ?? {}),
    };
  } catch (error) {
    return {
      ok: false,
      error: serializeError(error),
    };
  }
}

async function runNoteDetailCheck(api) {
  try {
    const payload = await api.listNotes();
    const noteId = findEntityId(payload.Notes);

    if (noteId === null) {
      return {
        ok: true,
        skipped: true,
        reason: "No note id found in the live payload.",
      };
    }

    const note = await api.getNote(noteId);

    return {
      ok: true,
      noteId: String(noteId),
      keys: Object.keys(note.Note ?? {}),
    };
  } catch (error) {
    return {
      ok: false,
      error: serializeError(error),
    };
  }
}

async function runSchoolByIdCheck(api) {
  try {
    const payload = await api.getSchool();
    const schoolId =
      payload.School &&
      typeof payload.School === "object" &&
      !Array.isArray(payload.School)
        ? (payload.School.Id ?? null)
        : null;

    if (schoolId === null) {
      return {
        ok: true,
        skipped: true,
        reason: "No school id found in the live payload.",
      };
    }

    const school = await api.getSchoolById(schoolId);

    return {
      ok: true,
      schoolId: String(schoolId),
      keys: Object.keys(school.School ?? {}),
    };
  } catch (error) {
    return {
      ok: false,
      error: serializeError(error),
    };
  }
}

async function runSubjectDetailCheck(api) {
  try {
    const payload = await api.listSubjects();
    const subjectId = findEntityId(payload.Subjects);

    if (subjectId === null) {
      return {
        ok: true,
        skipped: true,
        reason: "No subject id found in the live payload.",
      };
    }

    const subject = await api.getSubject(subjectId);

    return {
      ok: true,
      subjectId: String(subjectId),
      keys: Object.keys(subject.Subject ?? {}),
    };
  } catch (error) {
    return {
      ok: false,
      error: serializeError(error),
    };
  }
}

async function runUserDetailCheck(api) {
  try {
    const payload = await api.listUsers();
    const userId = findEntityId(payload.Users);

    if (userId === null) {
      return {
        ok: true,
        skipped: true,
        reason: "No user id found in the live payload.",
      };
    }

    const user = await api.getUser(userId);

    return {
      ok: true,
      userId: String(userId),
      keys: Object.keys(user.User ?? {}),
    };
  } catch (error) {
    return {
      ok: false,
      error: serializeError(error),
    };
  }
}

const sdkChecks = [
  {
    name: "me",
    load: (api) => api.getMe(),
    summarize: (payload) => ({
      keys: Object.keys(payload.Me ?? {}),
    }),
  },
  arrayCheck("grades", (api) => api.getGrades(), "Grades"),
  arrayOrStatusCheck(
    "gradeAverages",
    (api) => api.getGradeAverages(),
    "Averages",
  ),
  arrayCheck(
    "gradeCategories",
    (api) => api.getGradeCategories(),
    "Categories",
  ),
  arrayCheck("gradeComments", (api) => api.getGradeComments(), "Comments"),
  arrayCheck("behaviourGrades", (api) => api.getBehaviourGrades(), "Grades"),
  arrayCheck(
    "behaviourGradeTypes",
    (api) => api.getBehaviourGradeTypes(),
    "Types",
  ),
  arrayCheck(
    "behaviourGradePoints",
    (api) => api.getBehaviourGradePoints(),
    "Grades",
  ),
  arrayCheck(
    "behaviourPointCategories",
    (api) => api.getBehaviourPointCategories(),
    "Categories",
  ),
  arrayCheck(
    "behaviourPointComments",
    (api) => api.getBehaviourPointComments(),
    "Comments",
  ),
  arrayCheck(
    "descriptiveGrades",
    (api) => api.getDescriptiveGrades(),
    "Grades",
  ),
  arrayCheck(
    "descriptiveGradeComments",
    (api) => api.getDescriptiveGradeComments(),
    "Comments",
  ),
  arrayCheck(
    "descriptiveGradeSkills",
    (api) => api.getDescriptiveGradeSkills(),
    "Skills",
  ),
  arrayCheck(
    "descriptiveGradeText",
    (api) => api.getDescriptiveGradeText(),
    "Grades",
  ),
  arrayCheck(
    "descriptiveGradeTextCategories",
    (api) => api.getDescriptiveGradeTextCategories(),
    "Categories",
  ),
  arrayCheck(
    "descriptiveTextGrades",
    (api) => api.getDescriptiveTextGrades(),
    "Grades",
  ),
  arrayCheck(
    "descriptiveTextGradeSkills",
    (api) => api.getDescriptiveTextGradeSkills(),
    "Skills",
  ),
  arrayCheck("pointGrades", (api) => api.getPointGrades(), "Grades"),
  arrayOrStatusCheck(
    "pointGradeAverages",
    (api) => api.getPointGradeAverages(),
    "Averages",
  ),
  arrayCheck(
    "pointGradeCategories",
    (api) => api.getPointGradeCategories(),
    "Categories",
  ),
  arrayCheck(
    "pointGradeComments",
    (api) => api.getPointGradeComments(),
    "Comments",
  ),
  arrayCheck("textGrades", (api) => api.getTextGrades(), "Grades"),
  arrayCheck("attendance", (api) => api.getAttendances(), "Attendances"),
  arrayCheck("attendanceTypes", (api) => api.getAttendanceTypes(), "Types"),
  timetableCheck("timetableWeek", (api) =>
    api.getTimetableWeek(getCurrentWeekStart()),
  ),
  timetableCheck("timetableDay", (api) => api.getTimetableDay(getCurrentDay())),
  arrayCheck("calendars", (api) => api.getCalendars(), "Calendars"),
  arrayCheck("classFreeDays", (api) => api.getClassFreeDays(), "ClassFreeDays"),
  arrayCheck("classFreeDayTypes", (api) => api.getClassFreeDayTypes(), "Types"),
  arrayCheck(
    "schoolFreeDays",
    (api) => api.getSchoolFreeDays(),
    "SchoolFreeDays",
  ),
  arrayCheck(
    "teacherFreeDays",
    (api) => api.getTeacherFreeDays(),
    "TeacherFreeDays",
  ),
  arrayCheck(
    "virtualClasses",
    (api) => api.getVirtualClasses(),
    "VirtualClasses",
  ),
  arrayCheck("messages", (api) => api.listMessages(), "Messages"),
  countCheck(
    "unreadMessages",
    (api) => api.getUnreadMessages(),
    "UnreadMessages",
  ),
  arrayCheck(
    "messageReceiverGroups",
    (api) => api.listMessageReceiverGroups(),
    "ReceiversGroup",
  ),
  arrayCheck(
    "schoolNotices",
    (api) => api.listSchoolNotices(),
    "SchoolNotices",
  ),
  arrayCheck("notes", (api) => api.listNotes(), "Notes"),
  arrayCheck("noteCategories", (api) => api.listNoteCategories(), "Categories"),
  objectCheck("schools", (api) => api.getSchool(), "School"),
  objectCheck("classes", (api) => api.getClass(), "Class"),
  arrayCheck("subjects", (api) => api.listSubjects(), "Subjects"),
  arrayCheck("users", (api) => api.listUsers(), "Users"),
  arrayCheck("homework", (api) => api.getHomeWorks(), "HomeWorks"),
  arrayCheck(
    "homeworkAssignments",
    (api) => api.getHomeworkAssignments(),
    "HomeWorkAssignments",
  ),
  arrayCheck(
    "homeworkCategories",
    (api) => api.getHomeworkCategories(),
    "Categories",
  ),
];

export async function runSdkMatrix(env = process.env) {
  const { LibrusSession } = await loadSdkModule();
  const session = LibrusSession.fromEnv(env);
  const linkedChildren = await session.listChildren();
  const targetChildren = selectTargetChildren(linkedChildren, env);

  const children = [];

  for (const child of targetChildren) {
    const api = await session.forChild(child);
    const checkEntries = await Promise.all(
      sdkChecks.map(async ({ name, load, summarize }) => {
        const check = await runCheck(() => load(api), summarize);
        return [name, check];
      }),
    );
    const behaviourSystemProposal = await runBehaviourSystemProposalCheck(api);
    const timetableEntry = await runTimetableEntryCheck(api);
    const messageDetail = await runMessageDetailCheck(api);
    const messageReceiverGroupDetail =
      await runMessageReceiverGroupDetailCheck(api);
    const schoolNoticeDetail = await runSchoolNoticeDetailCheck(api);
    const noteDetail = await runNoteDetailCheck(api);
    const schoolById = await runSchoolByIdCheck(api);
    const subjectDetail = await runSubjectDetailCheck(api);
    const userDetail = await runUserDetailCheck(api);
    const homeworkAssignmentAttachment =
      await runHomeworkAssignmentAttachmentCheck(api);
    const checks = Object.fromEntries([
      ...checkEntries,
      ["behaviourSystemProposal", behaviourSystemProposal],
      ["timetableEntry", timetableEntry],
      ["messageDetail", messageDetail],
      ["messageReceiverGroupDetail", messageReceiverGroupDetail],
      ["schoolNoticeDetail", schoolNoticeDetail],
      ["noteDetail", noteDetail],
      ["schoolById", schoolById],
      ["subjectDetail", subjectDetail],
      ["userDetail", userDetail],
      ["homeworkAssignmentAttachment", homeworkAssignmentAttachment],
    ]);

    children.push({
      ...summarizeChild(child),
      ok: Object.values(checks).every((check) => check.ok),
      checks,
    });
  }

  return {
    ok: children.every((child) => child.ok),
    availableChildren: linkedChildren.map(summarizeChild),
    targetChildren: targetChildren.map(summarizeChild),
    childCount: targetChildren.length,
    children,
  };
}
