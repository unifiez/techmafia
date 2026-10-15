import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { User } from "@/lib/models";
import { signSession, verifyPassword, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { fail, readJson } from "@/lib/http";
import { normEmail } from "@/lib/text";

type Body = { email?: string; password?: string };

export async function POST(req: Request) {
  try {
    await dbConnect();
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Database unavailable", 503);
  }

  const body = await readJson<Body>(req);
  const email = normEmail(body?.email ?? "");
  const password = body?.password ?? "";
  if (!email || !password) return fail("Email and password are required");

  const user = await User.findOne({ email });
  if (!user) return fail("Invalid email or password", 401);

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return fail("Invalid email or password", 401);

  user.lastSeenAt = new Date();
  await user.save();

  const token = await signSession({
    userId: String(user._id),
    email: user.email,
    teamId: user.teamId ? String(user.teamId) : undefined,
  });

  const res = NextResponse.json({
    ok: true,
    data: {
      user: { id: String(user._id), name: user.name, email: user.email },
      isCaptain: user.isCaptain,
      disqualified: user.disqualified,
    },
  });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}
