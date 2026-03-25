import { describe, it, expect } from "vitest";
import { isExcluded } from "../../src/config/exclusions.js";

describe("isExcluded", () => {
  it("excludes .github/workflows directory", () => {
    expect(isExcluded(".github/workflows/ci.yml")).toBe(true);
    expect(isExcluded(".github/workflows/release.yml")).toBe(true);
  });

  it("excludes .changeset directory", () => {
    expect(isExcluded(".changeset/config.json")).toBe(true);
  });

  it("excludes internal config files", () => {
    expect(isExcluded(".claude/")).toBe(true);
    expect(isExcluded("CLAUDE.md")).toBe(true);
    expect(isExcluded(".mcp.json")).toBe(true);
  });

  it("excludes git, lock, workspace, and root config files", () => {
    expect(isExcluded(".git/HEAD")).toBe(true);
    expect(isExcluded("pnpm-lock.yaml")).toBe(true);
    expect(isExcluded("pnpm-workspace.yaml")).toBe(true);
    expect(isExcluded("tsconfig.json")).toBe(true);
    expect(isExcluded(".env")).toBe(true);
  });

  it("excludes node_modules and build output", () => {
    expect(isExcluded("node_modules/foo/bar.js")).toBe(true);
    expect(isExcluded("packages/login-widget/dist/index.js")).toBe(true);
    expect(isExcluded("storybook-static/index.html")).toBe(true);
  });

  it("excludes CLI tooling", () => {
    expect(isExcluded("tools/cli/package.json")).toBe(true);
    expect(isExcluded("tools/cli/src/main.ts")).toBe(true);
  });

  it("preserves framework source code", () => {
    expect(isExcluded("core/journey/journey.svelte")).toBe(false);
    expect(isExcluded("packages/login-widget/package.json")).toBe(false);
    expect(isExcluded("apps/login-app/src/routes/+page.svelte")).toBe(false);
  });

  it("preserves config files needed by customers", () => {
    expect(isExcluded(".npmrc")).toBe(false);
    expect(isExcluded("eslint.config.js")).toBe(false);
    expect(isExcluded(".prettierrc")).toBe(false);
    expect(isExcluded("postcss.config.cjs")).toBe(false);
  });

  it("preserves nested tsconfigs (only root excluded)", () => {
    expect(isExcluded("core/tsconfig.json")).toBe(false);
    expect(isExcluded("packages/login-widget/tsconfig.json")).toBe(false);
  });
});
