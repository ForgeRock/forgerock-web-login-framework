import { Context, Effect, Layer } from 'effect';
import { spawn } from 'node:child_process';

export class ProcessRunner extends Context.Tag('ProcessRunner')<
  ProcessRunner,
  {
    readonly run: (
      command: string,
      args: ReadonlyArray<string>,
      options: { readonly cwd: string },
    ) => Effect.Effect<number>;
  }
>() {}

export const NodeProcessRunnerLayer = Layer.succeed(ProcessRunner, {
  run: (command, args, options) =>
    Effect.async<number>((resume) => {
      const child = spawn(command, [...args], {
        cwd: options.cwd,
        stdio: 'inherit',
        shell: false,
      });
      child.on('exit', (code) => resume(Effect.succeed(code ?? 1)));
      child.on('error', () => resume(Effect.succeed(1)));
      return Effect.sync(() => {
        child.kill();
      });
    }),
});
