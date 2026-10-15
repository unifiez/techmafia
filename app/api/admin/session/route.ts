import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/auth";
import { isAdmin } from "@/lib/auth";

export async function GET() {
  return NextResponse.json({ ok: true, data: { organizer: await isAdmin() } });
}

export async function POST() {
  const res = NextResponse.json({ ok: true, data: { loggedOut: true } });
  res.cookies.set(ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
