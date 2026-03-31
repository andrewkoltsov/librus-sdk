import { Command } from "commander";

import type { CliContext } from "./common.js";
import {
  addFormatOption,
  type CliFormatOptions,
  configureCommand,
  summarizeChildAccount,
  writeCommandOutput,
} from "./common.js";

export function createChildrenCommand(context: CliContext): Command {
  const children = configureCommand(
    new Command("children").description("Manage linked child accounts"),
    context,
  );
  const list = configureCommand(
    addFormatOption(
      new Command("list").description("List linked child accounts"),
    ),
    context,
  );

  list.action(async (options: CliFormatOptions) => {
    const session = context.createSession();
    const response = await session.getSynergiaAccounts();
    const payload = {
      lastModification: response.lastModification,
      children: response.accounts.map(summarizeChildAccount),
    };

    writeCommandOutput(context, options.format, payload, () => [
      {
        title: "Response",
        value: {
          lastModification: payload.lastModification,
        },
      },
      {
        title: "Children",
        value: payload.children,
      },
    ]);
  });

  children.addCommand(list);

  return children;
}
