import { Command } from "@effect/cli";
import { Effect } from "effect";
import { NodeContext, NodeRuntime } from "@effect/platform-node";

const generate = Command.make("generate", {}, () =>
  Effect.log("generate: not yet implemented")
);

const update = Command.make("update", {}, () =>
  Effect.log("update: not yet implemented")
);

const command = Command.make("ping-law").pipe(
  Command.withSubcommands([generate, update])
);

const cli = Command.run(command, {
  name: "ping-law",
  version: "0.1.0",
});

cli(process.argv).pipe(Effect.provide(NodeContext.layer), NodeRuntime.runMain);
