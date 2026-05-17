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

export function createNotesCommand(context: CliContext): Command {
  const notes = configureCommand(
    new Command("notes").description("Read child notes"),
    context,
  );
  const list = configureCommand(
    addChildOption(
      addFormatOption(
        new Command("list").description("List notes for a child"),
      ),
    ),
    context,
  );
  const get = configureCommand(
    addChildOption(
      addFormatOption(new Command("get").description("Get a note by id")),
    ),
    context,
  );

  list.action(async (options: CliFormatOptions & { child?: string }) => {
    const session = context.createSession();
    const { child, client } = await createChildApiClient(
      session,
      options.child,
    );
    const data = await client.listNotes();

    writeOptionalChildScopedOutput(context, options.format, child, data);
  });

  get.requiredOption("--id <id>", "Note id");
  get.action(
    async (options: CliFormatOptions & { child?: string; id: string }) => {
      const session = context.createSession();
      const { child, client } = await createChildApiClient(
        session,
        options.child,
      );
      const data = await client.getNote(options.id);

      writeOptionalChildScopedOutput(context, options.format, child, data);
    },
  );

  notes.addCommand(list);
  notes.addCommand(get);

  return notes;
}
