import { Command } from "commander";

import type { CliContext } from "./common.js";
import {
  addFormatOption,
  configureCommand,
  type CliFormatOptions,
  writeChildScopedOutput,
} from "./common.js";

export function createMeCommand(context: CliContext): Command {
  const me = configureCommand(
    addFormatOption(new Command("me").description("Get child profile data")),
    context,
  );

  me.requiredOption("--child <id-or-login>", "Child account id or login");
  me.action(async (options: CliFormatOptions & { child: string }) => {
    const session = context.createSession();
    const child = await session.resolveChild(options.child);
    const client = await session.forChild(child);
    const data = await client.getMe();

    writeChildScopedOutput(context, options.format, child, data);
  });

  return me;
}
