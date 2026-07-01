import { NextResponse } from "next/server";

import {
  isOwnerLoginRateLimited,
  recordOwnerLoginFailure
} from "../../owner-login-rate-limit";
import {
  createOwnerSessionToken,
  getOwnerSessionCookieOptions,
  OWNER_SESSION_COOKIE_NAME,
  verifyOwnerCredentials
} from "../../owner-auth";

const MAX_LOGIN_BODY_BYTES = 4096;

export async function POST(request: Request) {
  if (hasOversizedBody(request)) {
    return redirectTo(`/login?error=invalid&next=${encodeURIComponent("/journal")}`);
  }

  const formData = await request.formData();
  const username = getFormString(formData, "username");
  const password = getFormString(formData, "password");
  const nextPath = sanitizeNextPath(getFormString(formData, "next"));
  const ipAddress = getRequestIpAddress(request);

  if (hasInvalidLoginInput({ nextPath, password, username })) {
    return redirectTo(`/login?error=invalid&next=${encodeURIComponent("/journal")}`);
  }

  if (isOwnerLoginRateLimited({ ipAddress, username })) {
    return redirectTo(`/login?error=limited&next=${encodeURIComponent(nextPath)}`);
  }

  const verification = verifyOwnerCredentials({
    password,
    username
  });

  if (!verification.success) {
    const error = verification.reason === "missing_config" ? "config" : "invalid";

    if (verification.reason === "invalid_credentials") {
      recordOwnerLoginFailure({ ipAddress, username });
    }

    return redirectTo(`/login?error=${error}&next=${encodeURIComponent(nextPath)}`);
  }

  const response = redirectTo(nextPath);
  response.cookies.set(
    OWNER_SESSION_COOKIE_NAME,
    createOwnerSessionToken({
      env: process.env,
      username
    }),
    getOwnerSessionCookieOptions()
  );

  return response;
}

function getFormString(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function sanitizeNextPath(nextPath: string): string {
  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/journal";
  }

  return nextPath;
}

function hasInvalidLoginInput({
  nextPath,
  password,
  username
}: {
  nextPath: string;
  password: string;
  username: string;
}): boolean {
  return username.length > 128 || password.length > 1024 || nextPath.length > 2048;
}

function getRequestIpAddress(request: Request): string {
  if (process.env.DRIPDEX_TRUST_FORWARDED_IP !== "enabled") {
    return "direct-client";
  }

  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();

  return forwardedFor || realIp || "unknown";
}

function hasOversizedBody(request: Request): boolean {
  const contentLength = request.headers.get("content-length");

  if (!contentLength) {
    return true;
  }

  const parsedLength = Number(contentLength);

  return !Number.isFinite(parsedLength) || parsedLength > MAX_LOGIN_BODY_BYTES;
}

function redirectTo(location: string): NextResponse {
  return new NextResponse(null, {
    headers: {
      Location: location
    },
    status: 303
  });
}
