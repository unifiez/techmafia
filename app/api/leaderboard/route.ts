import { connection } from "next/server";
import { ok } from "@/lib/http";
import { publicBoard } from "@/lib/public";

/**
 * Public standings. Always lists the full registered field (from the official
 * roster) merged with live results, so anonymous visitors can view the board
 * even before the first match is finalized.
 */
export async function GET() {
  await connection();
  const { standings, stats } = await publicBoard();
  return ok({ standings, meta: stats });
}
