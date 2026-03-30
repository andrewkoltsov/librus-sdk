export function serializeError(error) {
  if (error instanceof Error) {
    const payload = {
      name: error.name,
      message: error.message,
    };

    if ("code" in error && typeof error.code === "string") {
      payload.code = error.code;
    }

    if ("details" in error && error.details !== undefined) {
      payload.details = error.details;
    }

    return payload;
  }

  return { message: String(error) };
}

export function formatJson(value) {
  return JSON.stringify(value, null, 2);
}
