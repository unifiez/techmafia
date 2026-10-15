import { NextResponse } from "next/server";
import { isDbConfigured } from "./env";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

/** Wrap a route handler so DB/env errors become clean JSON. */
export function handler<Args extends unknown[]>(
  fn: (...args: Args) => Promise<Response>,
): (...args: Args) => Promise<Response> {
  return async (...args: Args) => {
    if (!isDbConfigured()) {
      return fail(
        "Database is not configured yet. Add MONGODB_URI to .env.local.",
        503,
      );
    }
    try {
      return await fn(...args);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected server error";
      console.error("[api]", message);
      return fail(message, 500);
    }
  };
}

export async function readJson<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}
