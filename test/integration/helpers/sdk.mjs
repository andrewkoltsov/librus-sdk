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

export async function runSdkMatrix(env = process.env) {
  const { LibrusSession } = await loadSdkModule();
  const session = LibrusSession.fromEnv(env);
  const linkedChildren = await session.listChildren();
  const targetChildren = selectTargetChildren(linkedChildren, env);

  const children = [];

  for (const child of targetChildren) {
    const api = await session.forChild(child);
    const [me, grades, attendance, homework] = await Promise.all([
      runCheck(
        () => api.getMe(),
        (payload) => ({
          keys: Object.keys(payload.Me ?? {}),
        }),
      ),
      runCheck(
        () => api.getGrades(),
        (payload) => ({
          count: payload.Grades.length,
        }),
      ),
      runCheck(
        () => api.getAttendances(),
        (payload) => ({
          count: payload.Attendances.length,
        }),
      ),
      runCheck(
        () => api.getHomeWorks(),
        (payload) => ({
          count: payload.HomeWorks.length,
        }),
      ),
    ]);

    const checks = {
      me,
      grades,
      attendance,
      homework,
    };

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
