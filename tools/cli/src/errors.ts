import { Data } from 'effect';

export class InvalidVersionError extends Data.TaggedError('InvalidVersionError')<{
  readonly version: string;
}> {}

export class ReleaseNetworkError extends Data.TaggedError('ReleaseNetworkError')<{
  readonly cause: string;
}> {}

export class ReleaseParseError extends Data.TaggedError('ReleaseParseError')<{
  readonly cause: string;
}> {}

export class ReleaseFsError extends Data.TaggedError('ReleaseFsError')<{
  readonly operation: string;
  readonly cause: string;
}> {}

export class ReleaseNotFoundError extends Data.TaggedError('ReleaseNotFoundError')<{
  readonly cause?: string;
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

export class DirectoryConflictError extends Data.TaggedError('DirectoryConflictError')<{
  readonly path: string;
}> {}

export class DirectoryNotEmptyError extends Data.TaggedError('DirectoryNotEmptyError')<{
  readonly path: string;
}> {}

export class InvalidComponentNameError extends Data.TaggedError('InvalidComponentNameError')<{
  readonly name: string;
}> {}

export class ComponentAlreadyExistsError extends Data.TaggedError('ComponentAlreadyExistsError')<{
  readonly path: string;
}> {}

export class MissingDeployConfigError extends Data.TaggedError('MissingDeployConfigError')<{
  readonly path: string;
}> {}

export class InvalidDeployConfigError extends Data.TaggedError('InvalidDeployConfigError')<{
  readonly path: string;
  readonly cause: string;
}> {}

export class NotInFrameworkProjectError extends Data.TaggedError('NotInFrameworkProjectError')<{
  readonly path: string;
}> {}

export class AlchemyExitError extends Data.TaggedError('AlchemyExitError')<{
  readonly exitCode: number;
  readonly script: string;
}> {}

export class DeployTemplateNotFoundError extends Data.TaggedError('DeployTemplateNotFoundError')<{
  readonly target: string;
  readonly searched: string;
}> {}
