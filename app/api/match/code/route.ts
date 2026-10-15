import { resolveMatch, validateAndApplyCode } from "@/lib/game/service";
import { fail, ok, readJson } from "@/lib/http";

type Body = { code?: string };

/**
 * Save the shared C file. A participant may only change the module(s)
 * assigned to them:
 *   - coding phase  → the module they authored
 *   - repair phase  → the module they were rotated to repair
 * Everything outside the fences (includes, prototypes, main) is immutable.
 */
export async function POST(req: Request) {
  const r = await resolveMatch();
  if (!r.ok) return fail(r.message, r.status);
  const { user, match, role } = r;

  const body = await readJson<Body>(req);
  if (typeof body?.code !== "string") return fail("Missing code");

  const result = validateAndApplyCode(match, String(user._id), role, body.code);
  if (!result.ok) return fail(result.message ?? "Invalid edit", 409);

  await match.save();
  return ok({ saved: true, changed: result.changed });
}
