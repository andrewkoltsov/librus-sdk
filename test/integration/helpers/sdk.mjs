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

function summarizeArrayResponse(payload, key) {
  return {
    count: Array.isArray(payload[key]) ? payload[key].length : 0,
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

function arrayOrStatusCheck(name, load, key) {
  return {
    name,
    load,
    summarize: (payload) => summarizeArrayOrStatusResponse(payload, key),
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
    const homeworkAssignmentAttachment =
      await runHomeworkAssignmentAttachmentCheck(api);
    const checks = Object.fromEntries([
      ...checkEntries,
      ["behaviourSystemProposal", behaviourSystemProposal],
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
