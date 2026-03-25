#!/usr/bin/env node
import { Command } from "@effect/cli";
import { Effect } from "effect";
import { NodeContext, NodeRuntime } from "@effect/platform-node";
import { generateCommand } from "./commands/generate.js";
import { updateCommand } from "./commands/update.js";
import { ReleaseLive } from "./services/Release.js";

const command = Command.make("ping-law").pipe(
  Command.withSubcommands([generateCommand, updateCommand]),
);

const cli = Command.run(command, {
  name: "ping-law",
  version: "0.1.0",
});

cli(process.argv).pipe(
  Effect.provide(ReleaseLive),
  Effect.provide(NodeContext.layer),
  NodeRuntime.runMain,
);
