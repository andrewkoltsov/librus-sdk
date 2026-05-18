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

export function createLuckyNumberCommand(context: CliContext): Command {
  const luckyNumber = configureCommand(
    new Command("lucky-number").description("Read the lucky number"),
    context,
  );
  const get = configureCommand(
    addChildOption(
      addFormatOption(new Command("get").description("Get the lucky number")),
    ),
    context,
  );

  get.option("--for-day <YYYY-MM-DD>", "Request the lucky number for a day");
  get.action(
    async (options: CliFormatOptions & { child?: string; forDay?: string }) => {
      const session = context.createSession();
      const { child, client } = await createChildApiClient(
        session,
        options.child,
      );
      const data = await client.getLuckyNumber(options.forDay);

      writeOptionalChildScopedOutput(context, options.format, child, data);
    },
  );

  luckyNumber.addCommand(get);

  return luckyNumber;
}
