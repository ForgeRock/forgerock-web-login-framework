import { Effect } from 'effect';
import { FileSystem } from '@effect/platform';
import { GeneratorVersionError } from '../errors.js';

export interface GeneratorVersion {
  readonly version: string;
  readonly commitHash: string;
  readonly generatedAt: string;
}

const VERSION_FILE = '.generator-version';

export const readVersion = (directory: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const filePath = `${directory}/${VERSION_FILE}`;
    const exists = yield* fs.exists(filePath);

    if (!exists) {
      return yield* new GeneratorVersionError({
        message: 'No .generator-version file found. Is this a generated project?',
        path: filePath,
      });
    }

    const content = yield* fs.readFileString(filePath);
    return yield* Effect.try({
      try: () => JSON.parse(content) as GeneratorVersion,
      catch: () =>
        new GeneratorVersionError({
          message: 'Malformed .generator-version file',
          path: filePath,
        }),
    });
  });

export const writeVersion = (directory: string, version: GeneratorVersion) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const filePath = `${directory}/${VERSION_FILE}`;
    yield* fs.writeFileString(filePath, JSON.stringify(version, null, 2) + '\n');
  });
