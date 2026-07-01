import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST as loginPost } from "./login/submit/route";
import { POST as logoutPost } from "./logout/route";
import { clearOwnerLoginRateLimit } from "./owner-login-rate-limit";
import { createOwnerPasswordHash, OWNER_SESSION_COOKIE_NAME } from "./owner-auth";

const passwordHash = createOwnerPasswordHash("secret password", {
  salt: "route-test-salt",
  cost: 1024
});

async function withAuthEnv<T>(callback: () => Promise<T>): Promise<T> {
  vi.stubEnv("DRIPDEX_OWNER_USERNAME", "field-owner");
  vi.stubEnv("DRIPDEX_OWNER_PASSWORD_HASH", passwordHash);
  vi.stubEnv("DRIPDEX_AUTH_SECRET", "route-test-auth-secret-that-is-long-enough");
  vi.stubEnv("DRIPDEX_TRUST_FORWARDED_IP", "enabled");

  try {
    return await callback();
  } finally {
    vi.unstubAllEnvs();
  }
}

function createLoginRequest(form: Record<string, string>, headers?: HeadersInit) {
  const body = new URLSearchParams(form);
  const requestHeaders = new Headers(headers);

  if (!requestHeaders.has("content-length")) {
    requestHeaders.set("content-length", String(body.toString().length));
  }

  return createRouteRequest(body, requestHeaders);
}

function createLengthlessLoginRequest(form: Record<string, string>) {
  return createRouteRequest(new URLSearchParams(form), new Headers());
}

function createRouteRequest(body: URLSearchParams, headers: Headers): Request {
  return {
    formData: async () => {
      const formData = new FormData();

      body.forEach((value, key) => {
        formData.append(key, value);
      });

      return formData;
    },
    headers
  } as Request;
}

describe("owner auth routes", () => {
  beforeEach(() => {
    clearOwnerLoginRateLimit();
  });

  it("sets an http-only owner session cookie after valid login", async () => {
    const response = await withAuthEnv(() =>
      loginPost(
        createLoginRequest({
          next: "/journal",
          password: "secret password",
          username: "field-owner"
        })
      )
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/journal");
    expect(response.headers.get("set-cookie")).toContain(OWNER_SESSION_COOKIE_NAME);
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("set-cookie")).toContain("SameSite=lax");
  });

  it("rejects invalid login without revealing which credential failed", async () => {
    const response = await withAuthEnv(() =>
      loginPost(
        createLengthlessLoginRequest({
          next: "/journal",
          password: "wrong password",
          username: "field-owner"
        })
      )
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/login?error=invalid&next=%2Fjournal");
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("rejects missing auth configuration at the route boundary", async () => {
    const response = await loginPost(
      createLoginRequest({
        next: "/journal",
        password: "secret password",
        username: "field-owner"
      })
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/login?error=config&next=%2Fjournal");
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("rejects oversized login input before password verification work", async () => {
    const response = await withAuthEnv(() =>
      loginPost(
        createLoginRequest({
          next: "/journal",
          password: "x".repeat(1025),
          username: "field-owner"
        })
      )
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/login?error=invalid&next=%2Fjournal");
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("rate limits repeated login attempts for the same IP and username", async () => {
    const headers = {
      "x-forwarded-for": "203.0.113.9"
    };

    await withAuthEnv(async () => {
      for (let attempt = 0; attempt < 5; attempt += 1) {
        await loginPost(
          createLoginRequest(
            {
              next: "/journal",
              password: "wrong password",
              username: "field-owner"
            },
            headers
          )
        );
      }

      const response = await loginPost(
        createLoginRequest(
          {
            next: "/journal",
            password: "secret password",
            username: "field-owner"
          },
          headers
        )
      );

      expect(response.status).toBe(303);
      expect(response.headers.get("location")).toBe("/login?error=limited&next=%2Fjournal");
      expect(response.headers.get("set-cookie")).toBeNull();
    });
  });

  it("rate limits repeated login attempts for the same IP across rotated usernames", async () => {
    const headers = {
      "x-forwarded-for": "203.0.113.10"
    };

    await withAuthEnv(async () => {
      for (let attempt = 0; attempt < 5; attempt += 1) {
        await loginPost(
          createLoginRequest(
            {
              next: "/journal",
              password: "wrong password",
              username: `field-owner-${attempt}`
            },
            headers
          )
        );
      }

      const response = await loginPost(
        createLoginRequest(
          {
            next: "/journal",
            password: "secret password",
            username: "field-owner"
          },
          headers
        )
      );

      expect(response.status).toBe(303);
      expect(response.headers.get("location")).toBe("/login?error=limited&next=%2Fjournal");
      expect(response.headers.get("set-cookie")).toBeNull();
    });
  });

  it("does not trust forwarded IP headers unless explicitly enabled", async () => {
    vi.stubEnv("DRIPDEX_OWNER_USERNAME", "field-owner");
    vi.stubEnv("DRIPDEX_OWNER_PASSWORD_HASH", passwordHash);
    vi.stubEnv("DRIPDEX_AUTH_SECRET", "route-test-auth-secret-that-is-long-enough");

    try {
      for (let attempt = 0; attempt < 5; attempt += 1) {
        await loginPost(
          createLoginRequest(
            {
              next: "/journal",
              password: "wrong password",
              username: "field-owner"
            },
            {
              "x-forwarded-for": `203.0.113.${attempt}`
            }
          )
        );
      }

      const response = await loginPost(
        createLoginRequest(
          {
            next: "/journal",
            password: "secret password",
            username: "field-owner"
          },
          {
            "x-forwarded-for": "203.0.113.99"
          }
        )
      );

      expect(response.status).toBe(303);
      expect(response.headers.get("location")).toBe("/login?error=limited&next=%2Fjournal");
      expect(response.headers.get("set-cookie")).toBeNull();
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("rejects oversized login bodies before parsing form data", async () => {
    const response = await withAuthEnv(() =>
      loginPost(
        createLoginRequest(
          {
            next: "/journal",
            password: "secret password",
            username: "field-owner"
          },
          {
            "content-length": "20000"
          }
        )
      )
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/login?error=invalid&next=%2Fjournal");
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("rejects login bodies without content length before parsing form data", async () => {
    const response = await withAuthEnv(() =>
      loginPost(
        createLengthlessLoginRequest({
          next: "/journal",
          password: "secret password",
          username: "field-owner"
        })
      )
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/login?error=invalid&next=%2Fjournal");
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("does not redirect to external next URLs", async () => {
    const response = await withAuthEnv(() =>
      loginPost(
        createLoginRequest({
          next: "https://evil.example",
          password: "secret password",
          username: "field-owner"
        })
      )
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/journal");
  });

  it("clears the owner session cookie on logout", () => {
    const response = logoutPost(new Request("http://localhost/logout", { method: "POST" }));

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/");
    expect(response.headers.get("set-cookie")).toContain(OWNER_SESSION_COOKIE_NAME);
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });

  it("rejects cross-origin logout requests", () => {
    const response = logoutPost(
      new Request("http://localhost/logout", {
        headers: {
          origin: "https://evil.example"
        },
        method: "POST"
      })
    );

    expect(response.status).toBe(403);
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});
