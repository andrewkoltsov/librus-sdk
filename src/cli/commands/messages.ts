import { Command } from "commander";

import type { CliContext } from "./common.js";
import {
  addFormatOption,
  configureCommand,
  type CliFormatOptions,
  writeChildScopedOutput,
} from "./common.js";

export function createMessagesCommand(context: CliContext): Command {
  const messages = configureCommand(
    new Command("messages").description("Read child messages"),
    context,
  );
  const list = configureCommand(
    addFormatOption(
      new Command("list").description("List messages for a child"),
    ),
    context,
  );
  const bffList = configureCommand(
    addFormatOption(
      new Command("bff-list").description(
        "List BFF inbox messages for a child",
      ),
    ),
    context,
  );
  const get = configureCommand(
    addFormatOption(new Command("get").description("Get a message by id")),
    context,
  );
  const unread = configureCommand(
    addFormatOption(
      new Command("unread").description("List unread messages for a child"),
    ),
    context,
  );

  list.requiredOption("--child <id-or-login>", "Child account id or login");
  list.option("--after-id <id>", "List messages after the given message id");
  list.action(
    async (options: CliFormatOptions & { afterId?: string; child: string }) => {
      const session = context.createSession();
      const child = await session.resolveChild(options.child);
      const client = await session.forChild(child);
      const data = await client.listMessages(
        options.afterId ? { afterId: options.afterId } : {},
      );

      writeChildScopedOutput(context, options.format, child, data);
    },
  );

  bffList.requiredOption("--child <id-or-login>", "Child account id or login");
  bffList.action(async (options: CliFormatOptions & { child: string }) => {
    const session = context.createSession();
    const child = await session.resolveChild(options.child);
    const client = await session.forChildBff(child);
    const data = await client.listMessages();

    writeChildScopedOutput(context, options.format, child, data);
  });

  get.requiredOption("--child <id-or-login>", "Child account id or login");
  get.requiredOption("--id <id>", "Message id");
  get.action(
    async (options: CliFormatOptions & { child: string; id: string }) => {
      const session = context.createSession();
      const child = await session.resolveChild(options.child);
      const client = await session.forChild(child);
      const data = await client.getMessage(options.id);

      writeChildScopedOutput(context, options.format, child, data);
    },
  );

  unread.requiredOption("--child <id-or-login>", "Child account id or login");
  unread.action(async (options: CliFormatOptions & { child: string }) => {
    const session = context.createSession();
    const child = await session.resolveChild(options.child);
    const client = await session.forChild(child);
    const data = await client.getUnreadMessages();

    writeChildScopedOutput(context, options.format, child, data);
  });

  messages.addCommand(list);
  messages.addCommand(bffList);
  messages.addCommand(get);
  messages.addCommand(unread);

  return messages;
}
