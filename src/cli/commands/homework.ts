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

export function createHomeworkCommand(context: CliContext): Command {
  const homework = configureCommand(
    new Command("homework").description("Read child homework"),
    context,
  );
  const list = configureCommand(
    addChildOption(
      addFormatOption(
        new Command("list").description("List homework for a child"),
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
    const data = await client.getHomeWorks();

    writeOptionalChildScopedOutput(context, options.format, child, data);
  });

  homework.addCommand(list);

  return homework;
}
