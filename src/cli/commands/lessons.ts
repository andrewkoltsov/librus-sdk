import { Command } from "commander";

import type { CliContext } from "./common.js";
import {
  addFormatOption,
  addChildOption,
  configureCommand,
  createChildApiClient,
  createSingleDataSection,
  type CliFormatOptions,
  writeBinaryDownload,
  writeOptionalChildScopedOutput,
} from "./common.js";

export function createLessonsCommand(context: CliContext): Command {
  const lessons = configureCommand(
    new Command("lessons").description("Read child lesson data"),
    context,
  );
  const list = configureCommand(
    addChildOption(
      addFormatOption(new Command("list").description("List lessons")),
    ),
    context,
  );
  const get = configureCommand(
    addChildOption(
      addFormatOption(new Command("get").description("Get a lesson by id")),
    ),
    context,
  );
  const plannedList = configureCommand(
    addChildOption(
      addFormatOption(
        new Command("planned-list").description("List planned lessons"),
      ),
    ),
    context,
  );
  const plannedGet = configureCommand(
    addChildOption(
      addFormatOption(
        new Command("planned-get").description("Get a planned lesson by id"),
      ),
    ),
    context,
  );
  const plannedAttachment = configureCommand(
    addChildOption(
      addFormatOption(
        new Command("planned-attachment").description(
          "Download a planned lesson attachment",
        ),
      ),
    ),
    context,
  );
  const realizationsList = configureCommand(
    addChildOption(
      addFormatOption(
        new Command("realizations-list").description(
          "List lesson realizations",
        ),
      ),
    ),
    context,
  );
  const realizationsGet = configureCommand(
    addChildOption(
      addFormatOption(
        new Command("realizations-get").description(
          "Get a lesson realization by id",
        ),
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
    const data = await client.listLessons();

    writeOptionalChildScopedOutput(context, options.format, child, data);
  });

  get.requiredOption("--id <id>", "Lesson id");
  get.action(
    async (options: CliFormatOptions & { child?: string; id: string }) => {
      const session = context.createSession();
      const { child, client } = await createChildApiClient(
        session,
        options.child,
      );
      const data = await client.getLesson(options.id);

      writeOptionalChildScopedOutput(context, options.format, child, data);
    },
  );

  plannedList.action(async (options: CliFormatOptions & { child?: string }) => {
    const session = context.createSession();
    const { child, client } = await createChildApiClient(
      session,
      options.child,
    );
    const data = await client.listPlannedLessons();

    writeOptionalChildScopedOutput(context, options.format, child, data);
  });

  plannedGet.requiredOption("--id <id>", "Planned lesson id");
  plannedGet.action(
    async (options: CliFormatOptions & { child?: string; id: string }) => {
      const session = context.createSession();
      const { child, client } = await createChildApiClient(
        session,
        options.child,
      );
      const data = await client.getPlannedLesson(options.id);

      writeOptionalChildScopedOutput(context, options.format, child, data);
    },
  );

  plannedAttachment.requiredOption("--id <id>", "Attachment id");
  plannedAttachment.requiredOption(
    "--output <path>",
    "Write the attachment to this file path",
  );
  plannedAttachment.action(
    async (
      options: CliFormatOptions & {
        child?: string;
        id: string;
        output: string;
      },
    ) => {
      const session = context.createSession();
      const { child, client } = await createChildApiClient(
        session,
        options.child,
      );
      const file = await client.getPlannedLessonAttachment(options.id);
      const data = writeBinaryDownload(context, options.output, file);

      writeOptionalChildScopedOutput(
        context,
        options.format,
        child,
        data,
        (summary) =>
          summary
            ? [
                { title: "Child", value: summary },
                ...createSingleDataSection("Saved File", data),
              ]
            : createSingleDataSection("Saved File", data),
      );
    },
  );

  realizationsList.action(
    async (options: CliFormatOptions & { child?: string }) => {
      const session = context.createSession();
      const { child, client } = await createChildApiClient(
        session,
        options.child,
      );
      const data = await client.listRealizations();

      writeOptionalChildScopedOutput(context, options.format, child, data);
    },
  );

  realizationsGet.requiredOption("--id <id>", "Realization id");
  realizationsGet.action(
    async (options: CliFormatOptions & { child?: string; id: string }) => {
      const session = context.createSession();
      const { child, client } = await createChildApiClient(
        session,
        options.child,
      );
      const data = await client.getRealization(options.id);

      writeOptionalChildScopedOutput(context, options.format, child, data);
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
