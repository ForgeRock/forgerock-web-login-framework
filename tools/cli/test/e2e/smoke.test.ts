import { describe, it, expect, afterEach } from "vitest";
import { Effect } from "effect";
import { NodeContext } from "@effect/platform-node";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  scaffoldUserDirectory,
  scaffoldCi,
  scaffoldEnvExample,
} from "../../src/commands/generate.js";
import {
  scanUserDirectory,
  generateRegistrySource,
} from "../../src/services/Registry.js";

describe("ping-law generate (smoke)", () => {
  let targetDir: string;

  afterEach(() => {
    if (targetDir) fs.rmSync(targetDir, { recursive: true, force: true });
  });

  it("scaffolds user directory and templates", () => {
    targetDir = fs.mkdtempSync(path.join(os.tmpdir(), "law-smoke-"));

    return Effect.all([
      scaffoldUserDirectory(targetDir),
      scaffoldCi(targetDir),
      scaffoldEnvExample(targetDir),
    ]).pipe(
      Effect.andThen(() => {
        expect(
          fs.existsSync(
            path.join(targetDir, "user/stage/demo-stage/component.svelte"),
          ),
        ).toBe(true);
        expect(
          fs.existsSync(
            path.join(
              targetDir,
              "user/callback/demo-callback/component.svelte",
            ),
          ),
        ).toBe(true);
        expect(
          fs.existsSync(
            path.join(targetDir, ".github/workflows/ci.yml"),
          ),
        ).toBe(true);
        expect(
          fs.existsSync(path.join(targetDir, ".env.example")),
        ).toBe(true);

        const demoCallback = fs.readFileSync(
          path.join(
            targetDir,
            "user/callback/demo-callback/component.svelte",
          ),
          "utf-8",
        );
        expect(demoCallback).toContain("@component");
        expect(demoCallback).toContain("Type: callback");
        expect(demoCallback).toContain("Name: DemoCallback");
      }),
      Effect.provide(NodeContext.layer),
      Effect.runPromise,
    );
  });

  it("scan generates valid registry from demo components", () => {
    targetDir = fs.mkdtempSync(path.join(os.tmpdir(), "law-smoke-"));

    return scaffoldUserDirectory(targetDir).pipe(
      Effect.andThen(() => {
        const components = scanUserDirectory(
          path.join(targetDir, "user"),
        );
        expect(components).toHaveLength(2);

        const source = generateRegistrySource(components);
        expect(source).toContain("DemoCallback");
        expect(source).toContain("DemoStage");
        expect(source).toContain("customStages");
        expect(source).toContain("customCallbacks");
      }),
      Effect.provide(NodeContext.layer),
      Effect.runPromise,
    );
  });
});
