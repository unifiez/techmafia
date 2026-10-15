import { dbConnect } from "@/lib/db";
import { Problem } from "@/lib/models";
import { ok, fail, readJson } from "@/lib/http";
import { requireAdmin } from "@/lib/admin";
import { problemSeeds } from "@/lib/game/problems-seed";

type Body = { problems?: boolean };

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await readJson<Body>(req);
  const doProblems = body?.problems !== false;

  try {
    await dbConnect();

    let problems = 0;
    if (doProblems) {
      for (const seed of problemSeeds) {
        await Problem.updateOne(
          { key: seed.key },
          { $set: { ...seed, active: true } },
          { upsert: true },
        );
        problems++;
      }
    }

    return ok({ problems });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Seed failed", 500);
  }
}
