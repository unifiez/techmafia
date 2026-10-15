import { isAdmin } from "./auth";
import { fail } from "./http";

/** Returns a Response when the caller is not the organizer, else null. */
export async function requireAdmin(): Promise<Response | null> {
  if (!(await isAdmin())) return fail("Organizer sign-in required", 401);
  return null;
}
