import { NextResponse } from "next/server";

export function middleware() {
  return new NextResponse("Site temporarily unavailable.", {
    status: 503,
    headers: { "Content-Type": "text/plain" },
  });
}

export const config = {
  matcher: "/(.*)",
};
