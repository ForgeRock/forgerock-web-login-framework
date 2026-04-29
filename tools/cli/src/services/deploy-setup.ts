import { Effect } from 'effect';
import { FileSystem } from '@effect/platform';
import type { PlatformError } from '@effect/platform/Error';
import path from 'node:path';

import { DeployTemplateNotFoundError, FileSystemError } from '../errors.js';
import { writeDeployConfig, type DeployTarget } from '../config/deploy.js';

const TEMPLATE_DIR_NAME = 'deploy';

const TEMPLATE_DIRECTORY_BY_TARGET: Record<DeployTarget, string> = {
  docker: 'self-hosted-docker',
  cloudflare: 'cloudflare',
  aws: 'aws',
};

const wrapFsCall =
  (operation: string, fsPath: string) =>
  <A>(effect: Effect.Effect<A, PlatformError>): Effect.Effect<A, FileSystemError> => {
    const fail = (cause: PlatformError) =>
      Effect.fail(new FileSystemError({ operation, path: fsPath, cause }));
    return effect.pipe(Effect.catchTags({ SystemError: fail, BadArgument: fail }));
  };

/**
 * Recursive copy that mirrors the template directory verbatim — including the
 * template's pnpm-lock.yaml (which pins alchemy and provider SDK versions and
 * must travel with the deploy folder). Skips only `node_modules/`, since that
 * gets reinstalled at the customer site.
 */
const copyDeployTemplate = (
  sourceDir: string,
  targetDir: string,
): Effect.Effect<void, FileSystemError, FileSystem.FileSystem> =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;

    const walk = (dir: string): Effect.Effect<void, FileSystemError, FileSystem.FileSystem> =>
      Effect.gen(function* () {
        const entries = yield* fs.readDirectory(dir).pipe(wrapFsCall('readDirectory', dir));

        yield* Effect.forEach(
          entries.filter((entry) => entry !== 'node_modules'),
          (entry) =>
            Effect.gen(function* () {
              const fullPath = path.join(dir, entry);
              const relativePath = path.relative(sourceDir, fullPath);
              const stat = yield* fs.stat(fullPath).pipe(wrapFsCall('stat', fullPath));
              const targetPath = path.join(targetDir, relativePath);

              if (stat.type === 'Directory') {
                yield* fs
                  .makeDirectory(targetPath, { recursive: true })
                  .pipe(wrapFsCall('makeDirectory', targetPath));
                yield* walk(fullPath);
              } else {
                const parentDir = path.dirname(targetPath);
                yield* fs
                  .makeDirectory(parentDir, { recursive: true })
                  .pipe(wrapFsCall('makeDirectory', parentDir));
                yield* fs.copyFile(fullPath, targetPath).pipe(wrapFsCall('copyFile', fullPath));
              }
            }),
          { concurrency: 'unbounded', discard: true },
        );
      });

    yield* walk(sourceDir);
  });

/**
 * Copies the chosen `deploy-templates/<target>/` from the framework source
 * tree into `<projectDir>/deploy/`, then writes `.ping-lf/config.json` so
 * `ping-lf deploy` knows which template to invoke. Maps the friendly target
 * name (`docker`) to the underlying template directory (`self-hosted-docker`).
 */
export const setupDeployTarget = (
  projectDir: string,
  sourceDir: string,
  target: DeployTarget,
): Effect.Effect<void, DeployTemplateNotFoundError | FileSystemError, FileSystem.FileSystem> =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const templateName = TEMPLATE_DIRECTORY_BY_TARGET[target];
    const templateSourceDir = path.join(sourceDir, 'deploy-templates', templateName);
    const templateTargetDir = path.join(projectDir, TEMPLATE_DIR_NAME);

    const sourceExists = yield* fs
      .exists(templateSourceDir)
      .pipe(Effect.orElseSucceed(() => false));
    if (!sourceExists) {
      return yield* new DeployTemplateNotFoundError({
        target,
        searched: templateSourceDir,
      });
    }

    yield* fs
      .makeDirectory(templateTargetDir, { recursive: true })
      .pipe(wrapFsCall('makeDirectory', templateTargetDir));
    yield* copyDeployTemplate(templateSourceDir, templateTargetDir);

    yield* writeDeployConfig(projectDir, {
      version: 1,
      target,
      templateDir: TEMPLATE_DIR_NAME,
      createdAt: new Date().toISOString(),
    });
  });
