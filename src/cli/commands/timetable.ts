import { Command } from "commander";

import type { CliContext } from "./common.js";
import {
  addJsonOption,
  configureCommand,
  summarizeChildAccount,
  writeJson,
} from "./common.js";

export function createTimetableCommand(context: CliContext): Command {
  const timetable = configureCommand(
    new Command("timetable").description("Read child timetable data"),
    context,
  );
  const week = configureCommand(
    addJsonOption(
      new Command("week").description("Get timetable entries for a week"),
    ),
    context,
  );
  const day = configureCommand(
    addJsonOption(
      new Command("day").description("Get timetable entries for a day"),
    ),
    context,
  );
  const entry = configureCommand(
    addJsonOption(
      new Command("entry").description("Get a timetable entry by id"),
    ),
    context,
  );

  week.requiredOption("--child <id-or-login>", "Child account id or login");
  week.requiredOption("--week-start <YYYY-MM-DD>", "Week start date");
  week.action(async (options: { child: string; weekStart: string }) => {
    const session = context.createSession();
    const child = await session.resolveChild(options.child);
    const client = await session.forChild(child);
    const data = await client.getTimetableWeek(options.weekStart);

    writeJson(context.stdout, {
      child: summarizeChildAccount(child),
      data,
    });
  });

  day.requiredOption("--child <id-or-login>", "Child account id or login");
  day.requiredOption("--day <YYYY-MM-DD>", "Day");
  day.action(async (options: { child: string; day: string }) => {
    const session = context.createSession();
    const child = await session.resolveChild(options.child);
    const client = await session.forChild(child);
    const data = await client.getTimetableDay(options.day);

    writeJson(context.stdout, {
      child: summarizeChildAccount(child),
      data,
    });
  });

  entry.requiredOption("--child <id-or-login>", "Child account id or login");
  entry.requiredOption("--id <id>", "Timetable entry id");
  entry.action(async (options: { child: string; id: string }) => {
    const session = context.createSession();
    const child = await session.resolveChild(options.child);
    const client = await session.forChild(child);
    const data = await client.getTimetableEntry(options.id);

    writeJson(context.stdout, {
      child: summarizeChildAccount(child),
      data,
    });
  });

  timetable.addCommand(week);
  timetable.addCommand(day);
  timetable.addCommand(entry);

  return timetable;
}
