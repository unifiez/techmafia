import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { readJson, fail } from "@/lib/http";
import { ADMIN_COOKIE, adminCookieOptions, signAdmin } from "@/lib/auth";

type Body = { passcode?: string };

export async function POST(req: Request) {
  const body = await readJson<Body>(req);
  const passcode = body?.passcode ?? "";
  if (!passcode) return fail("Passcode required");
  if (passcode !== env.organizerPasscode) return fail("Invalid organizer passcode", 401);

  const token = await signAdmin();
  const res = NextResponse.json({ ok: true, data: { organizer: true } });
  res.cookies.set(ADMIN_COOKIE, token, adminCookieOptions());
  return res;
}
