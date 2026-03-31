import { Command } from "commander";

import type { CliContext } from "./common.js";
import {
  addFormatOption,
  configureCommand,
  type CliFormatOptions,
  writeChildScopedOutput,
} from "./common.js";

export function createTimetableCommand(context: CliContext): Command {
  const timetable = configureCommand(
    new Command("timetable").description("Read child timetable data"),
    context,
  );
  const week = configureCommand(
    addFormatOption(
      new Command("week").description("Get timetable entries for a week"),
    ),
    context,
  );
  const day = configureCommand(
    addFormatOption(
      new Command("day").description("Get timetable entries for a day"),
    ),
    context,
  );
  const entry = configureCommand(
    addFormatOption(
      new Command("entry").description("Get a timetable entry by id"),
    ),
    context,
  );

  week.requiredOption("--child <id-or-login>", "Child account id or login");
  week.requiredOption("--week-start <YYYY-MM-DD>", "Week start date");
  week.action(
    async (
      options: CliFormatOptions & { child: string; weekStart: string },
    ) => {
      const session = context.createSession();
      const child = await session.resolveChild(options.child);
      const client = await session.forChild(child);
      const data = await client.getTimetableWeek(options.weekStart);

      writeChildScopedOutput(context, options.format, child, data);
    },
  );

  day.requiredOption("--child <id-or-login>", "Child account id or login");
  day.requiredOption("--day <YYYY-MM-DD>", "Day");
  day.action(
    async (options: CliFormatOptions & { child: string; day: string }) => {
      const session = context.createSession();
      const child = await session.resolveChild(options.child);
      const client = await session.forChild(child);
      const data = await client.getTimetableDay(options.day);

      writeChildScopedOutput(context, options.format, child, data);
    },
  );

  entry.requiredOption("--child <id-or-login>", "Child account id or login");
  entry.requiredOption("--id <id>", "Timetable entry id");
  entry.action(
    async (options: CliFormatOptions & { child: string; id: string }) => {
      const session = context.createSession();
      const child = await session.resolveChild(options.child);
      const client = await session.forChild(child);
      const data = await client.getTimetableEntry(options.id);

      writeChildScopedOutput(context, options.format, child, data);
    },
  );

  timetable.addCommand(week);
  timetable.addCommand(day);
  timetable.addCommand(entry);

  return timetable;
}
