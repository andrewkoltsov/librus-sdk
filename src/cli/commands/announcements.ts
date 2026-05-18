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

export function createAnnouncementsCommand(context: CliContext): Command {
  const announcements = configureCommand(
    new Command("announcements").description("Read child announcements"),
    context,
  );
  const list = configureCommand(
    addChildOption(
      addFormatOption(
        new Command("list").description("List school announcements"),
      ),
    ),
    context,
  );
  const get = configureCommand(
    addChildOption(
      addFormatOption(
        new Command("get").description("Get a school announcement by id"),
      ),
    ),
    context,
  );

  list.action(async (options: CliFormatOptions & { child?: string }) => {
    const session = context.createSession();
    const { child, client } = await createChildApiClient(
      session,
      options.child,
    );
    const data = await client.listSchoolNotices();

    writeOptionalChildScopedOutput(context, options.format, child, data);
  });

  get.requiredOption("--id <id>", "Announcement id");
  get.action(
    async (options: CliFormatOptions & { child?: string; id: string }) => {
      const session = context.createSession();
      const { child, client } = await createChildApiClient(
        session,
        options.child,
      );
      const data = await client.getSchoolNotice(options.id);

      writeOptionalChildScopedOutput(context, options.format, child, data);
    },
  );

  announcements.addCommand(list);
  announcements.addCommand(get);

  return announcements;
}
