import { Command, InvalidArgumentError } from "commander";

import type { ChildAccount, LibrusSession } from "../../sdk/index.js";

import type { CliContext } from "./common.js";
import {
  addFormatOption,
  configureCommand,
  type CliFormatOptions,
  writeChildScopedOutput,
} from "./common.js";

type MessageBackendName = "api3" | "wiadomosci";

interface MessageBackendOptions extends CliFormatOptions {
  backend: MessageBackendName;
}

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
  const wiadomosciList = configureCommand(
    addFormatOption(
      new Command("wiadomosci-list").description(
        "List messages through wiadomosci.librus.pl",
      ),
    ),
    context,
  );
  const wiadomosciGet = configureCommand(
    addFormatOption(
      new Command("wiadomosci-get").description(
        "Get a message through wiadomosci.librus.pl",
      ),
    ),
    context,
  );
  const wiadomosciUnread = configureCommand(
    addFormatOption(
      new Command("wiadomosci-unread").description(
        "List unread messages through wiadomosci.librus.pl",
      ),
    ),
    context,
  );

  list.requiredOption("--child <id-or-login>", "Child account id or login");
  list.option("--after-id <id>", "List messages after the given message id");
  list.option(
    "--backend <backend>",
    "Message backend: api3 or wiadomosci",
    parseMessageBackendName,
    "api3",
  );
  list.action(
    async (
      options: MessageBackendOptions & { afterId?: string; child: string },
    ) => {
      const session = context.createSession();
      const child = await session.resolveChild(options.child);
      const client = await createMessageClient(session, child, options.backend);
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
  get.option(
    "--backend <backend>",
    "Message backend: api3 or wiadomosci",
    parseMessageBackendName,
    "api3",
  );
  get.action(
    async (options: MessageBackendOptions & { child: string; id: string }) => {
      const session = context.createSession();
      const child = await session.resolveChild(options.child);
      const client = await createMessageClient(session, child, options.backend);
      const data = await client.getMessage(options.id);

      writeChildScopedOutput(context, options.format, child, data);
    },
  );

  unread.requiredOption("--child <id-or-login>", "Child account id or login");
  unread.option(
    "--backend <backend>",
    "Message backend: api3 or wiadomosci",
    parseMessageBackendName,
    "api3",
  );
  unread.action(async (options: MessageBackendOptions & { child: string }) => {
    const session = context.createSession();
    const child = await session.resolveChild(options.child);
    const client = await createMessageClient(session, child, options.backend);
    const data = await client.getUnreadMessages();

    writeChildScopedOutput(context, options.format, child, data);
  });

  wiadomosciList.requiredOption(
    "--child <id-or-login>",
    "Child account id or login",
  );
  wiadomosciList.option(
    "--after-id <id>",
    "List messages after the given message id",
  );
  wiadomosciList.action(
    async (options: CliFormatOptions & { afterId?: string; child: string }) => {
      const session = context.createSession();
      const child = await session.resolveChild(options.child);
      const client = await session.forChildWiadomosci(child);
      const data = await client.listMessages(
        options.afterId ? { afterId: options.afterId } : {},
      );

      writeChildScopedOutput(context, options.format, child, data);
    },
  );

  wiadomosciGet.requiredOption(
    "--child <id-or-login>",
    "Child account id or login",
  );
  wiadomosciGet.requiredOption("--id <id>", "Message id");
  wiadomosciGet.action(
    async (options: CliFormatOptions & { child: string; id: string }) => {
      const session = context.createSession();
      const child = await session.resolveChild(options.child);
      const client = await session.forChildWiadomosci(child);
      const data = await client.getMessage(options.id);

      writeChildScopedOutput(context, options.format, child, data);
    },
  );

  wiadomosciUnread.requiredOption(
    "--child <id-or-login>",
    "Child account id or login",
  );
  wiadomosciUnread.action(
    async (options: CliFormatOptions & { child: string }) => {
      const session = context.createSession();
      const child = await session.resolveChild(options.child);
      const client = await session.forChildWiadomosci(child);
      const data = await client.getUnreadMessages();

      writeChildScopedOutput(context, options.format, child, data);
    },
  );

  messages.addCommand(list);
  messages.addCommand(bffList);
  messages.addCommand(get);
  messages.addCommand(unread);
  messages.addCommand(wiadomosciList);
  messages.addCommand(wiadomosciGet);
  messages.addCommand(wiadomosciUnread);

  return messages;
}

function parseMessageBackendName(value: string): MessageBackendName {
  if (value === "api3" || value === "wiadomosci") {
    return value;
  }

  throw new InvalidArgumentError('Expected "api3" or "wiadomosci".');
}

async function createMessageClient(
  session: LibrusSession,
  child: ChildAccount,
  backend: MessageBackendName,
): ReturnType<LibrusSession["forChild"]> {
  return backend === "wiadomosci"
    ? session.forChildWiadomosci(child)
    : session.forChild(child);
}
