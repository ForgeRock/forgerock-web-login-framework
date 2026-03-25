import { Data } from 'effect';

export class ReleaseNotFoundError extends Data.TaggedError('ReleaseNotFoundError')<{
  readonly version: string;
  readonly cause?: unknown;
}> {}

export class FileSystemError extends Data.TaggedError('FileSystemError')<{
  readonly operation: string;
  readonly path: string;
  readonly cause?: unknown;
}> {}

export class GeneratorVersionError extends Data.TaggedError('GeneratorVersionError')<{
  readonly message: string;
  readonly path?: string;
}> {}

export class RegistryScanError extends Data.TaggedError('RegistryScanError')<{
  readonly directory: string;
  readonly cause?: unknown;
}> {}
