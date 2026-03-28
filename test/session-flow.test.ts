import { describe, expect, it, vi } from "vitest";

import { LibrusSession } from "../src/sdk/LibrusSession.js";

function getUrl(input: Parameters<typeof fetch>[0]): string {
  if (typeof input === "string") {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return input.url;
}

describe("LibrusSession SDK flow", () => {
  it("logs in, caches accounts, resolves a child, and fetches grades", async () => {
    const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
      const url = getUrl(input);

      if (url === "https://portal.librus.pl/konto-librus/login") {
        return new Response(
          '<form><input value="csrf-token-123" name="_token" type="hidden"></form>',
          {
            status: 200,
          },
        );
      }

      if (url === "https://portal.librus.pl/konto-librus/login/action") {
        expect(init?.method).toBe("POST");
        return new Response("", { status: 200 });
      }

      if (url === "https://portal.librus.pl/api/v3/Me") {
        return new Response(
          JSON.stringify({
            identifier: 1,
            email: "parent@example.com",
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      }

      if (url === "https://portal.librus.pl/api/v3/SynergiaAccounts") {
        return new Response(
          JSON.stringify({
            lastModification: 123,
            accounts: [
              {
                id: 10,
                accountIdentifier: "child-10",
                group: "parent",
                login: "child-login",
                studentName: "Child Name",
                accessToken: "child-token",
                state: "active",
              },
            ],
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      }

      if (url === "https://api.librus.pl/3.0/Grades") {
        expect(init?.headers).toMatchObject({
          accept: "application/json",
          authorization: "Bearer child-token",
        });

        return new Response(
          JSON.stringify({
            Grades: [],
            Resources: {},
            Url: "https://api.librus.pl/3.0/Grades",
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      }

      throw new Error(`Unexpected request: ${url}`);
    });

    const session = new LibrusSession({
      credentials: {
        email: "parent@example.com",
        password: "super-secret",
      },
      portalClientOptions: { fetch: fetchMock },
      synergiaClientOptions: { fetch: fetchMock },
    });

    const children = await session.listChildren();
    const gradesClient = await session.forChild("child-login");
    const grades = await gradesClient.getGrades();

    expect(children).toHaveLength(1);
    expect(children[0]?.login).toBe("child-login");
    expect(grades.Grades).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });
});
