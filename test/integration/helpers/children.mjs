function normalizeSelectors(raw) {
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export const GATEWAY_API_20_CHILD = {
  id: "gateway-api-20",
  login: "LIBRUS_GATEWAY_LOGIN",
  studentName: "Gateway API 2.0 account",
};

export function isGatewayApi20Mode(env = process.env) {
  if (env.LIBRUS_API_BACKEND === "gateway_api_20") {
    return true;
  }

  if (env.LIBRUS_API_BACKEND === "api_v3") {
    return false;
  }

  if (env.LIBRUS_AUTH_MODE === "synergia") {
    return true;
  }

  if (hasCompletePortalCredentials(env)) {
    return false;
  }

  return hasCompleteGatewayCredentials(env);
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

function hasCompletePortalCredentials(env) {
  return Boolean(
    resolveCredential(env, "LIBRUS_PORTAL_EMAIL", "LIBRUS_EMAIL") &&
    resolveCredential(env, "LIBRUS_PORTAL_PASSWORD", "LIBRUS_PASSWORD"),
  );
}

function hasCompleteGatewayCredentials(env) {
  return Boolean(
    resolveCredential(env, "LIBRUS_GATEWAY_LOGIN", "SYNERGIA_ID") &&
    resolveCredential(env, "LIBRUS_GATEWAY_PASSWORD", "SYNERGIA_PASSWORD"),
  );
}

function resolveCredential(env, primary, fallback) {
  return env[primary] ?? env[fallback];
}
