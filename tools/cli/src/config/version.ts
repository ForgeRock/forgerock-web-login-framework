import { FileSystem } from '@effect/platform';
import { Console, Effect, Schema } from 'effect';

import { GeneratorVersionError } from '../errors.js';

const GeneratorVersionSchema = Schema.Struct({
  version: Schema.String,
  commitHash: Schema.String,
  generatedAt: Schema.String,
});

export type GeneratorVersion = typeof GeneratorVersionSchema.Type;

const VERSION_FILE = '.generator-version';

const decodeGeneratorVersion = Schema.decodeUnknown(Schema.parseJson(GeneratorVersionSchema));
const encodeGeneratorVersion = Schema.encode(Schema.parseJson(GeneratorVersionSchema));

const parseGeneratorFromFile = (
  filePath: string,
): Effect.Effect<GeneratorVersion, GeneratorVersionError, FileSystem.FileSystem> =>
  FileSystem.FileSystem.pipe(
    Effect.flatMap((fs) => fs.readFileString(filePath)),
    Effect.flatMap(decodeGeneratorVersion),
    Effect.mapError(
      () =>
        new GeneratorVersionError({
          message: 'Malformed .generator-version file',
          path: filePath,
        }),
    ),
  );

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

    return yield* parseGeneratorFromFile(filePath);
  });

export const writeVersion = (directory: string, version: GeneratorVersion) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const filePath = `${directory}/${VERSION_FILE}`;
    const encoded = yield* encodeGeneratorVersion(version).pipe(Effect.orDie);
    yield* fs.writeFileString(filePath, encoded + '\n');
  });

/**
 * Asserts the given directory is a valid ping-lf project root by checking
 * for a well-formed `.generator-version` file. Fails with a user-facing
 * error message when the check does not pass.
 */
export const assertValidProject = (directory: string) =>
  readVersion(directory).pipe(
    Effect.tapError((err) =>
      Console.error(
        `\nError: ${err.message}\n` +
          `  Make sure you are running this command from the root of an\n` +
          `  initialized project (one created with "ping-lf init").\n`,
      ),
    ),
  );
