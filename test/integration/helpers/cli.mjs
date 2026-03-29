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

function summarizeSuccess(args, payload) {
  const commandName = args[0];

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

  for (const child of targetChildren) {
    const childArgs = [
      ["me", "--child", String(child.id)],
      ["grades", "list", "--child", String(child.id)],
      ["attendance", "list", "--child", String(child.id)],
      ["homework", "list", "--child", String(child.id)],
    ];

    for (const args of childArgs) {
      targetResults.push(summarizeCliResult(runCliCommand(args, env)));
    }
  }

  return {
    ok: [...results, ...targetResults].every((result) => result.ok),
    availableChildren: linkedChildren.map(summarizeChild),
    targetChildren: targetChildren.map(summarizeChild),
    results: [...results, ...targetResults],
  };
}
