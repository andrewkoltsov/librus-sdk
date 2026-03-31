import { Command } from "commander";

import type { CliContext } from "./common.js";
import {
  addFormatOption,
  configureCommand,
  type CliFormatOptions,
  writeChildScopedOutput,
} from "./common.js";

export function createJustificationsCommand(context: CliContext): Command {
  const justifications = configureCommand(
    new Command("justifications").description("Read child justifications data"),
    context,
  );
  const list = configureCommand(
    addFormatOption(new Command("list").description("List justifications")),
    context,
  );
  const get = configureCommand(
    addFormatOption(
      new Command("get").description("Get a justification by id"),
    ),
    context,
  );
  const conferences = configureCommand(
    addFormatOption(
      new Command("conferences").description("List parent-teacher conferences"),
    ),
    context,
  );
  const systemData = configureCommand(
    addFormatOption(
      new Command("system-data").description("Get system date and time"),
    ),
    context,
  );

  list.requiredOption("--child <id-or-login>", "Child account id or login");
  list.option(
    "--date-from <YYYY-MM-DD>",
    "Request justifications from this date onward",
  );
  list.action(
    async (
      options: CliFormatOptions & { child: string; dateFrom?: string },
    ) => {
      const session = context.createSession();
      const child = await session.resolveChild(options.child);
      const client = await session.forChild(child);
      const data = await client.listJustifications(
        options.dateFrom ? { dateFrom: options.dateFrom } : {},
      );

      writeChildScopedOutput(context, options.format, child, data);
    },
  );

  get.requiredOption("--child <id-or-login>", "Child account id or login");
  get.requiredOption("--id <id>", "Justification id");
  get.action(
    async (options: CliFormatOptions & { child: string; id: string }) => {
      const session = context.createSession();
      const child = await session.resolveChild(options.child);
      const client = await session.forChild(child);
      const data = await client.getJustification(options.id);

      writeChildScopedOutput(context, options.format, child, data);
    },
  );

  conferences.requiredOption(
    "--child <id-or-login>",
    "Child account id or login",
  );
  conferences.action(async (options: CliFormatOptions & { child: string }) => {
    const session = context.createSession();
    const child = await session.resolveChild(options.child);
    const client = await session.forChild(child);
    const data = await client.listParentTeacherConferences();

    writeChildScopedOutput(context, options.format, child, data);
  });

  systemData.requiredOption(
    "--child <id-or-login>",
    "Child account id or login",
  );
  systemData.action(async (options: CliFormatOptions & { child: string }) => {
    const session = context.createSession();
    const child = await session.resolveChild(options.child);
    const client = await session.forChild(child);
    const data = await client.getSystemData();

    writeChildScopedOutput(context, options.format, child, data);
  });

  justifications.addCommand(list);
  justifications.addCommand(get);
  justifications.addCommand(conferences);
  justifications.addCommand(systemData);

  return justifications;
}
