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

export function createNotificationsCommand(context: CliContext): Command {
  const notifications = configureCommand(
    new Command("notifications").description("Read child notification data"),
    context,
  );
  const center = configureCommand(
    addChildOption(
      addFormatOption(
        new Command("center").description("Get notification center settings"),
      ),
    ),
    context,
  );
  const pushConfigurations = configureCommand(
    addChildOption(
      addFormatOption(
        new Command("push-configurations").description(
          "Get push notification configuration",
        ),
      ),
    ),
    context,
  );

  center.action(async (options: CliFormatOptions & { child?: string }) => {
    const session = context.createSession();
    const { child, client } = await createChildApiClient(
      session,
      options.child,
    );
    const data = await client.getNotificationCenter();

    writeOptionalChildScopedOutput(context, options.format, child, data);
  });

  pushConfigurations.action(
    async (options: CliFormatOptions & { child?: string }) => {
      const session = context.createSession();
      const { child, client } = await createChildApiClient(
        session,
        options.child,
      );
      const data = await client.getPushConfigurations();

      writeOptionalChildScopedOutput(context, options.format, child, data);
    },
  );

  notifications.addCommand(center);
  notifications.addCommand(pushConfigurations);

  return notifications;
}
