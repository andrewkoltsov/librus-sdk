import {
  LibrusConfigurationError,
  type Logger,
  type LogLevel,
} from "../sdk/index.js";
import type { CliOutput } from "./commands/common.js";

const LOG_LEVELS: LogLevel[] = ["debug", "info", "warn", "error"];
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export function createCliLogger(
  output: CliOutput,
  minimumLevel: LogLevel,
): Logger {
  return {
    log(level, event, fields = {}) {
      if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[minimumLevel]) {
        return;
      }

      output.write(
        `${new Date().toISOString()} ${level.toUpperCase()} ${event}${formatFields(fields)}\n`,
      );
    },
  };
}

export function resolveCliLogLevel(
  argv: string[],
  env: NodeJS.ProcessEnv = process.env,
): LogLevel | undefined {
  if (argv.includes("--verbose")) {
    return "debug";
  }

  const rawLogLevel = env.LIBRUS_LOG_LEVEL;

  if (rawLogLevel === undefined) {
    return undefined;
  }

  const logLevel = rawLogLevel.trim().toLowerCase();

  if (isLogLevel(logLevel)) {
    return logLevel;
  }

  throw new LibrusConfigurationError(
    'Invalid LIBRUS_LOG_LEVEL. Expected "debug", "info", "warn", or "error".',
  );
}

function isLogLevel(value: string): value is LogLevel {
  return LOG_LEVELS.includes(value as LogLevel);
}

function formatFields(fields: Record<string, unknown>): string {
  const entries = Object.entries(fields).filter(
    ([, value]) => value !== undefined,
  );

  if (entries.length === 0) {
    return "";
  }

  return ` ${entries
    .map(([key, value]) => `${key}=${formatFieldValue(value)}`)
    .join(" ")}`;
}

function formatFieldValue(value: unknown): string {
  if (
    value === null ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  if (typeof value === "string") {
    return JSON.stringify(value);
  }

  return JSON.stringify(value);
}
