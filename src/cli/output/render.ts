export interface CliTextSection {
  title: string;
  value: unknown;
}

interface RenderTextSectionsOptions {
  width: number;
}

const INDENT_SIZE = 2;
const MIN_LABEL_WIDTH = 8;
const MAX_LABEL_WIDTH = 24;

interface ScalarFormatContext {
  label?: string;
}

interface ScalarEntry {
  formattedValue: string;
  isBlock: boolean;
  label: string;
}

export function renderTextSections(
  sections: CliTextSection[],
  options: RenderTextSectionsOptions,
): string {
  const lines: string[] = [];

  sections.forEach((section, index) => {
    if (index > 0) {
      lines.push("");
    }

    lines.push(section.title);
    appendValue(lines, section.value, INDENT_SIZE, options.width);
  });

  return `${lines.join("\n").trimEnd()}\n`;
}

function appendValue(
  lines: string[],
  value: unknown,
  indent: number,
  width: number,
  context: ScalarFormatContext = {},
): void {
  if (Array.isArray(value)) {
    appendArray(lines, value, indent, width);
    return;
  }

  if (isRenderableObject(value)) {
    appendObject(lines, value, indent, width);
    return;
  }

  appendWrappedText(lines, formatScalar(value, context), {
    firstPrefix: indentation(indent),
    continuationPrefix: indentation(indent),
    width,
  });
}

function appendArray(
  lines: string[],
  items: unknown[],
  indent: number,
  width: number,
): void {
  if (items.length === 0) {
    appendLine(lines, `${indentation(indent)}[]`);
    return;
  }

  for (const item of items) {
    if (isScalar(item)) {
      appendWrappedText(lines, formatScalar(item), {
        firstPrefix: `${indentation(indent)}- `,
        continuationPrefix: indentation(indent + INDENT_SIZE),
        width,
      });
      continue;
    }

    appendLine(lines, `${indentation(indent)}-`);
    appendValue(lines, item, indent + INDENT_SIZE, width);
  }
}

function appendObject(
  lines: string[],
  value: Record<string, unknown>,
  indent: number,
  width: number,
): void {
  const entries = Object.entries(value).filter(
    ([, entryValue]) => entryValue !== undefined,
  );

  if (entries.length === 0) {
    appendLine(lines, `${indentation(indent)}{}`);
    return;
  }

  const scalarEntries = entries.filter(([, entryValue]) =>
    isScalar(entryValue),
  );
  const complexEntries = entries.filter(
    ([, entryValue]) => !isScalar(entryValue),
  );

  if (scalarEntries.length > 0) {
    const preparedEntries = scalarEntries.map(([label, entryValue]) =>
      prepareScalarEntry(label, entryValue),
    );
    const inlineEntries = preparedEntries.filter((entry) => !entry.isBlock);
    const labelWidth =
      inlineEntries.length > 0
        ? getLabelWidth(inlineEntries.map((entry) => entry.label.length))
        : MIN_LABEL_WIDTH;

    for (const entry of preparedEntries) {
      if (entry.isBlock) {
        appendBlockScalar(
          lines,
          indent,
          entry.label,
          entry.formattedValue,
          width,
        );
        continue;
      }

      appendKeyValueRow(
        lines,
        indent,
        entry.label,
        entry.formattedValue,
        labelWidth,
        width,
      );
    }
  }

  for (const [label, entryValue] of complexEntries) {
    appendLine(lines, `${indentation(indent)}${label}`);
    appendValue(lines, entryValue, indent + INDENT_SIZE, width);
  }
}

function appendKeyValueRow(
  lines: string[],
  indent: number,
  label: string,
  formattedValue: string,
  labelWidth: number,
  width: number,
): void {
  const valueColumnWidth = indent + labelWidth + 2;

  appendWrappedText(lines, formattedValue, {
    firstPrefix: `${indentation(indent)}${label}:`.padEnd(valueColumnWidth),
    continuationPrefix: indentation(valueColumnWidth),
    width,
  });
}

function appendBlockScalar(
  lines: string[],
  indent: number,
  label: string,
  formattedValue: string,
  width: number,
): void {
  appendLine(lines, `${indentation(indent)}${label}:`);

  for (const line of formattedValue.split("\n")) {
    if (line.length === 0) {
      appendLine(lines, "");
      continue;
    }

    appendWrappedText(lines, line, {
      firstPrefix: indentation(indent + INDENT_SIZE),
      continuationPrefix: indentation(indent + INDENT_SIZE),
      width,
    });
  }
}

function appendLine(lines: string[], text: string): void {
  lines.push(text);
}

interface WrapTextOptions {
  firstPrefix: string;
  continuationPrefix: string;
  width: number;
}

function appendWrappedText(
  lines: string[],
  text: string,
  options: WrapTextOptions,
): void {
  let remaining = text;
  let prefix = options.firstPrefix;
  let availableWidth = Math.max(options.width - prefix.length, 1);

  if (remaining.length === 0) {
    appendLine(lines, prefix);
    return;
  }

  while (remaining.length > availableWidth) {
    const wrapIndex = findWrapIndex(remaining, availableWidth);

    appendLine(lines, `${prefix}${remaining.slice(0, wrapIndex).trimEnd()}`);
    remaining = remaining.slice(wrapIndex).trimStart();
    prefix = options.continuationPrefix;
    availableWidth = Math.max(options.width - prefix.length, 1);
  }

  appendLine(lines, `${prefix}${remaining}`);
}

function findWrapIndex(text: string, width: number): number {
  if (text.length <= width) {
    return text.length;
  }

  const lastSpace = text.lastIndexOf(" ", width);

  if (lastSpace > 0) {
    return lastSpace;
  }

  return width;
}

function getLabelWidth(labelLengths: number[]): number {
  const maxLength = Math.max(...labelLengths);

  return Math.min(Math.max(maxLength, MIN_LABEL_WIDTH), MAX_LABEL_WIDTH);
}

function indentation(indent: number): string {
  return " ".repeat(indent);
}

function isRenderableObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isScalar(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  );
}

function formatScalar(
  value: unknown,
  context: ScalarFormatContext = {},
): string {
  const formattedDate = formatDateScalar(value, context.label);

  if (formattedDate !== null) {
    return formattedDate;
  }

  if (value === null) {
    return "null";
  }

  if (value === undefined) {
    return "undefined";
  }

  if (typeof value === "string") {
    const formattedBody = formatBodyScalar(value, context.label);

    if (formattedBody !== null) {
      return formattedBody;
    }

    if (value.length === 0) {
      return '""';
    }

    if (/[\r\n\t]/.test(value) || value.trim() !== value) {
      return JSON.stringify(value);
    }

    return value;
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return String(value);
  }

  return JSON.stringify(value);
}

function prepareScalarEntry(label: string, value: unknown): ScalarEntry {
  const formattedValue = formatScalar(value, { label });

  return {
    formattedValue,
    isBlock: formattedValue.includes("\n"),
    label,
  };
}

function formatDateScalar(
  value: unknown,
  label: string | undefined,
): string | null {
  if (!label?.endsWith("Date")) {
    return null;
  }

  const timestamp = normalizeUnixTimestamp(value);

  if (timestamp === null) {
    return null;
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return formatLocalDateTime(date);
}

function normalizeUnixTimestamp(value: unknown): number | null {
  if (typeof value === "number") {
    if (!Number.isFinite(value) || !Number.isInteger(value)) {
      return null;
    }

    return normalizeTimestampNumber(value);
  }

  if (typeof value === "bigint") {
    return normalizeTimestampNumber(Number(value));
  }

  if (typeof value !== "string" || !/^-?\d+$/.test(value)) {
    return null;
  }

  return normalizeTimestampNumber(Number(value));
}

function normalizeTimestampNumber(value: number): number | null {
  const digits = Math.abs(value).toString().length;

  if (digits === 10) {
    return value * 1000;
  }

  if (digits === 13) {
    return value;
  }

  return null;
}

function formatLocalDateTime(date: Date): string {
  return [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())]
    .join("-")
    .concat(
      ` ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`,
    );
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function formatBodyScalar(
  value: string,
  label: string | undefined,
): string | null {
  if (label !== "Body") {
    return null;
  }

  const decodedValue = hasJsonEscapes(value)
    ? decodeJsonEscapedString(value)
    : value;
  const withLineBreaks = decodedValue.replace(/<br\s*\/?>/gi, "\n");

  if (
    decodedValue !== value ||
    withLineBreaks !== decodedValue ||
    withLineBreaks.includes("\n")
  ) {
    return withLineBreaks;
  }

  return null;
}

function hasJsonEscapes(value: string): boolean {
  return /\\u[0-9a-fA-F]{4}|\\["\\/bfnrt]/.test(value);
}

function decodeJsonEscapedString(value: string): string {
  const escaped = value
    .replace(/"/g, '\\"')
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n")
    .replace(/\t/g, "\\t");

  try {
    return JSON.parse(`"${escaped}"`) as string;
  } catch {
    return value;
  }
}
