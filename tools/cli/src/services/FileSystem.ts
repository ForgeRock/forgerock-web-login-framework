import { Effect } from "effect";
import { FileSystem } from "@effect/platform";
import { isExcluded } from "../config/exclusions.js";
import { FileSystemError } from "../errors.js";
import path from "node:path";

const PROTECTED_DIRS = ["user/"] as const;

function isProtected(relativePath: string): boolean {
  return PROTECTED_DIRS.some((dir) => relativePath.startsWith(dir));
}

export const copyWithExclusions = (sourceDir: string, targetDir: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;

    const walk = (dir: string): Effect.Effect<void, FileSystemError> =>
      Effect.gen(function* () {
        const entries = yield* fs.readDirectory(dir).pipe(
          Effect.mapError(
            (cause) =>
              new FileSystemError({
                operation: "readDirectory",
                path: dir,
                cause,
              }),
          ),
        );

        for (const entry of entries) {
          const fullPath = path.join(dir, entry);
          const relativePath = path.relative(sourceDir, fullPath);

          if (isExcluded(relativePath) || isProtected(relativePath)) {
            continue;
          }

          const stat = yield* fs.stat(fullPath).pipe(
            Effect.mapError(
              (cause) =>
                new FileSystemError({
                  operation: "stat",
                  path: fullPath,
                  cause,
                }),
            ),
          );

          const targetPath = path.join(targetDir, relativePath);

          if (stat.type === "Directory") {
            yield* fs.makeDirectory(targetPath, { recursive: true }).pipe(
              Effect.mapError(
                (cause) =>
                  new FileSystemError({
                    operation: "makeDirectory",
                    path: targetPath,
                    cause,
                  }),
              ),
            );
            yield* walk(fullPath);
          } else {
            yield* fs.makeDirectory(path.dirname(targetPath), {
              recursive: true,
            }).pipe(
              Effect.mapError(
                (cause) =>
                  new FileSystemError({
                    operation: "makeDirectory",
                    path: path.dirname(targetPath),
                    cause,
                  }),
              ),
            );
            yield* fs.copyFile(fullPath, targetPath).pipe(
              Effect.mapError(
                (cause) =>
                  new FileSystemError({
                    operation: "copyFile",
                    path: fullPath,
                    cause,
                  }),
              ),
            );
          }
        }
      });

    yield* walk(sourceDir);
  });
