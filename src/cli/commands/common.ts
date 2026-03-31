import { writeFileSync } from "node:fs";
import { InvalidArgumentError, type Command } from "commander";

import {
  LibrusSession,
  LibrusSdkError,
  type ChildAccount,
  type ChildAccountSummary,
} from "../../sdk/index.js";
import { renderTextSections, type CliTextSection } from "../output/render.js";

const DEFAULT_OUTPUT_WIDTH = 80;

export type CliOutputFormat = "json" | "text";
export type CliTextVariant = "default" | "full";

export interface CliFormatOptions {
  format: CliOutputFormat;
}

export interface CliRenderOptions {
  format: CliOutputFormat;
  textVariant: CliTextVariant;
  width: number;
}

export interface CliOutput {
  write(chunk: string): void;
}

export interface CliContext {
  stdout: CliOutput;
  stderr: CliOutput;
  createSession: () => LibrusSession;
  outputWidth?: number;
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

export function addFormatOption(command: Command): Command {
  return command.option(
    "--format <format>",
    "Emit output in text or json",
    parseCliOutputFormat,
    "text",
  );
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

export function createCliRenderOptions(
  context: CliContext,
  format: CliOutputFormat,
): CliRenderOptions {
  return {
    format,
    textVariant: format === "json" ? "full" : "default",
    width: context.outputWidth ?? DEFAULT_OUTPUT_WIDTH,
  };
}

export function detectCliOutputFormat(argv: string[]): CliOutputFormat {
  let format: CliOutputFormat = "text";

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (!arg) {
      continue;
    }

    if (arg === "--format") {
      const nextArg = argv[index + 1];

      if (nextArg === "json" || nextArg === "text") {
        format = nextArg;
      }

      continue;
    }

    if (arg.startsWith("--format=")) {
      const value = arg.slice("--format=".length);

      if (value === "json" || value === "text") {
        format = value;
      }
    }
  }

  return format;
}

export function writeCommandOutput<T>(
  context: CliContext,
  format: CliOutputFormat,
  value: T,
  buildTextSections: (textVariant: CliTextVariant) => CliTextSection[],
): void {
  const renderOptions = createCliRenderOptions(context, format);

  if (renderOptions.format === "json") {
    writeJson(context.stdout, value);
    return;
  }

  context.stdout.write(
    renderTextSections(buildTextSections(renderOptions.textVariant), {
      width: renderOptions.width,
    }),
  );
}

export function writeCliError(
  output: CliOutput,
  renderOptions: CliRenderOptions,
  error: unknown,
): void {
  const payload = {
    error: formatCliError(error),
  };

  if (renderOptions.format === "json") {
    writeJson(output, payload);
    return;
  }

  output.write(
    renderTextSections([{ title: "Error", value: payload.error }], {
      width: renderOptions.width,
    }),
  );
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

export function createSingleDataSection(
  title: string,
  value: unknown,
): CliTextSection[] {
  return [{ title, value }];
}

export function createTopLevelDataSections(
  value: unknown,
  fallbackTitle = "Data",
): CliTextSection[] {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    value instanceof Date
  ) {
    return [{ title: fallbackTitle, value }];
  }

  const sections: CliTextSection[] = [];
  const metadata: Record<string, unknown> = {};

  for (const [key, entryValue] of Object.entries(value)) {
    if (entryValue === undefined) {
      continue;
    }

    if (key === "Resources" || key === "Url") {
      metadata[key] = entryValue;
      continue;
    }

    sections.push({
      title: humanizeHeading(key),
      value: entryValue,
    });
  }

  if (Object.keys(metadata).length > 0) {
    sections.push({
      title: "Metadata",
      value: metadata,
    });
  }

  if (sections.length === 0) {
    return [{ title: fallbackTitle, value }];
  }

  return sections;
}

export function createChildScopedSections(
  child: ChildAccountSummary,
  data: unknown,
): CliTextSection[] {
  return [
    { title: "Child", value: child },
    ...createTopLevelDataSections(data),
  ];
}

export function writeChildScopedOutput(
  context: CliContext,
  format: CliOutputFormat,
  child: ChildAccount,
  data: unknown,
  buildTextSections:
    | ((child: ChildAccountSummary) => CliTextSection[])
    | null = null,
): void {
  const summary = summarizeChildAccount(child);
  const payload = {
    child: summary,
    data,
  };

  writeCommandOutput(context, format, payload, () =>
    buildTextSections
      ? buildTextSections(summary)
      : createChildScopedSections(summary, data),
  );
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

function parseCliOutputFormat(value: string): CliOutputFormat {
  if (value === "text" || value === "json") {
    return value;
  }

  throw new InvalidArgumentError('Expected "text" or "json".');
}

function humanizeHeading(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
