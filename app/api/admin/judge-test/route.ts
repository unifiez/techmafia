import { requireAdmin } from "@/lib/admin";
import { env, isJudgeConfigured } from "@/lib/env";
import { fail, ok, readJson } from "@/lib/http";
import { runC } from "@/lib/judge0";

type Body = { source?: string; stdin?: string };

/**
 * Organizer-only judge self-test.
 *
 * Compiles and runs arbitrary C through the same engines participants use, so
 * the organizer can confirm the checker works (and see the RAW compiler output,
 * which is never exposed to players). Returns which engine answered, latency,
 * and the judge configuration.
 */
export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await readJson<Body>(req);
  const source = (body?.source ?? "").trim();
  if (!source) return fail("Write some C code first.", 400);

  if (!isJudgeConfigured()) {
    return fail("The code checker is not configured.", 503);
  }

  const started = Date.now();
  const run = await runC(source, body?.stdin ?? "", { timeLimitSeconds: 5 });
  const latencyMs = Date.now() - started;

  return ok({
    accepted: run.ok,
    status: run.status,
    statusId: run.statusId,
    engine: run.engine ?? "judge0",
    latencyMs,
    stdout: run.stdout,
    stderr: run.stderr,
    compileOutput: run.compileOutput,
    time: run.time ?? null,
    memory: run.memory ?? null,
    config: {
      mode: env.judge0.mode,
      url: env.judge0.url,
      fallbackEnabled: env.judge0.fallbackEnabled,
      concurrencyMax: env.judge0.concurrencyMax,
    },
  });
}
