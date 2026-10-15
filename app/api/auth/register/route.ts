import { Types } from "mongoose";
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Team, User, type IUser } from "@/lib/models";
import { hashPassword, signSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { fail, readJson } from "@/lib/http";
import { normEmail, normRoll } from "@/lib/text";

type Body = {
  email?: string;
  password?: string;
  name?: string;
  roll?: string;
  teamCode?: string;
  teamName?: string;
};

const MAX_MEMBERS = 4;

async function generateTeamCode(): Promise<string> {
  for (let attempt = 0; attempt < 25; attempt++) {
    const code = String(Math.floor(1000 + Math.random() * 9000));
    const exists = await Team.exists({ code });
    if (!exists) return code;
  }
  // Extremely unlikely fallback.
  return String(Date.now()).slice(-4);
}

async function issueSession(user: IUser): Promise<string> {
  return signSession({
    userId: String(user._id),
    email: user.email,
    teamId: user.teamId ? String(user.teamId) : undefined,
  });
}

export async function POST(req: Request) {
  try {
    await dbConnect();
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Database unavailable", 503);
  }

  const body = await readJson<Body>(req);
  if (!body) return fail("Invalid request body");

  const email = normEmail(body.email ?? "");
  const password = body.password ?? "";
  const teamCode = (body.teamCode ?? "").trim();

  if (!email) return fail("Email is required");
  if (password.length < 6) return fail("Password must be at least 6 characters");

  const existing = await User.findOne({ email });
  if (existing) return fail("An account with this email already exists. Please sign in.", 409);

  // ── Join an existing team with the captain's 4-digit code ────────────────
  if (teamCode) {
    const name = (body.name ?? "").trim();
    const roll = normRoll(body.roll ?? "");
    if (!name) return fail("Your full name is required to join");
    if (!roll) return fail("Your roll number is required to join");

    const team = await Team.findOne({ code: teamCode });
    if (!team) return fail("No team matches that 4-digit code", 404);
    if (team.members.length >= MAX_MEMBERS) {
      return fail("That team is already full (4 members).", 409);
    }
    if (team.members.some((m) => normRoll(m.roll) === roll)) {
      return fail("That roll number is already on this team.", 409);
    }

    const memberIndex = team.members.length;
    const user = await User.create({
      name,
      email,
      roll,
      passwordHash: await hashPassword(password),
      role: "player",
      teamId: team._id,
      memberIndex,
      isCaptain: false,
      lastSeenAt: new Date(),
    });

    team.members.push({
      userId: user._id as Types.ObjectId,
      name,
      roll,
      memberIndex,
      joined: true,
    });
    if (team.members.length >= MAX_MEMBERS) team.status = "ready";
    await team.save();

    const token = await issueSession(user);
    const res = NextResponse.json({
      ok: true,
      data: {
        user: { id: String(user._id), name: user.name, email: user.email, roll: user.roll },
        teamId: String(team._id),
        teamName: team.name,
        teamCode: team.code,
        isCaptain: false,
        message: `${user.name} joined ${team.name}.`,
      },
    });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return res;
  }

  // ── Create a brand new team (this player becomes the captain) ───────────
  const name = (body.name ?? "").trim();
  const roll = normRoll(body.roll ?? "");
  const teamName = (body.teamName ?? "").trim() || `${name}'s team`;

  if (!name) return fail("Your full name is required");
  if (!roll) return fail("Your roll number is required");
  if (teamName.length < 2 || teamName.length > 40) {
    return fail("Team name must be 2–40 characters");
  }

  const team = await Team.create({
    name: teamName,
    code: await generateTeamCode(),
    members: [],
    status: "forming",
  });

  const user = await User.create({
    name,
    email,
    roll,
    passwordHash: await hashPassword(password),
    role: "player",
    teamId: team._id,
    memberIndex: 0,
    isCaptain: true,
    lastSeenAt: new Date(),
  });

  team.captainId = user._id as Types.ObjectId;
  team.members.push({
    userId: user._id as Types.ObjectId,
    name,
    roll,
    memberIndex: 0,
    joined: true,
  });
  await team.save();

  const token = await issueSession(user);
  const res = NextResponse.json({
    ok: true,
    data: {
      user: { id: String(user._id), name: user.name, email: user.email, roll: user.roll },
      teamId: String(team._id),
      teamName: team.name,
      teamCode: team.code,
      isCaptain: true,
      message: `Team created. Share code ${team.code} with your three teammates.`,
    },
  });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}
