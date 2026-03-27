import type { Command } from "commander";

import { LibrusSession, LibrusSdkError, type ChildAccount, type ChildAccountSummary } from "../../sdk/index.js";

export interface CliOutput {
  write(chunk: string): void;
}

export interface CliContext {
  stdout: CliOutput;
  stderr: CliOutput;
  createSession: () => LibrusSession;
}

export function addJsonOption(command: Command): Command {
  return command.option("--json", "Emit JSON output");
}

export function summarizeChildAccount(child: ChildAccount): ChildAccountSummary {
  const { accessToken: _accessToken, ...summary } = child;
  return summary;
}

export function writeJson(output: CliOutput, value: unknown): void {
  output.write(`${JSON.stringify(value, null, 2)}\n`);
}

export function formatCliError(error: unknown): { code: string; message: string; details?: Record<string, unknown> } {
  if (error instanceof LibrusSdkError) {
    const payload: { code: string; message: string; details?: Record<string, unknown> } = {
      code: error.code,
      message: error.message,
    };

    if (error.details) {
      payload.details = error.details;
    }

    return payload;
  }

  if (error instanceof Error) {
    return {
      code: "CLI_USAGE_ERROR",
      message: error.message,
    };
  }

  return {
    code: "INTERNAL_ERROR",
    message: "Unexpected error",
  };
}
