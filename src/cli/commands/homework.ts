import { Command } from "commander";

import type { CliContext } from "./common.js";
import {
  addJsonOption,
  configureCommand,
  summarizeChildAccount,
  writeJson,
} from "./common.js";

export function createHomeworkCommand(context: CliContext): Command {
  const homework = configureCommand(
    new Command("homework").description("Read child homework"),
    context,
  );
  const list = configureCommand(
    addJsonOption(new Command("list").description("List homework for a child")),
    context,
  );

  list.requiredOption("--child <id-or-login>", "Child account id or login");
  list.action(async (options: { child: string }) => {
    const session = context.createSession();
    const child = await session.resolveChild(options.child);
    const client = await session.forChild(child);
    const data = await client.getHomeWorks();

    writeJson(context.stdout, {
      child: summarizeChildAccount(child),
      data,
    });
  });

  homework.addCommand(list);

  return homework;
}
