import { Command } from "commander";

import type { CliContext } from "./common.js";
import {
  addJsonOption,
  configureCommand,
  summarizeChildAccount,
  writeJson,
} from "./common.js";

export function createNotificationsCommand(context: CliContext): Command {
  const notifications = configureCommand(
    new Command("notifications").description("Read child notification data"),
    context,
  );
  const center = configureCommand(
    addJsonOption(
      new Command("center").description("Get notification center settings"),
    ),
    context,
  );
  const pushConfigurations = configureCommand(
    addJsonOption(
      new Command("push-configurations").description(
        "Get push notification configuration",
      ),
    ),
    context,
  );

  center.requiredOption("--child <id-or-login>", "Child account id or login");
  center.action(async (options: { child: string }) => {
    const session = context.createSession();
    const child = await session.resolveChild(options.child);
    const client = await session.forChild(child);
    const data = await client.getNotificationCenter();

    writeJson(context.stdout, { child: summarizeChildAccount(child), data });
  });

  pushConfigurations.requiredOption(
    "--child <id-or-login>",
    "Child account id or login",
  );
  pushConfigurations.action(async (options: { child: string }) => {
    const session = context.createSession();
    const child = await session.resolveChild(options.child);
    const client = await session.forChild(child);
    const data = await client.getPushConfigurations();

    writeJson(context.stdout, { child: summarizeChildAccount(child), data });
  });

  notifications.addCommand(center);
  notifications.addCommand(pushConfigurations);

  return notifications;
}
