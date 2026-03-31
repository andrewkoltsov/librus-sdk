import { Command } from "commander";

import type { CliContext } from "./common.js";
import {
  addFormatOption,
  configureCommand,
  createSingleDataSection,
  type CliFormatOptions,
  writeBinaryDownload,
  writeChildScopedOutput,
} from "./common.js";

export function createLessonsCommand(context: CliContext): Command {
  const lessons = configureCommand(
    new Command("lessons").description("Read child lesson data"),
    context,
  );
  const list = configureCommand(
    addFormatOption(new Command("list").description("List lessons")),
    context,
  );
  const get = configureCommand(
    addFormatOption(new Command("get").description("Get a lesson by id")),
    context,
  );
  const plannedList = configureCommand(
    addFormatOption(
      new Command("planned-list").description("List planned lessons"),
    ),
    context,
  );
  const plannedGet = configureCommand(
    addFormatOption(
      new Command("planned-get").description("Get a planned lesson by id"),
    ),
    context,
  );
  const plannedAttachment = configureCommand(
    addFormatOption(
      new Command("planned-attachment").description(
        "Download a planned lesson attachment",
      ),
    ),
    context,
  );
  const realizationsList = configureCommand(
    addFormatOption(
      new Command("realizations-list").description("List lesson realizations"),
    ),
    context,
  );
  const realizationsGet = configureCommand(
    addFormatOption(
      new Command("realizations-get").description(
        "Get a lesson realization by id",
      ),
    ),
    context,
  );

  list.requiredOption("--child <id-or-login>", "Child account id or login");
  list.action(async (options: CliFormatOptions & { child: string }) => {
    const session = context.createSession();
    const child = await session.resolveChild(options.child);
    const client = await session.forChild(child);
    const data = await client.listLessons();

    writeChildScopedOutput(context, options.format, child, data);
  });

  get.requiredOption("--child <id-or-login>", "Child account id or login");
  get.requiredOption("--id <id>", "Lesson id");
  get.action(
    async (options: CliFormatOptions & { child: string; id: string }) => {
      const session = context.createSession();
      const child = await session.resolveChild(options.child);
      const client = await session.forChild(child);
      const data = await client.getLesson(options.id);

      writeChildScopedOutput(context, options.format, child, data);
    },
  );

  plannedList.requiredOption(
    "--child <id-or-login>",
    "Child account id or login",
  );
  plannedList.action(async (options: CliFormatOptions & { child: string }) => {
    const session = context.createSession();
    const child = await session.resolveChild(options.child);
    const client = await session.forChild(child);
    const data = await client.listPlannedLessons();

    writeChildScopedOutput(context, options.format, child, data);
  });

  plannedGet.requiredOption(
    "--child <id-or-login>",
    "Child account id or login",
  );
  plannedGet.requiredOption("--id <id>", "Planned lesson id");
  plannedGet.action(
    async (options: CliFormatOptions & { child: string; id: string }) => {
      const session = context.createSession();
      const child = await session.resolveChild(options.child);
      const client = await session.forChild(child);
      const data = await client.getPlannedLesson(options.id);

      writeChildScopedOutput(context, options.format, child, data);
    },
  );

  plannedAttachment.requiredOption(
    "--child <id-or-login>",
    "Child account id or login",
  );
  plannedAttachment.requiredOption("--id <id>", "Attachment id");
  plannedAttachment.requiredOption(
    "--output <path>",
    "Write the attachment to this file path",
  );
  plannedAttachment.action(
    async (
      options: CliFormatOptions & {
        child: string;
        id: string;
        output: string;
      },
    ) => {
      const session = context.createSession();
      const child = await session.resolveChild(options.child);
      const client = await session.forChild(child);
      const file = await client.getPlannedLessonAttachment(options.id);
      const data = writeBinaryDownload(context, options.output, file);

      writeChildScopedOutput(
        context,
        options.format,
        child,
        data,
        (summary) => [
          { title: "Child", value: summary },
          ...createSingleDataSection("Saved File", data),
        ],
      );
    },
  );

  realizationsList.requiredOption(
    "--child <id-or-login>",
    "Child account id or login",
  );
  realizationsList.action(
    async (options: CliFormatOptions & { child: string }) => {
      const session = context.createSession();
      const child = await session.resolveChild(options.child);
      const client = await session.forChild(child);
      const data = await client.listRealizations();

      writeChildScopedOutput(context, options.format, child, data);
    },
  );

  realizationsGet.requiredOption(
    "--child <id-or-login>",
    "Child account id or login",
  );
  realizationsGet.requiredOption("--id <id>", "Realization id");
  realizationsGet.action(
    async (options: CliFormatOptions & { child: string; id: string }) => {
      const session = context.createSession();
      const child = await session.resolveChild(options.child);
      const client = await session.forChild(child);
      const data = await client.getRealization(options.id);

      writeChildScopedOutput(context, options.format, child, data);
    },
  );

  lessons.addCommand(list);
  lessons.addCommand(get);
  lessons.addCommand(plannedList);
  lessons.addCommand(plannedGet);
  lessons.addCommand(plannedAttachment);
  lessons.addCommand(realizationsList);
  lessons.addCommand(realizationsGet);

  return lessons;
}
