function normalizeSelectors(raw) {
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function summarizeChild(child) {
  return {
    id: child.id,
    login: child.login,
    studentName: child.studentName,
  };
}

export function describeChild(child) {
  return `${child.studentName} (${child.id}/${child.login})`;
}

export function selectTargetChildren(children, env = process.env) {
  const rawSelectors = env.LIBRUS_TEST_CHILDREN?.trim();

  if (!rawSelectors) {
    return children;
  }

  const selectors = new Set(normalizeSelectors(rawSelectors));
  const selectedChildren = children.filter((child) => {
    return selectors.has(String(child.id)) || selectors.has(child.login);
  });

  if (selectedChildren.length === 0) {
    throw new Error(
      `LIBRUS_TEST_CHILDREN="${rawSelectors}" did not match any linked children.`,
    );
  }

  return selectedChildren;
}
