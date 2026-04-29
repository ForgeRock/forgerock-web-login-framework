import { Effect, Schema } from 'effect';
import { FileSystem } from '@effect/platform';
import type { PlatformError } from '@effect/platform/Error';
import path from 'node:path';

import { FileSystemError, InvalidDeployConfigError, MissingDeployConfigError } from '../errors.js';

const DeployConfigSchema = Schema.Struct({
  version: Schema.Literal(1),
  target: Schema.Literal('docker', 'cloudflare', 'aws'),
  templateDir: Schema.String,
  createdAt: Schema.String,
});

export type DeployConfig = typeof DeployConfigSchema.Type;
export type DeployTarget = DeployConfig['target'];

const CONFIG_DIR = '.ping-lf';
const CONFIG_FILE = 'config.json';

const decodeDeployConfig = Schema.decodeUnknown(Schema.parseJson(DeployConfigSchema));
const encodeDeployConfig = Schema.encode(Schema.parseJson(DeployConfigSchema));

const configPath = (projectDir: string) => path.join(projectDir, CONFIG_DIR, CONFIG_FILE);

const toCauseString = (cause: unknown): string =>
  cause instanceof Error ? cause.message : String(cause);

const wrapFsCall =
  (operation: string, fsPath: string) =>
  <A>(effect: Effect.Effect<A, PlatformError>): Effect.Effect<A, FileSystemError> => {
    const fail = (cause: PlatformError) =>
      Effect.fail(new FileSystemError({ operation, path: fsPath, cause }));
    return effect.pipe(Effect.catchTags({ SystemError: fail, BadArgument: fail }));
  };

export const readDeployConfig = (
  projectDir: string,
): Effect.Effect<
  DeployConfig,
  MissingDeployConfigError | InvalidDeployConfigError,
  FileSystem.FileSystem
> =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const filePath = configPath(projectDir);
    const exists = yield* fs.exists(filePath).pipe(Effect.orElseSucceed(() => false));

    if (!exists) {
      return yield* new MissingDeployConfigError({ path: filePath });
    }

    return yield* fs.readFileString(filePath).pipe(
      Effect.flatMap(decodeDeployConfig),
      Effect.mapError(
        (cause) => new InvalidDeployConfigError({ path: filePath, cause: toCauseString(cause) }),
      ),
    );
  });

export const writeDeployConfig = (
  projectDir: string,
  config: DeployConfig,
): Effect.Effect<void, FileSystemError, FileSystem.FileSystem> =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const dir = path.join(projectDir, CONFIG_DIR);
    const filePath = configPath(projectDir);
    yield* fs.makeDirectory(dir, { recursive: true }).pipe(wrapFsCall('makeDirectory', dir));
    const encoded = yield* encodeDeployConfig(config).pipe(Effect.orDie);
    yield* fs.writeFileString(filePath, encoded + '\n').pipe(wrapFsCall('writeFile', filePath));
  });
