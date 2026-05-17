import { Command, InvalidArgumentError } from "commander";

import {
  LibrusSdkError,
  type ChildAccount,
  type LibrusSession,
} from "../../sdk/index.js";

import type { CliContext } from "./common.js";
import {
  addFormatOption,
  addChildOption,
  configureCommand,
  createChildApiClient,
  getSessionApiBackend,
  resolveApiV3ChildSelector,
  type CliFormatOptions,
  writeChildScopedOutput,
  writeOptionalChildScopedOutput,
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
    addChildOption(
      addFormatOption(
        new Command("list").description("List messages for a child"),
      ),
    ),
    context,
  );
  const bffList = configureCommand(
    addChildOption(
      addFormatOption(
        new Command("bff-list").description(
          "List BFF inbox messages for a child",
        ),
      ),
    ),
    context,
  );
  const get = configureCommand(
    addChildOption(
      addFormatOption(new Command("get").description("Get a message by id")),
    ),
    context,
  );
  const unread = configureCommand(
    addChildOption(
      addFormatOption(
        new Command("unread").description("List unread messages for a child"),
      ),
    ),
    context,
  );
  const wiadomosciList = configureCommand(
    addChildOption(
      addFormatOption(
        new Command("wiadomosci-list").description(
          "List messages through wiadomosci.librus.pl",
        ),
      ),
    ),
    context,
  );
  const wiadomosciGet = configureCommand(
    addChildOption(
      addFormatOption(
        new Command("wiadomosci-get").description(
          "Get a message through wiadomosci.librus.pl",
        ),
      ),
    ),
    context,
  );
  const wiadomosciUnread = configureCommand(
    addChildOption(
      addFormatOption(
        new Command("wiadomosci-unread").description(
          "List unread messages through wiadomosci.librus.pl",
        ),
      ),
    ),
    context,
  );

  list.option("--after-id <id>", "List messages after the given message id");
  list.option(
    "--backend <backend>",
    "Message backend: api3 or wiadomosci",
    parseMessageBackendName,
    "api3",
  );
  list.action(
    async (
      options: MessageBackendOptions & { afterId?: string; child?: string },
    ) => {
      const session = context.createSession();
      const { child, client } = await createMessageClient(
        session,
        options.child,
        options.backend,
      );
      const data = await client.listMessages(
        options.afterId ? { afterId: options.afterId } : {},
      );

      writeOptionalChildScopedOutput(context, options.format, child, data);
    },
  );

  bffList.action(async (options: CliFormatOptions & { child?: string }) => {
    const session = context.createSession();
    const child = await resolvePortalChild(session, options.child);
    const client = await session.forChildBff(child);
    const data = await client.listMessages();

    writeChildScopedOutput(context, options.format, child, data);
  });

  get.requiredOption("--id <id>", "Message id");
  get.option(
    "--backend <backend>",
    "Message backend: api3 or wiadomosci",
    parseMessageBackendName,
    "api3",
  );
  get.action(
    async (options: MessageBackendOptions & { child?: string; id: string }) => {
      const session = context.createSession();
      const { child, client } = await createMessageClient(
        session,
        options.child,
        options.backend,
      );
      const data = await client.getMessage(options.id);

      writeOptionalChildScopedOutput(context, options.format, child, data);
    },
  );

  unread.option(
    "--backend <backend>",
    "Message backend: api3 or wiadomosci",
    parseMessageBackendName,
    "api3",
  );
  unread.action(async (options: MessageBackendOptions & { child?: string }) => {
    const session = context.createSession();
    const { child, client } = await createMessageClient(
      session,
      options.child,
      options.backend,
    );
    const data = await client.getUnreadMessages();

    writeOptionalChildScopedOutput(context, options.format, child, data);
  });

  wiadomosciList.option(
    "--after-id <id>",
    "List messages after the given message id",
  );
  wiadomosciList.action(
    async (
      options: CliFormatOptions & { afterId?: string; child?: string },
    ) => {
      const session = context.createSession();
      const child = await resolvePortalChild(session, options.child);
      const client = await session.forChildWiadomosci(child);
      const data = await client.listMessages(
        options.afterId ? { afterId: options.afterId } : {},
      );

      writeChildScopedOutput(context, options.format, child, data);
    },
  );

  wiadomosciGet.requiredOption("--id <id>", "Message id");
  wiadomosciGet.action(
    async (options: CliFormatOptions & { child?: string; id: string }) => {
      const session = context.createSession();
      const child = await resolvePortalChild(session, options.child);
      const client = await session.forChildWiadomosci(child);
      const data = await client.getMessage(options.id);

      writeChildScopedOutput(context, options.format, child, data);
    },
  );

  wiadomosciUnread.action(
    async (options: CliFormatOptions & { child?: string }) => {
      const session = context.createSession();
      const child = await resolvePortalChild(session, options.child);
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
  childSelector: string | undefined,
  backend: MessageBackendName,
): Promise<{
  child?: ChildAccount;
  client: Awaited<ReturnType<LibrusSession["forChild"]>>;
}> {
  if (backend === "api3") {
    return createChildApiClient(session, childSelector);
  }

  const child = await resolvePortalChild(session, childSelector);

  return {
    child,
    client: await session.forChildWiadomosci(child),
  };
}

async function resolvePortalChild(
  session: LibrusSession,
  childSelector?: string,
): Promise<ChildAccount> {
  const apiBackend = getSessionApiBackend(session);

  if (apiBackend === "gateway_api_20") {
    throw new LibrusSdkError(
      "UNSUPPORTED_BACKEND",
      "This command requires api_v3 and is not available when using gateway_api_20.",
      { apiBackend },
    );
  }

  const resolvedChildSelector = resolveApiV3ChildSelector(childSelector);

  if (!resolvedChildSelector) {
    throw new LibrusSdkError(
      "CHILD_REQUIRED",
      "Child account id or login is required for api_v3. Pass --child <id-or-login> or set LIBRUS_CHILD.",
    );
  }

  return session.resolveChild(resolvedChildSelector);
}
