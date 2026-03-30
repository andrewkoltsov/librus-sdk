import { spawnSync } from "node:child_process";
import { accessSync, constants } from "node:fs";
import { fileURLToPath } from "node:url";

import { selectTargetChildren, summarizeChild } from "./children.mjs";

const MAX_BUFFER_BYTES = 20 * 1024 * 1024;
const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const cliEntryPath = fileURLToPath(
  new URL("../../../dist/cli/main.js", import.meta.url),
);

function assertBuiltCli() {
  try {
    accessSync(cliEntryPath, constants.R_OK);
  } catch {
    throw new Error(
      `Missing built CLI artifact at ${cliEntryPath}. Run "npm run build" first.`,
    );
  }
}

function parseJsonPayload(stdout, stderr) {
  const text =
    [stdout, stderr].find((value) => value && value.trim().length > 0) ?? "";

  return text ? JSON.parse(text) : null;
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

function countTimetableEntries(timetable) {
  if (!timetable || typeof timetable !== "object" || Array.isArray(timetable)) {
    return 0;
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

  return count;
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

function skippedCliResult(args, reason) {
  return {
    command: `node dist/cli/main.js ${args.join(" ")}`,
    exitCode: 0,
    ok: true,
    skipped: true,
    reason,
    parseError: null,
  };
}

function summarizeSuccess(args, payload) {
  const commandName = args[0];
  const subcommandName = args[1];

  if (commandName === "children") {
    return {
      ok: true,
      childCount: payload.children.length,
      children: payload.children.map(summarizeChild),
    };
  }

  if (commandName === "me") {
    return {
      ok: true,
      child: payload.child ? summarizeChild(payload.child) : null,
      keys: Object.keys(payload.data?.Me ?? {}),
    };
  }

  if (commandName === "grades") {
    return {
      ok: true,
      child: payload.child ? summarizeChild(payload.child) : null,
      count: payload.data?.Grades?.length ?? 0,
    };
  }

  if (commandName === "attendance") {
    return {
      ok: true,
      child: payload.child ? summarizeChild(payload.child) : null,
      count: payload.data?.Attendances?.length ?? 0,
    };
  }

  if (commandName === "homework") {
    return {
      ok: true,
      child: payload.child ? summarizeChild(payload.child) : null,
      count: payload.data?.HomeWorks?.length ?? 0,
    };
  }

  if (commandName === "messages") {
    return {
      ok: true,
      child: payload.child ? summarizeChild(payload.child) : null,
      count:
        subcommandName === "unread"
          ? typeof payload.data?.UnreadMessages === "number"
            ? payload.data.UnreadMessages
            : 0
          : (payload.data?.Messages?.length ?? 0),
      keys:
        subcommandName === "get"
          ? Object.keys(payload.data?.Message ?? {})
          : [],
    };
  }

  if (commandName === "timetable") {
    return {
      ok: true,
      child: payload.child ? summarizeChild(payload.child) : null,
      count: countTimetableEntries(payload.data?.Timetable),
      keys:
        subcommandName === "entry"
          ? Object.keys(payload.data?.TimetableEntry ?? {})
          : [],
    };
  }

  if (commandName === "announcements") {
    return {
      ok: true,
      child: payload.child ? summarizeChild(payload.child) : null,
      count: payload.data?.SchoolNotices?.length ?? 0,
      keys:
        subcommandName === "get"
          ? Object.keys(payload.data?.SchoolNotice ?? {})
          : [],
    };
  }

  if (commandName === "notes") {
    return {
      ok: true,
      child: payload.child ? summarizeChild(payload.child) : null,
      count: payload.data?.Notes?.length ?? 0,
      keys:
        subcommandName === "get" ? Object.keys(payload.data?.Note ?? {}) : [],
    };
  }

  return { ok: true };
}

export function runCliCommand(args, env = process.env) {
  assertBuiltCli();

  const result = spawnSync(process.execPath, [cliEntryPath, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    env,
    maxBuffer: MAX_BUFFER_BYTES,
  });

  let payload = null;
  let parseError = null;

  try {
    payload = parseJsonPayload(result.stdout, result.stderr);
  } catch (error) {
    parseError = error instanceof Error ? error.message : String(error);
  }

  return {
    args,
    command: `node dist/cli/main.js ${args.join(" ")}`,
    exitCode: result.status ?? 1,
    payload,
    parseError,
  };
}

export function summarizeCliResult(result) {
  if (result.exitCode !== 0) {
    return {
      command: result.command,
      exitCode: result.exitCode,
      ok: false,
      errorCode: result.payload?.error?.code ?? null,
      errorMessage: result.payload?.error?.message ?? null,
      issues: result.payload?.error?.details?.issues ?? null,
      endpoint: result.payload?.error?.details?.endpoint ?? null,
      parseError: result.parseError,
    };
  }

  return {
    command: result.command,
    exitCode: result.exitCode,
    ...summarizeSuccess(result.args, result.payload),
    parseError: result.parseError,
  };
}

export function runCliMatrix(env = process.env) {
  const childrenResult = runCliCommand(["children", "list"], env);
  const results = [summarizeCliResult(childrenResult)];

  if (
    childrenResult.exitCode !== 0 ||
    !childrenResult.payload ||
    !Array.isArray(childrenResult.payload.children)
  ) {
    return {
      ok: false,
      availableChildren: [],
      targetChildren: [],
      results,
    };
  }

  const linkedChildren = childrenResult.payload.children;
  const targetChildren = selectTargetChildren(linkedChildren, env);
  const targetResults = [];
  const currentDay = getCurrentDay();
  const currentWeekStart = getCurrentWeekStart();

  for (const child of targetChildren) {
    const childArgs = [
      ["me", "--child", String(child.id)],
      ["grades", "list", "--child", String(child.id)],
      ["attendance", "list", "--child", String(child.id)],
      ["homework", "list", "--child", String(child.id)],
      ["messages", "list", "--child", String(child.id)],
      ["messages", "unread", "--child", String(child.id)],
      ["timetable", "day", "--child", String(child.id), "--day", currentDay],
      [
        "timetable",
        "week",
        "--child",
        String(child.id),
        "--week-start",
        currentWeekStart,
      ],
      ["announcements", "list", "--child", String(child.id)],
      ["notes", "list", "--child", String(child.id)],
    ];

    for (const args of childArgs) {
      targetResults.push(summarizeCliResult(runCliCommand(args, env)));
    }

    const messagesList = runCliCommand(
      ["messages", "list", "--child", String(child.id)],
      env,
    );
    const messageId = findEntityId(messagesList.payload?.data?.Messages);

    targetResults.push(
      messageId === null
        ? skippedCliResult(
            ["messages", "get", "--child", String(child.id), "--id", "<id>"],
            "No message id found in the live messages payload.",
          )
        : summarizeCliResult(
            runCliCommand(
              [
                "messages",
                "get",
                "--child",
                String(child.id),
                "--id",
                String(messageId),
              ],
              env,
            ),
          ),
    );

    const timetableDay = runCliCommand(
      ["timetable", "day", "--child", String(child.id), "--day", currentDay],
      env,
    );
    const timetableEntryId = findTimetableEntryId(
      timetableDay.payload?.data?.Timetable,
    );

    targetResults.push(
      timetableEntryId === null
        ? skippedCliResult(
            ["timetable", "entry", "--child", String(child.id), "--id", "<id>"],
            "No timetable entry id found in the current day payload.",
          )
        : summarizeCliResult(
            runCliCommand(
              [
                "timetable",
                "entry",
                "--child",
                String(child.id),
                "--id",
                String(timetableEntryId),
              ],
              env,
            ),
          ),
    );

    const announcementsList = runCliCommand(
      ["announcements", "list", "--child", String(child.id)],
      env,
    );
    const announcementId = findEntityId(
      announcementsList.payload?.data?.SchoolNotices,
    );

    targetResults.push(
      announcementId === null
        ? skippedCliResult(
            [
              "announcements",
              "get",
              "--child",
              String(child.id),
              "--id",
              "<id>",
            ],
            "No school notice id found in the live payload.",
          )
        : summarizeCliResult(
            runCliCommand(
              [
                "announcements",
                "get",
                "--child",
                String(child.id),
                "--id",
                String(announcementId),
              ],
              env,
            ),
          ),
    );

    const notesList = runCliCommand(
      ["notes", "list", "--child", String(child.id)],
      env,
    );
    const noteId = findEntityId(notesList.payload?.data?.Notes);

    targetResults.push(
      noteId === null
        ? skippedCliResult(
            ["notes", "get", "--child", String(child.id), "--id", "<id>"],
            "No note id found in the live payload.",
          )
        : summarizeCliResult(
            runCliCommand(
              [
                "notes",
                "get",
                "--child",
                String(child.id),
                "--id",
                String(noteId),
              ],
              env,
            ),
          ),
    );
  }

  return {
    ok: [...results, ...targetResults].every((result) => result.ok),
    availableChildren: linkedChildren.map(summarizeChild),
    targetChildren: targetChildren.map(summarizeChild),
    results: [...results, ...targetResults],
  };
}
