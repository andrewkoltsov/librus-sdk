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

export function createMeCommand(context: CliContext): Command {
  const me = configureCommand(
    addChildOption(
      addFormatOption(new Command("me").description("Get child profile data")),
    ),
    context,
  );

  me.action(async (options: CliFormatOptions & { child?: string }) => {
    const session = context.createSession();
    const { child, client } = await createChildApiClient(
      session,
      options.child,
    );
    const data = await client.getMe();

    writeOptionalChildScopedOutput(context, options.format, child, data);
  });

  return me;
}
