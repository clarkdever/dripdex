import { NextResponse } from "next/server";

import {
  getClearedOwnerSessionCookieOptions,
  OWNER_SESSION_COOKIE_NAME
} from "../owner-auth";

export function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return new NextResponse(null, {
      status: 403
    });
  }

  const response = new NextResponse(null, {
    headers: {
      Location: "/"
    },
    status: 303
  });

  response.cookies.set(
    OWNER_SESSION_COOKIE_NAME,
    "",
    getClearedOwnerSessionCookieOptions()
  );

  return response;
}

function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");

  if (!origin) {
    return true;
  }

  return origin === new URL(request.url).origin;
}
