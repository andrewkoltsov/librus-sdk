import { Command } from "commander";

import type { CliContext } from "./common.js";
import { addJsonOption, summarizeChildAccount, writeJson } from "./common.js";

export function createMeCommand(context: CliContext): Command {
  const me = addJsonOption(new Command("me").description("Get child profile data"));

  me.requiredOption("--child <id-or-login>", "Child account id or login");
  me.action(async (options: { child: string }) => {
    const session = context.createSession();
    const child = await session.resolveChild(options.child);
    const client = await session.forChild(child);
    const data = await client.getMe();

    writeJson(context.stdout, {
      child: summarizeChildAccount(child),
      data,
    });
  });

  return me;
}
