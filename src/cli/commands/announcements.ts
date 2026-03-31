import { Command } from "commander";

import type { CliContext } from "./common.js";
import {
  addFormatOption,
  configureCommand,
  type CliFormatOptions,
  writeChildScopedOutput,
} from "./common.js";

export function createAnnouncementsCommand(context: CliContext): Command {
  const announcements = configureCommand(
    new Command("announcements").description("Read child announcements"),
    context,
  );
  const list = configureCommand(
    addFormatOption(
      new Command("list").description("List school announcements"),
    ),
    context,
  );
  const get = configureCommand(
    addFormatOption(
      new Command("get").description("Get a school announcement by id"),
    ),
    context,
  );

  list.requiredOption("--child <id-or-login>", "Child account id or login");
  list.action(async (options: CliFormatOptions & { child: string }) => {
    const session = context.createSession();
    const child = await session.resolveChild(options.child);
    const client = await session.forChild(child);
    const data = await client.listSchoolNotices();

    writeChildScopedOutput(context, options.format, child, data);
  });

  get.requiredOption("--child <id-or-login>", "Child account id or login");
  get.requiredOption("--id <id>", "Announcement id");
  get.action(
    async (options: CliFormatOptions & { child: string; id: string }) => {
      const session = context.createSession();
      const child = await session.resolveChild(options.child);
      const client = await session.forChild(child);
      const data = await client.getSchoolNotice(options.id);

      writeChildScopedOutput(context, options.format, child, data);
    },
  );

  announcements.addCommand(list);
  announcements.addCommand(get);

  return announcements;
}
