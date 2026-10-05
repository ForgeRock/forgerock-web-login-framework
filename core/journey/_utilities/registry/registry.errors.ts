import { Data } from 'effect';

export class RegistryScanError extends Data.TaggedError('RegistryScanError')<{
  readonly directory: string;
  readonly cause?: unknown;
}> {}

/** Raised when components collide on a generated identifier or registry key. */
export class RegistryCollisionError extends Data.TaggedError('RegistryCollisionError')<{
  readonly kind: 'name-collision';
  readonly type: string;
  readonly name: string;
  readonly filePaths: string[];
}> {
  get message(): string {
    const collidingFiles = this.filePaths.map((filePath) => `  - ${filePath}`).join('\n');
    return (
      `Duplicate component name "${this.name}" in type "${this.type}". Colliding files:\n` +
      collidingFiles +
      `\nRename one component's "Name:" field so every ${this.type} has a unique generated identifier.`
    );
  }
}

/**
 * Raised when more than one header or footer component declares
 * `Enabled: true` in its `@component` header. Only one component of each type
 * is bundled with the login app; the rest stay dormant on disk.
 */
export class RegistryEnabledLimitError extends Data.TaggedError('RegistryEnabledLimitError')<{
  readonly type: 'header' | 'footer';
  readonly filePaths: string[];
}> {
  get message(): string {
    const enabledFiles = this.filePaths.map((filePath) => `  - ${filePath}`).join('\n');
    return (
      `More than one ${this.type} component is enabled. Enabled files:\n` +
      enabledFiles +
      `\nExactly one ${this.type} may declare "Enabled: true" in its @component header. ` +
      `Remove the "Enabled: true" line (or set "Enabled: false") from all but one file.`
    );
  }
}
