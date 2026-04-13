import { describe, expect, it } from "vitest";

import { renderTextSections } from "../src/cli/output/render.js";

function formatLocalDateTime(timestamp: number): string {
  const date = new Date(timestamp);

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ]
    .join("-")
    .concat(
      ` ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`,
    );
}

describe("renderTextSections", () => {
  it("renders top-level scalar sections and preserves scalar formatting", () => {
    const output = renderTextSections(
      [
        { title: "Empty", value: "" },
        { title: "Nothing", value: null },
        { title: "Missing", value: undefined },
        { title: "Whitespace", value: " padded\tvalue " },
        { title: "Flag", value: true },
        { title: "Count", value: 99n },
      ],
      { width: 40 },
    );

    expect(output).toContain('  ""');
    expect(output).toContain("  null");
    expect(output).toContain("  undefined");
    expect(output).toContain('  " padded\\tvalue "');
    expect(output).toContain("  true");
    expect(output).toContain("  99");
  });

  it("renders wrapped scalar values and nested collections consistently", () => {
    const output = renderTextSections(
      [
        {
          title: "Response",
          value: {
            Summary:
              "This is a deliberately long summary value that should wrap cleanly in text mode.",
            Children: [
              {
                Login: "child-login",
                StudentName: "Child Name",
              },
            ],
          },
        },
      ],
      { width: 44 },
    );

    expect(output).toMatchInlineSnapshot(`
      "Response
        Summary:  This is a deliberately long
                  summary value that should wrap
                  cleanly in text mode.
        Children
          -
            Login:       child-login
            StudentName: Child Name
      "
    `);
  });

  it("renders objects that only contain complex values", () => {
    const output = renderTextSections(
      [
        {
          title: "Complex",
          value: {
            Items: [
              { Id: 1, Name: "One" },
              { Id: 2, Name: "Two" },
            ],
            Nested: {
              Child: {
                Login: "child-login",
              },
            },
          },
        },
      ],
      { width: 44 },
    );

    expect(output).toMatchInlineSnapshot(`
      "Complex
        Items
          -
            Id:       1
            Name:     One
          -
            Id:       2
            Name:     Two
        Nested
          Child
            Login:    child-login
      "
    `);
  });

  it("formats unix *Date fields in nested message payloads", () => {
    const output = renderTextSections(
      [
        {
          title: "Messages",
          value: [
            {
              Id: 17,
              ReadDate: 1757068051,
              SendDate: "1757314190000",
            },
          ],
        },
      ],
      { width: 120 },
    );

    expect(output).toContain(formatLocalDateTime(1757068051 * 1000));
    expect(output).toContain(formatLocalDateTime(1757314190000));
    expect(output).not.toContain("1757068051");
    expect(output).not.toContain("1757314190000");
  });

  it("decodes escaped message body text and renders line breaks", () => {
    const output = renderTextSections(
      [
        {
          title: "Message",
          value: {
            Body: "Szanowni Pa\\u0144stwo,\\u003Cbr\\u003E\\u003Cbr\\u003Ewysy\\u0142am grafik obiad\\u00f3w.\\u003Cbr\\u003E\\u003Cbr\\u003EPozdrawiam\\u003Cbr\\u003EAleksandra Wojtasik",
          },
        },
      ],
      { width: 120 },
    );

    expect(output).toContain("Szanowni Państwo,");
    expect(output).toContain("wysyłam grafik obiadów.");
    expect(output).toContain("Pozdrawiam");
    expect(output).toContain("Aleksandra Wojtasik");
    expect(output).not.toContain("\\u0144");
    expect(output).not.toContain("<br>");
  });

  it("decodes JSON escapes without corrupting raw backslashes in the same body", () => {
    const output = renderTextSections(
      [
        {
          title: "Message",
          value: {
            Body: String.raw`Windows path C:\Temp\reports\nSecond line`,
          },
        },
      ],
      { width: 120 },
    );

    expect(output).toContain(String.raw`Windows path C:\Temp\reports`);
    expect(output).toContain("Second line");
    expect(output).not.toContain(String.raw`\nSecond line`);
  });

  it("decodes escaped unicode, whitespace, and quotes in message bodies", () => {
    const output = renderTextSections(
      [
        {
          title: "Message",
          value: {
            Body: String.raw`Unicode: \u0144\nTabbed:\t\"Quoted\"`,
          },
        },
      ],
      { width: 120 },
    );

    expect(output).toContain("Unicode: ń");
    expect(output).toContain("Tabbed:");
    expect(output).toContain('"Quoted"');
    expect(output).not.toContain(String.raw`\u0144`);
    expect(output).not.toContain(String.raw`\t`);
    expect(output).not.toContain(String.raw`\"Quoted\"`);
  });

  it("keeps plain body text inline and preserves invalid date-like values", () => {
    const output = renderTextSections(
      [
        {
          title: "Message",
          value: {
            Body: "Short body without markup",
            ReadDate: "not-a-timestamp",
            SendDate: 123.5,
            UpdateDate: "123456789012",
          },
        },
      ],
      { width: 120 },
    );

    expect(output).toContain("Body:");
    expect(output).toContain("Short body without markup");
    expect(output).not.toContain("Body:\n");
    expect(output).toContain("not-a-timestamp");
    expect(output).toContain("123.5");
    expect(output).toContain("123456789012");
  });

  it("keeps multiline block values readable when wrapping is required", () => {
    const output = renderTextSections(
      [
        {
          title: "Message",
          value: {
            Body: "First paragraph stays readable.\n\nSecond paragraph also wraps across lines cleanly.",
          },
        },
      ],
      { width: 34 },
    );

    expect(output).toMatchInlineSnapshot(`
      "Message
        Body:
          First paragraph stays
          readable.

          Second paragraph also wraps
          across lines cleanly.
      "
    `);
  });

  it("wraps long unbroken tokens without requiring spaces", () => {
    const output = renderTextSections(
      [
        {
          title: "Tokens",
          value: {
            LongToken: "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890",
          },
        },
      ],
      { width: 20 },
    );

    expect(output).toMatchInlineSnapshot(`
      "Tokens
        LongToken: ABCDEFG
                   HIJKLMN
                   OPQRSTU
                   VWXYZ12
                   3456789
                   0
      "
    `);
  });
});
