import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

describe("update preserves /user directory", () => {
  let targetDir: string;

  beforeEach(() => {
    targetDir = fs.mkdtempSync(path.join(os.tmpdir(), "law-update-"));

    fs.mkdirSync(path.join(targetDir, "core/journey"), { recursive: true });
    fs.writeFileSync(
      path.join(targetDir, "core/journey/journey.svelte"),
      "old framework",
    );

    fs.mkdirSync(path.join(targetDir, "user/callback/my-custom"), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(targetDir, "user/callback/my-custom/component.svelte"),
      "my custom component",
    );

    fs.writeFileSync(
      path.join(targetDir, ".generator-version"),
      JSON.stringify({
        version: "v0.9.0",
        commitHash: "v0.9.0",
        generatedAt: "2026-01-01",
      }),
    );
  });

  afterEach(() => {
    fs.rmSync(targetDir, { recursive: true, force: true });
  });

  it("user directory is untouched after framework copy", async () => {
    const { copyWithExclusions } = await import(
      "../src/services/FileSystem.js"
    );
    const { Effect } = await import("effect");
    const { NodeContext } = await import("@effect/platform-node");

    const sourceDir = fs.mkdtempSync(path.join(os.tmpdir(), "law-new-"));
    fs.mkdirSync(path.join(sourceDir, "core/journey"), { recursive: true });
    fs.writeFileSync(
      path.join(sourceDir, "core/journey/journey.svelte"),
      "new framework",
    );

    await copyWithExclusions(sourceDir, targetDir).pipe(
      Effect.provide(NodeContext.layer),
      Effect.runPromise,
    );

    expect(
      fs.readFileSync(
        path.join(targetDir, "core/journey/journey.svelte"),
        "utf-8",
      ),
    ).toBe("new framework");
    expect(
      fs.readFileSync(
        path.join(targetDir, "user/callback/my-custom/component.svelte"),
        "utf-8",
      ),
    ).toBe("my custom component");

    fs.rmSync(sourceDir, { recursive: true, force: true });
  });
});
