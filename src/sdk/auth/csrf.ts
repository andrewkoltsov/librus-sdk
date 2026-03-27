const LOGIN_TOKEN_PATTERN = /name="_token"\s+value="([^"]+)"/i;

export function extractPortalCsrfToken(html: string): string {
  const match = LOGIN_TOKEN_PATTERN.exec(html);

  if (!match?.[1]) {
    throw new Error("Unable to locate portal CSRF token");
  }

  return match[1];
}
