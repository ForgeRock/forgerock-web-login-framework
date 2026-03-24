import { describe, it, expect } from "vitest";
import { Effect } from "effect";
import { Release, ReleaseLive } from "../../src/services/Release.js";

describe("Release", () => {
  it("constructs a GitHub archive URL from a version tag", () =>
    Effect.gen(function* () {
      const release = yield* Release;
      const url = release.archiveUrl("v1.0.0");
      expect(url).toBe(
        "https://github.com/ForgeRock/forgerock-web-login-framework/archive/refs/tags/v1.0.0.tar.gz",
      );
    }).pipe(Effect.provide(ReleaseLive), Effect.runPromise));
});
