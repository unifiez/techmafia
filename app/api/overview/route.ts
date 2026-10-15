import { connection } from "next/server";
import { ok } from "@/lib/http";
import { publicBoard } from "@/lib/public";

/**
 * Public tournament overview for the marketing / docs / home pages.
 * Aggregate stats only — safe for anonymous visitors.
 */
export async function GET() {
  await connection();
  const { stats } = await publicBoard();
  return ok({ stats });
}
