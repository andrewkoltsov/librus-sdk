import { Command } from "commander";

import type { CliContext } from "./common.js";
import {
  addFormatOption,
  addChildOption,
  configureCommand,
  createChildApiClient,
  type CliFormatOptions,
  writeOptionalChildScopedOutput,
} from "./common.js";

export function createGradesCommand(context: CliContext): Command {
  const grades = configureCommand(
    new Command("grades").description("Read child grades"),
    context,
  );
  const list = configureCommand(
    addChildOption(
      addFormatOption(
        new Command("list").description("List grades for a child"),
      ),
    ),
    context,
  );

  list.action(async (options: CliFormatOptions & { child?: string }) => {
    const session = context.createSession();
    const { child, client } = await createChildApiClient(
      session,
      options.child,
    );
    const data = await client.getGrades();

    writeOptionalChildScopedOutput(context, options.format, child, data);
  });

  grades.addCommand(list);

  return grades;
}
