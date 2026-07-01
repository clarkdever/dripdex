import { describe, expect, it } from "vitest";

import {
  createVercelEnvArgs,
  createSyncPlan,
  parseDotenvContent,
  parseExampleKeys,
  requireProjectConfirmation,
  syncVercelEnvValue
} from "./sync-vercel-production-env.mjs";

describe("Vercel production env sync helper", () => {
  it("parses dotenv values without expanding or printing secrets", () => {
    expect(
      parseDotenvContent(`
# comment
DRIPDEX_OWNER_USERNAME=owner
DRIPDEX_OWNER_PASSWORD_HASH='scrypt$v1$example'
OPENAI_API_KEY="test-openai-key"
EMPTY_VALUE=
`)
    ).toEqual(
      new Map([
        ["DRIPDEX_OWNER_USERNAME", "owner"],
        ["DRIPDEX_OWNER_PASSWORD_HASH", "scrypt$v1$example"],
        ["OPENAI_API_KEY", "test-openai-key"],
        ["EMPTY_VALUE", ""]
      ])
    );
  });

  it("plans only populated keys listed in the example file", () => {
    const exampleKeys = parseExampleKeys(`
DRIPDEX_OWNER_USERNAME=owner
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
`);
    const localValues = parseDotenvContent(`
DRIPDEX_OWNER_USERNAME=owner
OPENAI_API_KEY=test-openai-key
UNLISTED_SECRET=do-not-sync
`);

    expect(createSyncPlan(exampleKeys, localValues, new Set(["OPENAI_API_KEY"]))).toEqual([
      {
        action: "add",
        name: "DRIPDEX_OWNER_USERNAME",
        sensitive: true
      },
      {
        action: "update",
        name: "OPENAI_API_KEY",
        sensitive: true
      }
    ]);
  });

  it("marks Vercel env add and update commands as sensitive", () => {
    expect(
      createVercelEnvArgs({
        action: "add",
        environment: "production",
        name: "OPENAI_API_KEY",
        sensitive: true
      })
    ).toEqual(["env", "add", "OPENAI_API_KEY", "production", "--yes", "--sensitive"]);
  });

  it("passes apply values to Vercel through stdin without logging them", () => {
    const spawnCalls = [];

    syncVercelEnvValue({
      action: "add",
      environment: "production",
      name: "OPENAI_API_KEY",
      sensitive: true,
      value: "test-secret-value",
      spawn(command, args, options) {
        spawnCalls.push({
          args,
          command,
          input: options.input
        });

        return {
          status: 0
        };
      }
    });

    expect(spawnCalls).toEqual([
      {
        args: ["env", "add", "OPENAI_API_KEY", "production", "--yes", "--sensitive"],
        command: "vercel",
        input: "test-secret-value"
      }
    ]);
  });

  it("requires explicit project confirmation before apply mode", () => {
    expect(() =>
      requireProjectConfirmation(null, {
        orgId: "team_abc",
        projectId: "prj_123"
      })
    ).toThrow("Refusing to apply without --confirm-project prj_123");

    expect(() =>
      requireProjectConfirmation("prj_123", {
        orgId: "team_abc",
        projectId: "prj_123"
      })
    ).not.toThrow();
  });

  it("rejects unsupported dotenv syntax instead of transforming values silently", () => {
    expect(() => parseDotenvContent("OPENAI_API_KEY=test-openai-key # trailing comment")).toThrow(
      "Unsupported inline comment"
    );
    expect(() => parseDotenvContent("OPENAI_API_KEY='test-openai-key")).toThrow(
      "Unsupported unterminated quoted value"
    );
  });
});
