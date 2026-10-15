/**
 * Module fences.
 *
 * A problem template is a complete C program in which each participant-owned
 * region is wrapped in machine-readable fences:
 *
 *   /*<m1>*\/
 *   ... coder 1 writes here ...
 *   /*</m1>*\/
 *
 * The fenced regions are the only parts a participant may edit. Everything
 * outside the fences is organizer-provided scaffolding (includes, function
 * prototypes, main()).
 */

const FENCE = /\/\*<([A-Za-z0-9_]+)>\*\/([\s\S]*?)\/\*<\/\1>\*\//g;

export type ParsedModule = { key: string; body: string };

export function parseModules(source: string): ParsedModule[] {
  const out: ParsedModule[] = [];
  const re = new RegExp(FENCE.source, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(source))) {
    out.push({ key: m[1], body: m[2] });
  }
  return out;
}

export function moduleKeys(source: string): string[] {
  return parseModules(source).map((m) => m.key);
}

export function getModuleBody(source: string, key: string): string | null {
  const found = parseModules(source).find((m) => m.key === key);
  return found ? found.body : null;
}

/** Replace the body of one fenced module, preserving the rest of the file. */
export function replaceModuleBody(
  source: string,
  key: string,
  body: string,
): string {
  const re = new RegExp(
    `(\\/\\*<${key}>\\*\\/)([\\s\\S]*?)(\\/\\*<\\/${key}>\\*\\/)`,
  );
  if (!re.test(source)) return source;
  return source.replace(re, (_all, open: string, _old: string, close: string) => {
    // Ensure the body keeps its surrounding newlines tidy.
    const trimmed = body.replace(/^\n+/, "").replace(/\n+$/, "");
    return `${open}\n${trimmed}\n${close}`;
  });
}

/** Build a fresh file from a template, leaving all module bodies empty. */
export function blankedTemplate(template: string): string {
  let out = template;
  for (const mod of parseModules(template)) {
    out = replaceModuleBody(out, mod.key, "");
  }
  return out;
}

/** True when a body still looks like the untouched starter placeholder. */
export function isPlaceholderBody(body: string): boolean {
  const code = body
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .filter((l) => !l.startsWith("/*") && !l.startsWith("//") && !l.startsWith("*"))
    .join("");
  // If, after stripping comments, there is nothing but a bare return/brace, treat as placeholder.
  return code.replace(/[{};]/g, "").replace(/return\s*[0-9.]*/g, "").trim().length === 0;
}

/**
 * Validate that only the provided module keys have changed between two
 * versions of the file, and return the list of changed keys.
 */
export function changedModules(before: string, after: string): string[] {
  const a = new Map(parseModules(before).map((m) => [m.key, m.body.trim()]));
  const b = new Map(parseModules(after).map((m) => [m.key, m.body.trim()]));
  const changed: string[] = [];
  for (const key of new Set([...a.keys(), ...b.keys()])) {
    if ((a.get(key) ?? "") !== (b.get(key) ?? "")) changed.push(key);
  }
  return changed;
}

/** Number of non-comment, non-trivial characters in a module body. */
export function bodyWeight(body: string): number {
  return body
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    .replace(/\s+/g, "")
    .length;
}
