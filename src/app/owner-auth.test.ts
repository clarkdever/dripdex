import { describe, expect, it } from "vitest";

import {
  createOwnerPasswordHash,
  createOwnerSessionToken,
  getOwnerSessionCookieOptions,
  verifyOwnerCredentials,
  verifyOwnerSessionToken
} from "./owner-auth";

const authSecret = "test-auth-secret-that-is-long-enough-for-hmac";
const ownerUsername = "field-owner";
const ownerPassword = "correct horse field battery";

function createEnv(passwordHash: string) {
  return {
    DRIPDEX_OWNER_USERNAME: ownerUsername,
    DRIPDEX_OWNER_PASSWORD_HASH: passwordHash,
    DRIPDEX_AUTH_SECRET: authSecret
  };
}

describe("owner auth", () => {
  it("verifies the owner username and scrypt password hash", () => {
    const passwordHash = createOwnerPasswordHash(ownerPassword, {
      salt: "unit-test-salt",
      cost: 1024
    });

    expect(
      verifyOwnerCredentials(
        {
          username: ownerUsername,
          password: ownerPassword
        },
        createEnv(passwordHash)
      )
    ).toEqual({ success: true });

    expect(
      verifyOwnerCredentials(
        {
          username: ownerUsername,
          password: "wrong password"
        },
        createEnv(passwordHash)
      )
    ).toEqual({ success: false, reason: "invalid_credentials" });
  });

  it("keeps the journal closed when owner auth is not configured", () => {
    expect(
      verifyOwnerCredentials(
        {
          username: ownerUsername,
          password: ownerPassword
        },
        {}
      )
    ).toEqual({ success: false, reason: "missing_config" });
  });

  it("rejects weak auth secrets as missing configuration", () => {
    const passwordHash = createOwnerPasswordHash(ownerPassword, {
      salt: "unit-test-salt",
      cost: 1024
    });

    expect(
      verifyOwnerCredentials(
        {
          username: ownerUsername,
          password: ownerPassword
        },
        {
          DRIPDEX_AUTH_SECRET: "short",
          DRIPDEX_OWNER_PASSWORD_HASH: passwordHash,
          DRIPDEX_OWNER_USERNAME: ownerUsername
        }
      )
    ).toEqual({ success: false, reason: "missing_config" });
  });

  it("treats malformed password hash configuration as closed instead of throwing", () => {
    const env = {
      DRIPDEX_AUTH_SECRET: authSecret,
      DRIPDEX_OWNER_PASSWORD_HASH: "scrypt$v1$999999999$8$1$salt$key",
      DRIPDEX_OWNER_USERNAME: ownerUsername
    };

    expect(() =>
      verifyOwnerCredentials(
        {
          username: ownerUsername,
          password: ownerPassword
        },
        env
      )
    ).not.toThrow();

    expect(
      verifyOwnerCredentials(
        {
          username: ownerUsername,
          password: ownerPassword
        },
        env
      )
    ).toEqual({ success: false, reason: "missing_config" });
  });

  it("creates signed owner session tokens that reject tampering and expiry", () => {
    const now = new Date("2026-07-01T12:00:00.000Z");
    const env = createEnv(
      createOwnerPasswordHash(ownerPassword, {
        salt: "unit-test-salt",
        cost: 1024
      })
    );
    const token = createOwnerSessionToken({
      env,
      now,
      username: ownerUsername
    });

    expect(
      verifyOwnerSessionToken(token, env, new Date("2026-07-01T13:00:00.000Z"))
    ).toEqual({ success: true, username: ownerUsername });

    const tamperedToken = `${token.slice(0, -1)}${token.endsWith("a") ? "b" : "a"}`;
    expect(verifyOwnerSessionToken(tamperedToken, env, now)).toEqual({
      success: false,
      reason: "invalid_session"
    });

    expect(
      verifyOwnerSessionToken(token, env, new Date("2026-07-02T01:00:01.000Z"))
    ).toEqual({ success: false, reason: "expired_session" });
  });

  it("sets the owner session cookie as http-only and secure in production", () => {
    expect(getOwnerSessionCookieOptions({ NODE_ENV: "production" })).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12
    });

    expect(getOwnerSessionCookieOptions({ NODE_ENV: "development" })).toMatchObject({
      httpOnly: true,
      secure: false,
      sameSite: "lax"
    });
  });
});
