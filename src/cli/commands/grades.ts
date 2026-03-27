import { Command } from "commander";

import type { CliContext } from "./common.js";
import { addJsonOption, summarizeChildAccount, writeJson } from "./common.js";

export function createGradesCommand(context: CliContext): Command {
  const grades = new Command("grades").description("Read child grades");
  const list = addJsonOption(new Command("list").description("List grades for a child"));

  list.requiredOption("--child <id-or-login>", "Child account id or login");
  list.action(async (options: { child: string }) => {
    const session = context.createSession();
    const child = await session.resolveChild(options.child);
    const client = await session.forChild(child);
    const data = await client.getGrades();

    writeJson(context.stdout, {
      child: summarizeChildAccount(child),
      data,
    });
  });

  grades.addCommand(list);

  return grades;
}
