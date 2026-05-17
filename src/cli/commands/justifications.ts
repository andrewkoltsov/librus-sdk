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

export function createJustificationsCommand(context: CliContext): Command {
  const justifications = configureCommand(
    new Command("justifications").description("Read child justifications data"),
    context,
  );
  const list = configureCommand(
    addChildOption(
      addFormatOption(new Command("list").description("List justifications")),
    ),
    context,
  );
  const get = configureCommand(
    addChildOption(
      addFormatOption(
        new Command("get").description("Get a justification by id"),
      ),
    ),
    context,
  );
  const conferences = configureCommand(
    addChildOption(
      addFormatOption(
        new Command("conferences").description(
          "List parent-teacher conferences",
        ),
      ),
    ),
    context,
  );
  const systemData = configureCommand(
    addChildOption(
      addFormatOption(
        new Command("system-data").description("Get system date and time"),
      ),
    ),
    context,
  );

  list.option(
    "--date-from <YYYY-MM-DD>",
    "Request justifications from this date onward",
  );
  list.action(
    async (
      options: CliFormatOptions & { child?: string; dateFrom?: string },
    ) => {
      const session = context.createSession();
      const { child, client } = await createChildApiClient(
        session,
        options.child,
      );
      const data = await client.listJustifications(
        options.dateFrom ? { dateFrom: options.dateFrom } : {},
      );

      writeOptionalChildScopedOutput(context, options.format, child, data);
    },
  );

  get.requiredOption("--id <id>", "Justification id");
  get.action(
    async (options: CliFormatOptions & { child?: string; id: string }) => {
      const session = context.createSession();
      const { child, client } = await createChildApiClient(
        session,
        options.child,
      );
      const data = await client.getJustification(options.id);

      writeOptionalChildScopedOutput(context, options.format, child, data);
    },
  );

  conferences.action(async (options: CliFormatOptions & { child?: string }) => {
    const session = context.createSession();
    const { child, client } = await createChildApiClient(
      session,
      options.child,
    );
    const data = await client.listParentTeacherConferences();

    writeOptionalChildScopedOutput(context, options.format, child, data);
  });

  systemData.action(async (options: CliFormatOptions & { child?: string }) => {
    const session = context.createSession();
    const { child, client } = await createChildApiClient(
      session,
      options.child,
    );
    const data = await client.getSystemData();

    writeOptionalChildScopedOutput(context, options.format, child, data);
  });

  justifications.addCommand(list);
  justifications.addCommand(get);
  justifications.addCommand(conferences);
  justifications.addCommand(systemData);

  return justifications;
}
