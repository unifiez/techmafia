/** Small normalisation helpers shared by the auth flows. */

/** Normalise an email for comparisons and storage. */
export function normEmail(email: string): string {
  return (email || "").trim().toLowerCase();
}

/** Normalise a roll number for comparisons. */
export function normRoll(roll: string): string {
  return (roll || "").trim().toUpperCase();
}
