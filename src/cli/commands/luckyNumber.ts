import { Command } from "commander";

import type { CliContext } from "./common.js";
import {
  addFormatOption,
  configureCommand,
  type CliFormatOptions,
  writeChildScopedOutput,
} from "./common.js";

export function createLuckyNumberCommand(context: CliContext): Command {
  const luckyNumber = configureCommand(
    new Command("lucky-number").description("Read the lucky number"),
    context,
  );
  const get = configureCommand(
    addFormatOption(new Command("get").description("Get the lucky number")),
    context,
  );

  get.requiredOption("--child <id-or-login>", "Child account id or login");
  get.option("--for-day <YYYY-MM-DD>", "Request the lucky number for a day");
  get.action(
    async (options: CliFormatOptions & { child: string; forDay?: string }) => {
      const session = context.createSession();
      const child = await session.resolveChild(options.child);
      const client = await session.forChild(child);
      const data = await client.getLuckyNumber(options.forDay);

      writeChildScopedOutput(context, options.format, child, data);
    },
  );

  luckyNumber.addCommand(get);

  return luckyNumber;
}
