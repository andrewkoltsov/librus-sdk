import { Command } from "commander";

import type { CliContext } from "./common.js";
import {
  addJsonOption,
  configureCommand,
  summarizeChildAccount,
  writeJson,
} from "./common.js";

export function createJustificationsCommand(context: CliContext): Command {
  const justifications = configureCommand(
    new Command("justifications").description("Read child justifications data"),
    context,
  );
  const list = configureCommand(
    addJsonOption(new Command("list").description("List justifications")),
    context,
  );
  const get = configureCommand(
    addJsonOption(new Command("get").description("Get a justification by id")),
    context,
  );
  const conferences = configureCommand(
    addJsonOption(
      new Command("conferences").description("List parent-teacher conferences"),
    ),
    context,
  );
  const systemData = configureCommand(
    addJsonOption(
      new Command("system-data").description("Get system date and time"),
    ),
    context,
  );

  list.requiredOption("--child <id-or-login>", "Child account id or login");
  list.option(
    "--date-from <YYYY-MM-DD>",
    "Request justifications from this date onward",
  );
  list.action(async (options: { child: string; dateFrom?: string }) => {
    const session = context.createSession();
    const child = await session.resolveChild(options.child);
    const client = await session.forChild(child);
    const data = await client.listJustifications(
      options.dateFrom ? { dateFrom: options.dateFrom } : {},
    );

    writeJson(context.stdout, { child: summarizeChildAccount(child), data });
  });

  get.requiredOption("--child <id-or-login>", "Child account id or login");
  get.requiredOption("--id <id>", "Justification id");
  get.action(async (options: { child: string; id: string }) => {
    const session = context.createSession();
    const child = await session.resolveChild(options.child);
    const client = await session.forChild(child);
    const data = await client.getJustification(options.id);

    writeJson(context.stdout, { child: summarizeChildAccount(child), data });
  });

  conferences.requiredOption(
    "--child <id-or-login>",
    "Child account id or login",
  );
  conferences.action(async (options: { child: string }) => {
    const session = context.createSession();
    const child = await session.resolveChild(options.child);
    const client = await session.forChild(child);
    const data = await client.listParentTeacherConferences();

    writeJson(context.stdout, { child: summarizeChildAccount(child), data });
  });

  systemData.requiredOption(
    "--child <id-or-login>",
    "Child account id or login",
  );
  systemData.action(async (options: { child: string }) => {
    const session = context.createSession();
    const child = await session.resolveChild(options.child);
    const client = await session.forChild(child);
    const data = await client.getSystemData();

    writeJson(context.stdout, { child: summarizeChildAccount(child), data });
  });

  justifications.addCommand(list);
  justifications.addCommand(get);
  justifications.addCommand(conferences);
  justifications.addCommand(systemData);

  return justifications;
}
