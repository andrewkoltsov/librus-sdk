import { Command } from "commander";

import type { CliContext } from "./common.js";
import {
  addJsonOption,
  configureCommand,
  summarizeChildAccount,
  writeJson,
} from "./common.js";

export function createMessagesCommand(context: CliContext): Command {
  const messages = configureCommand(
    new Command("messages").description("Read child messages"),
    context,
  );
  const list = configureCommand(
    addJsonOption(new Command("list").description("List messages for a child")),
    context,
  );
  const get = configureCommand(
    addJsonOption(new Command("get").description("Get a message by id")),
    context,
  );
  const unread = configureCommand(
    addJsonOption(
      new Command("unread").description("List unread messages for a child"),
    ),
    context,
  );

  list.requiredOption("--child <id-or-login>", "Child account id or login");
  list.option("--after-id <id>", "List messages after the given message id");
  list.action(async (options: { afterId?: string; child: string }) => {
    const session = context.createSession();
    const child = await session.resolveChild(options.child);
    const client = await session.forChild(child);
    const data = await client.listMessages(
      options.afterId ? { afterId: options.afterId } : {},
    );

    writeJson(context.stdout, {
      child: summarizeChildAccount(child),
      data,
    });
  });

  get.requiredOption("--child <id-or-login>", "Child account id or login");
  get.requiredOption("--id <id>", "Message id");
  get.action(async (options: { child: string; id: string }) => {
    const session = context.createSession();
    const child = await session.resolveChild(options.child);
    const client = await session.forChild(child);
    const data = await client.getMessage(options.id);

    writeJson(context.stdout, {
      child: summarizeChildAccount(child),
      data,
    });
  });

  unread.requiredOption("--child <id-or-login>", "Child account id or login");
  unread.action(async (options: { child: string }) => {
    const session = context.createSession();
    const child = await session.resolveChild(options.child);
    const client = await session.forChild(child);
    const data = await client.getUnreadMessages();

    writeJson(context.stdout, {
      child: summarizeChildAccount(child),
      data,
    });
  });

  messages.addCommand(list);
  messages.addCommand(get);
  messages.addCommand(unread);

  return messages;
}
