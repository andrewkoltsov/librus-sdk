import { Command } from "commander";

import { LibrusSdkError } from "../../sdk/index.js";
import type { AuthPhoto } from "../../sdk/models/synergia/auth.js";
import type { CliContext } from "./common.js";
import {
  addFormatOption,
  configureCommand,
  createSingleDataSection,
  type CliFormatOptions,
  writeBase64Download,
  writeChildScopedOutput,
} from "./common.js";

function inferContentTypeFromFileName(fileName?: string): string | null {
  const normalized = fileName?.toLowerCase();

  if (!normalized) {
    return null;
  }

  if (normalized.endsWith(".jpg") || normalized.endsWith(".jpeg")) {
    return "image/jpeg";
  }

  if (normalized.endsWith(".png")) {
    return "image/png";
  }

  if (normalized.endsWith(".gif")) {
    return "image/gif";
  }

  if (normalized.endsWith(".webp")) {
    return "image/webp";
  }

  return null;
}

function getPhotoContent(photo?: AuthPhoto | null): string {
  if (typeof photo?.content === "string" && photo.content.length > 0) {
    return photo.content;
  }

  throw new LibrusSdkError(
    "RESPONSE_VALIDATION_FAILED",
    "Received an unexpected response from Librus.",
    {
      issues: ["Auth photo response does not include base64 content."],
    },
  );
}

export function createAuthCommand(context: CliContext): Command {
  const auth = configureCommand(
    new Command("auth").description("Read child auth-related API data"),
    context,
  );
  const photos = configureCommand(
    addFormatOption(new Command("photos").description("List auth photos")),
    context,
  );
  const photo = configureCommand(
    addFormatOption(
      new Command("photo").description("Download an auth photo by id"),
    ),
    context,
  );
  const userInfo = configureCommand(
    addFormatOption(
      new Command("user-info").description("Get auth user info by id"),
    ),
    context,
  );
  const tokenInfo = configureCommand(
    addFormatOption(
      new Command("token-info").description("Get auth token info"),
    ),
    context,
  );
  const classroom = configureCommand(
    addFormatOption(
      new Command("classroom").description("Get auth classroom data by id"),
    ),
    context,
  );

  photos.requiredOption("--child <id-or-login>", "Child account id or login");
  photos.action(async (options: CliFormatOptions & { child: string }) => {
    const session = context.createSession();
    const child = await session.resolveChild(options.child);
    const client = await session.forChild(child);
    const data = await client.listAuthPhotos();

    writeChildScopedOutput(context, options.format, child, data);
  });

  photo.requiredOption("--child <id-or-login>", "Child account id or login");
  photo.requiredOption("--id <id>", "Photo id");
  photo.requiredOption("--output <path>", "Write the photo to this file path");
  photo.action(
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
      const response = await client.getAuthPhoto(options.id);
      const photoData = response.data.photo ?? null;
      const data = writeBase64Download(
        context,
        options.output,
        getPhotoContent(photoData),
        {
          contentType: inferContentTypeFromFileName(photoData?.fileName),
        },
      );

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

  userInfo.requiredOption("--child <id-or-login>", "Child account id or login");
  userInfo.requiredOption("--id <id>", "User identifier");
  userInfo.action(
    async (options: CliFormatOptions & { child: string; id: string }) => {
      const session = context.createSession();
      const child = await session.resolveChild(options.child);
      const client = await session.forChild(child);
      const data = await client.getAuthUserInfo(options.id);

      writeChildScopedOutput(context, options.format, child, data);
    },
  );

  tokenInfo.requiredOption(
    "--child <id-or-login>",
    "Child account id or login",
  );
  tokenInfo.action(async (options: CliFormatOptions & { child: string }) => {
    const session = context.createSession();
    const child = await session.resolveChild(options.child);
    const client = await session.forChild(child);
    const data = await client.getAuthTokenInfo();

    writeChildScopedOutput(context, options.format, child, data);
  });

  classroom.requiredOption(
    "--child <id-or-login>",
    "Child account id or login",
  );
  classroom.requiredOption("--id <id>", "Classroom id");
  classroom.action(
    async (options: CliFormatOptions & { child: string; id: string }) => {
      const session = context.createSession();
      const child = await session.resolveChild(options.child);
      const client = await session.forChild(child);
      const data = await client.getAuthClassroom(options.id);

      writeChildScopedOutput(context, options.format, child, data);
    },
  );

  auth.addCommand(photos);
  auth.addCommand(photo);
  auth.addCommand(userInfo);
  auth.addCommand(tokenInfo);
  auth.addCommand(classroom);

  return auth;
}
