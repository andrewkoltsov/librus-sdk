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
});
