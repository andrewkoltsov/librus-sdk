#!/usr/bin/env node

import {
  createDefaultCliContext,
  isCliEntryPoint,
  loadCliEnvironment,
  runCli,
} from "./main.js";
import type { CliContext } from "./commands/common.js";

export const DEPRECATED_LIBRUS_BINARY_WARNING =
  'Warning: the "librus" binary is deprecated; use "librus-sdk" instead.\n';

export async function runDeprecatedLibrusCli(
  argv = process.argv,
  context: CliContext = createDefaultCliContext(),
): Promise<number> {
  context.stderr.write(DEPRECATED_LIBRUS_BINARY_WARNING);
  return runCli(argv, context);
}

/* v8 ignore next -- covered by packaged CLI smoke tests instead of unit import. */
if (isCliEntryPoint(process.argv, import.meta.url)) {
  loadCliEnvironment();
  const exitCode = await runDeprecatedLibrusCli(
    process.argv,
    createDefaultCliContext(),
  );
  process.exitCode = exitCode;
}
