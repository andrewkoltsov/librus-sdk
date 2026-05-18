const emittedDeprecationWarningCodes = new Set<string>();

export function emitDeprecationWarningOnce(
  code: string,
  message: string,
): void {
  if (emittedDeprecationWarningCodes.has(code)) {
    return;
  }

  emittedDeprecationWarningCodes.add(code);
  process.emitWarning(message, {
    code,
    type: "DeprecationWarning",
  });
}
