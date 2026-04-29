import { Path } from '@effect/platform';
import { Console, Effect, Option, pipe } from 'effect';

import { expandTilde } from '../services/file-system.js';
import { Release } from '../services/release.js';

/**
 * Resolves the framework source directory and version from a local path or a
 * GitHub release download.  Shared by `init` and `update` commands.
 *
 * @param local   - Optional local framework directory path.
 * @param version - Optional explicit release version tag.
 * @param targetDir - Directory that will receive the downloaded release temp
 *                    folder (`.framework-tmp`).
 */
export const resolveSource = (
  local: Option.Option<string>,
  version: Option.Option<string>,
  targetDir: string,
) =>
  Effect.gen(function* () {
    const path = yield* Path.Path;
    const release = yield* Release;

    return yield* Option.match(local, {
      onSome: (localPath) =>
        pipe(
          Effect.sync(() => path.resolve(expandTilde(localPath))),
          Effect.tap((dir) => Console.log(`Using local source: ${dir}`)),
          Effect.map((dir) => ({ sourceDir: dir, resolvedVersion: 'local' as const })),
        ),
      onNone: () =>
        pipe(
          Option.match(version, {
            onSome: (v) =>
              pipe(
                Effect.tap(Effect.succeed(v), (v) =>
                  Console.log(`Fetching framework version: ${v}...`),
                ),
                Effect.flatMap((v) =>
                  pipe(
                    release.fetch(v, targetDir),
                    Effect.map((sourceDir) => ({ sourceDir, resolvedVersion: v })),
                  ),
                ),
              ),
            onNone: () =>
              pipe(
                Console.log('Fetching framework from main branch...'),
                Effect.flatMap(() => release.fetchBranch('main', targetDir)),
                Effect.map((sourceDir) => ({ sourceDir, resolvedVersion: 'main' as const })),
              ),
          }),
        ),
    });
  });
