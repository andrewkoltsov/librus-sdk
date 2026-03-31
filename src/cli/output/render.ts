import cliui from "cliui";

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

type CliUiInstance = ReturnType<typeof cliui>;

export function renderTextSections(
  sections: CliTextSection[],
  options: RenderTextSectionsOptions,
): string {
  const ui = cliui({
    width: options.width,
    wrap: true,
  });

  sections.forEach((section, index) => {
    if (index > 0) {
      ui.div("");
    }

    ui.div({ text: section.title });
    appendValue(ui, section.value, INDENT_SIZE);
  });

  return `${ui.toString().trimEnd()}\n`;
}

function appendValue(ui: CliUiInstance, value: unknown, indent: number): void {
  if (Array.isArray(value)) {
    appendArray(ui, value, indent);
    return;
  }

  if (isRenderableObject(value)) {
    appendObject(ui, value, indent);
    return;
  }

  appendLine(ui, `${indentation(indent)}${formatScalar(value)}`);
}

function appendArray(
  ui: CliUiInstance,
  items: unknown[],
  indent: number,
): void {
  if (items.length === 0) {
    appendLine(ui, `${indentation(indent)}[]`);
    return;
  }

  for (const item of items) {
    if (isScalar(item)) {
      appendLine(ui, `${indentation(indent)}- ${formatScalar(item)}`);
      continue;
    }

    appendLine(ui, `${indentation(indent)}-`);
    appendValue(ui, item, indent + INDENT_SIZE);
  }
}

function appendObject(
  ui: CliUiInstance,
  value: Record<string, unknown>,
  indent: number,
): void {
  const entries = Object.entries(value).filter(
    ([, entryValue]) => entryValue !== undefined,
  );

  if (entries.length === 0) {
    appendLine(ui, `${indentation(indent)}{}`);
    return;
  }

  const scalarEntries = entries.filter(([, entryValue]) =>
    isScalar(entryValue),
  );
  const complexEntries = entries.filter(
    ([, entryValue]) => !isScalar(entryValue),
  );

  if (scalarEntries.length > 0) {
    const labelWidth = getLabelWidth(
      scalarEntries.map(([label]) => label.length),
    );

    for (const [label, entryValue] of scalarEntries) {
      appendKeyValueRow(ui, indent, label, entryValue, labelWidth);
    }
  }

  for (const [label, entryValue] of complexEntries) {
    appendLine(ui, `${indentation(indent)}${label}`);
    appendValue(ui, entryValue, indent + INDENT_SIZE);
  }
}

function appendKeyValueRow(
  ui: CliUiInstance,
  indent: number,
  label: string,
  value: unknown,
  labelWidth: number,
): void {
  ui.div(
    {
      text: `${indentation(indent)}${label}:`,
      width: indent + labelWidth + 2,
    },
    {
      text: formatScalar(value),
    },
  );
}

function appendLine(ui: CliUiInstance, text: string): void {
  ui.div({ text });
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

function formatScalar(value: unknown): string {
  if (value === null) {
    return "null";
  }

  if (value === undefined) {
    return "undefined";
  }

  if (typeof value === "string") {
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
