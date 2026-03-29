import { Command } from "commander";

import type { CliContext } from "./common.js";
import {
  addJsonOption,
  configureCommand,
  summarizeChildAccount,
  writeJson,
} from "./common.js";

export function createAttendanceCommand(context: CliContext): Command {
  const attendance = configureCommand(
    new Command("attendance").description("Read child attendance"),
    context,
  );
  const list = configureCommand(
    addJsonOption(
      new Command("list").description("List attendances for a child"),
    ),
    context,
  );

  list.requiredOption("--child <id-or-login>", "Child account id or login");
  list.action(async (options: { child: string }) => {
    const session = context.createSession();
    const child = await session.resolveChild(options.child);
    const client = await session.forChild(child);
    const data = await client.getAttendances();

    writeJson(context.stdout, {
      child: summarizeChildAccount(child),
      data,
    });
  });

  attendance.addCommand(list);

  return attendance;
}
