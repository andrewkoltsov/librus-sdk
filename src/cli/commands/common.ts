import { writeFileSync } from "node:fs";
import type { Command } from "commander";

import {
  LibrusSession,
  LibrusSdkError,
  type ChildAccount,
  type ChildAccountSummary,
} from "../../sdk/index.js";

export interface CliOutput {
  write(chunk: string): void;
}

export interface CliContext {
  stdout: CliOutput;
  stderr: CliOutput;
  createSession: () => LibrusSession;
  writeFile?: (path: string, data: Uint8Array) => void;
}

export function configureCommand(
  command: Command,
  context: CliContext,
): Command {
  return command
    .configureOutput({
      writeOut: (chunk) => context.stdout.write(chunk),
      writeErr: (chunk) => context.stderr.write(chunk),
      outputError: () => undefined,
    })
    .exitOverride();
}

export function addJsonOption(command: Command): Command {
  return command.option("--json", "Emit JSON output");
}

export function summarizeChildAccount(
  child: ChildAccount,
): ChildAccountSummary {
  const { accessToken: _accessToken, ...summary } = child;
  return summary;
}

export function writeJson(output: CliOutput, value: unknown): void {
  output.write(`${JSON.stringify(value, null, 2)}\n`);
}

export function formatCliError(error: unknown): {
  code: string;
  message: string;
  details?: Record<string, unknown>;
} {
  if (error instanceof LibrusSdkError) {
    const payload: {
      code: string;
      message: string;
      details?: Record<string, unknown>;
    } = {
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

export interface CliDownloadResult {
  bytes: number;
  contentDisposition: string | null;
  contentType: string | null;
  path: string;
}

function writeFile(
  context: CliContext,
  path: string,
  data: Uint8Array,
): CliDownloadResult {
  (context.writeFile ?? writeFileSync)(path, data);

  return {
    bytes: data.byteLength,
    contentDisposition: null,
    contentType: null,
    path,
  };
}

function decodeBase64Payload(content: string): {
  bytes: Uint8Array;
  contentType: string | null;
} {
  const dataUrlMatch = /^data:([^;,]+);base64,([\s\S]+)$/.exec(content);
  const contentType = dataUrlMatch?.[1] ?? null;
  const base64 = dataUrlMatch?.[2] ?? content;

  return {
    bytes: Uint8Array.from(Buffer.from(base64, "base64")),
    contentType,
  };
}

export function writeBinaryDownload(
  context: CliContext,
  path: string,
  data: {
    contentDisposition: string | null;
    contentType: string | null;
    data: ArrayBuffer;
  },
): CliDownloadResult {
  const result = writeFile(context, path, new Uint8Array(data.data));

  return {
    ...result,
    contentDisposition: data.contentDisposition,
    contentType: data.contentType,
  };
}

export function writeBase64Download(
  context: CliContext,
  path: string,
  content: string,
  metadata: {
    contentDisposition?: string | null;
    contentType?: string | null;
  } = {},
): CliDownloadResult {
  const decoded = decodeBase64Payload(content);
  const result = writeFile(context, path, decoded.bytes);

  return {
    ...result,
    contentDisposition: metadata.contentDisposition ?? null,
    contentType: metadata.contentType ?? decoded.contentType,
  };
}
