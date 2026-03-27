#!/usr/bin/env node

import { Command } from "commander";
import { config as loadDotEnv } from "dotenv";
import { pathToFileURL } from "node:url";

import { LibrusSession } from "../sdk/index.js";
import { createAttendanceCommand } from "./commands/attendance.js";
import { createChildrenCommand } from "./commands/children.js";
import type { CliContext } from "./commands/common.js";
import { formatCliError, writeJson } from "./commands/common.js";
import { createGradesCommand } from "./commands/grades.js";
import { createHomeworkCommand } from "./commands/homework.js";
import { createMeCommand } from "./commands/me.js";

export function createDefaultCliContext(): CliContext {
  return {
    stdout: {
      write: (chunk) => process.stdout.write(chunk),
    },
    stderr: {
      write: (chunk) => process.stderr.write(chunk),
    },
    createSession: () => LibrusSession.fromEnv(),
  };
}

export function createProgram(context: CliContext): Command {
  const program = new Command()
    .name("librus")
    .description("CLI for the Librus family portal flow")
    .showHelpAfterError();

  program.addCommand(createChildrenCommand(context));
  program.addCommand(createMeCommand(context));
  program.addCommand(createGradesCommand(context));
  program.addCommand(createAttendanceCommand(context));
  program.addCommand(createHomeworkCommand(context));

  return program;
}

export async function runCli(argv = process.argv, context = createDefaultCliContext()): Promise<number> {
  const program = createProgram(context);
  program.exitOverride();

  try {
    await program.parseAsync(argv);
    return 0;
  } catch (error) {
    writeJson(context.stderr, {
      error: formatCliError(error),
    });

    return error instanceof Error && "exitCode" in error && typeof error.exitCode === "number" ? error.exitCode : 1;
  }
}

const isEntryPoint = process.argv[1] ? import.meta.url === pathToFileURL(process.argv[1]).href : false;

if (isEntryPoint) {
  loadDotEnv({ quiet: true });
  const exitCode = await runCli(process.argv, createDefaultCliContext());
  process.exitCode = exitCode;
}
