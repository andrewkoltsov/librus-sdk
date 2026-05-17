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

export function createAttendanceCommand(context: CliContext): Command {
  const attendance = configureCommand(
    new Command("attendance").description("Read child attendance"),
    context,
  );
  const list = configureCommand(
    addChildOption(
      addFormatOption(
        new Command("list").description("List attendances for a child"),
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
    const data = await client.getAttendances();

    writeOptionalChildScopedOutput(context, options.format, child, data);
  });

  attendance.addCommand(list);

  return attendance;
}
