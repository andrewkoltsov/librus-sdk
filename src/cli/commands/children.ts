import { Command } from "commander";

import type { CliContext } from "./common.js";
import {
  addJsonOption,
  configureCommand,
  summarizeChildAccount,
  writeJson,
} from "./common.js";

export function createChildrenCommand(context: CliContext): Command {
  const children = configureCommand(
    new Command("children").description("Manage linked child accounts"),
    context,
  );
  const list = configureCommand(
    addJsonOption(
      new Command("list").description("List linked child accounts"),
    ),
    context,
  );

  list.action(async () => {
    const session = context.createSession();
    const response = await session.getSynergiaAccounts();

    writeJson(context.stdout, {
      lastModification: response.lastModification,
      children: response.accounts.map(summarizeChildAccount),
    });
  });

  children.addCommand(list);

  return children;
}
