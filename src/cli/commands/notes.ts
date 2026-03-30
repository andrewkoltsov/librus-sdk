import { Command } from "commander";

import type { CliContext } from "./common.js";
import {
  addJsonOption,
  configureCommand,
  summarizeChildAccount,
  writeJson,
} from "./common.js";

export function createNotesCommand(context: CliContext): Command {
  const notes = configureCommand(
    new Command("notes").description("Read child notes"),
    context,
  );
  const list = configureCommand(
    addJsonOption(new Command("list").description("List notes for a child")),
    context,
  );
  const get = configureCommand(
    addJsonOption(new Command("get").description("Get a note by id")),
    context,
  );

  list.requiredOption("--child <id-or-login>", "Child account id or login");
  list.action(async (options: { child: string }) => {
    const session = context.createSession();
    const child = await session.resolveChild(options.child);
    const client = await session.forChild(child);
    const data = await client.listNotes();

    writeJson(context.stdout, {
      child: summarizeChildAccount(child),
      data,
    });
  });

  get.requiredOption("--child <id-or-login>", "Child account id or login");
  get.requiredOption("--id <id>", "Note id");
  get.action(async (options: { child: string; id: string }) => {
    const session = context.createSession();
    const child = await session.resolveChild(options.child);
    const client = await session.forChild(child);
    const data = await client.getNote(options.id);

    writeJson(context.stdout, {
      child: summarizeChildAccount(child),
      data,
    });
  });

  notes.addCommand(list);
  notes.addCommand(get);

  return notes;
}
