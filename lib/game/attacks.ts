import type { AttackType } from "../models";
import { getModuleBody, replaceModuleBody } from "./code";

export type AttackResult = {
  applied: boolean;
  detail: string;
  moduleKey: string;
  source: string;
};

/** Replace comments and string/char literals with spaces, preserving offsets. */
export function maskNonCode(src: string): string {
  const chars = src.split("");
  let i = 0;
  const n = src.length;
  const blank = (from: number, to: number) => {
    for (let k = from; k < to && k < n; k++) {
      if (chars[k] !== "\n") chars[k] = " ";
    }
  };
  while (i < n) {
    const c = src[i];
    const next = src[i + 1];
    if (c === "/" && next === "*") {
      const end = src.indexOf("*/", i + 2);
      const stop = end === -1 ? n : end + 2;
      blank(i, stop);
      i = stop;
      continue;
    }
    if (c === "/" && next === "/") {
      const end = src.indexOf("\n", i + 2);
      const stop = end === -1 ? n : end;
      blank(i, stop);
      i = stop;
      continue;
    }
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < n) {
        if (src[j] === "\\") {
          j += 2;
          continue;
        }
        if (src[j] === c) break;
        j++;
      }
      blank(i, j + 1);
      i = j + 1;
      continue;
    }
    i++;
  }
  return chars.join("");
}

type Site = { index: number; length: number; replacement: string; detail: string };

function collectOperators(masked: string): Site[] {
  const sites: Site[] = [];
  const flip: Record<string, string> = { "+": "-", "-": "+", "*": "/", "/": "*" };
  for (let i = 0; i < masked.length; i++) {
    const c = masked[i];
    if (!"+-*/".includes(c)) continue;
    const prev = masked[i - 1] ?? "";
    const next = masked[i + 1] ?? "";
    if (next === c) continue;
    if (next === "=") continue;
    if (prev === c && (c === "+" || c === "-")) continue;
    if (c === "*" && (prev === "/" || next === "/")) continue;
    if (c === "/" && (prev === "*" || prev === "/" || next === "/" || next === "*")) continue;
    if (c === "-" && next === ">") continue;
    const before = masked.slice(0, i).replace(/\s+$/, "");
    const after = masked.slice(i + 1).replace(/^\s+/, "");
    const pb = before[before.length - 1] ?? "";
    const na = after[0] ?? "";
    if (!/[A-Za-z0-9_)\]]/.test(pb)) continue;
    if (!/[A-Za-z0-9_(]/.test(na)) continue;
    sites.push({
      index: i,
      length: 1,
      replacement: flip[c],
      detail: `changed '${c}' to '${flip[c]}'`,
    });
  }
  return sites;
}

function collectBoundaries(masked: string): Site[] {
  const sites: Site[] = [];
  const flip: Record<string, string> = { "<": "<=", "<=": "<", ">": ">=", ">=": ">" };
  const re = /(<=|>=|<<|>>|<|>)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(masked))) {
    const tok = m[0];
    if (tok === "<<" || tok === ">>") continue;
    const i = m.index;
    const prev = masked[i - 1] ?? "";
    const next = masked[i + tok.length] ?? "";
    const lineStart = masked.lastIndexOf("\n", i) + 1;
    const line = masked.slice(lineStart, i);
    if (line.includes("#include") || line.includes("#define")) continue;
    if (prev === "-" || prev === "=" || prev === "!" || prev === "<" || prev === ">") continue;
    if (next === "=") continue;
    // Avoid template/aliasing oddities: require an operand-ish neighbour somewhere.
    if (!/[A-Za-z0-9_)\]]/.test((masked.slice(0, i).replace(/\s+$/, "").slice(-1) || ""))) continue;
    sites.push({
      index: i,
      length: tok.length,
      replacement: flip[tok],
      detail: `changed '${tok}' to '${flip[tok]}'`,
    });
  }
  return sites;
}

function collectLogical(masked: string): Site[] {
  const re = /(&&|\|\|)/g;
  const sites: Site[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(masked))) {
    const tok = m[0];
    sites.push({
      index: m.index,
      length: 2,
      replacement: tok === "&&" ? "||" : "&&",
      detail: `changed '${tok}' to '${tok === "&&" ? "||" : "&&"}'`,
    });
  }
  return sites;
}

function collectZeroComparisons(masked: string): Site[] {
  const re = /([=!<>]=?)\s*(0)\b/g;
  const flip: Record<string, string> = {
    "==": "!=",
    "!=": "==",
    ">": "<",
    "<": ">",
    ">=": "<=",
    "<=": ">=",
  };
  const sites: Site[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(masked))) {
    const op = m[1];
    if (!flip[op]) continue;
    sites.push({
      index: m.index,
      length: op.length,
      replacement: flip[op],
      detail: `changed '${op} 0' to '${flip[op]} 0'`,
    });
  }
  return sites;
}

function collectIncrements(masked: string): Site[] {
  const re = /(\+\+|--|\+=|-=|\*=|\/=)/g;
  const flip: Record<string, string> = {
    "++": "--",
    "--": "++",
    "+=": "-=",
    "-=": "+=",
    "*=": "/=",
    "/=": "*=",
  };
  const sites: Site[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(masked))) {
    sites.push({
      index: m.index,
      length: m[0].length,
      replacement: flip[m[0]],
      detail: `changed '${m[0]}' to '${flip[m[0]]}'`,
    });
  }
  return sites;
}

function collectLoopBounds(masked: string): Site[] {
  const re = /for\s*\(([^;)]*);([^;)]*);([^)]*)\)/g;
  const sites: Site[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(masked))) {
    const cond = m[2];
    const condStart = m.index + m[0].indexOf(cond);
    let target: Site | null = null;
    if (/<=/.test(cond)) {
      const at = condStart + cond.indexOf("<=");
      target = { index: at, length: 2, replacement: "<", detail: "changed '<=' to '<' in loop" };
    } else if (/</.test(cond)) {
      const at = condStart + cond.indexOf("<");
      target = { index: at, length: 1, replacement: "<=", detail: "changed '<' to '<=' in loop" };
    } else if (/>/.test(cond)) {
      const at = condStart + cond.indexOf(">");
      target = { index: at, length: 1, replacement: ">=", detail: "changed '>' to '>=' in loop" };
    }
    if (target) sites.push(target);
  }
  return sites;
}

function collectMisspells(masked: string): Site[] {
  const dict: Record<string, string> = {
    return: "retrun",
    while: "whlie",
    break: "brek",
    continue: "contineu",
    printf: "print",
    else: "esle",
  };
  const re = /\b(return|while|break|continue|printf|else)\b/g;
  const sites: Site[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(masked))) {
    sites.push({
      index: m.index,
      length: m[0].length,
      replacement: dict[m[0]],
      detail: `misspelled '${m[0]}'`,
    });
  }
  return sites;
}

function collectSemicolons(masked: string): Site[] {
  const sites: Site[] = [];
  const lines = masked.split("\n");
  let offset = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    const idx = line.length - 1;
    if (trimmed.endsWith(";") && !/\bfor\b/.test(line) && !trimmed.startsWith("#")) {
      const abs = offset + idx;
      if (masked[abs] === ";") {
        sites.push({ index: abs, length: 1, replacement: "", detail: "removed a semicolon" });
      }
    }
    offset += line.length + 1;
  }
  return sites;
}

function collectBrackets(masked: string): Site[] {
  const sites: Site[] = [];
  for (let i = 0; i < masked.length; i++) {
    if (masked[i] === ")") {
      // only remove if it closes something with an operand before it
      sites.push({ index: i, length: 1, replacement: "", detail: "removed a closing bracket" });
    }
  }
  return sites;
}

function pickSite(type: AttackType, masked: string, occurrence: number): Site | null {
  let sites: Site[];
  switch (type) {
    case "flip_operator":
      sites = collectOperators(masked);
      break;
    case "boundary":
      sites = collectBoundaries(masked);
      break;
    case "logical":
      sites = collectLogical(masked);
      break;
    case "zero_compare":
      sites = collectZeroComparisons(masked);
      break;
    case "increment":
      sites = collectIncrements(masked);
      break;
    case "loop_bound":
      sites = collectLoopBounds(masked);
      break;
    case "token_misspell":
      sites = collectMisspells(masked);
      break;
    case "semicolon":
      sites = collectSemicolons(masked);
      break;
    case "bracket":
      sites = collectBrackets(masked);
      break;
    default:
      sites = [];
  }
  if (sites.length === 0) return null;
  const idx = ((occurrence % sites.length) + sites.length) % sites.length;
  return sites[idx];
}

function applySite(src: string, site: Site): string {
  return src.slice(0, site.index) + site.replacement + src.slice(site.index + site.length);
}

/**
 * Apply one allowlisted attack to a single module. Returns the new full
 * source. If no valid target exists the attack is "not applied" and should
 * not consume a token.
 */
export function applyAttack(
  source: string,
  moduleKey: string,
  type: AttackType,
  occurrence = 0,
): AttackResult {
  const body = getModuleBody(source, moduleKey);
  if (body === null) {
    return { applied: false, detail: "no such module", moduleKey, source };
  }

  const masked = maskNonCode(body);
  const site = pickSite(type, masked, occurrence);
  if (!site) {
    return { applied: false, detail: "no valid target in this module", moduleKey, source };
  }

  const mutated = applySite(body, site);
  const nextSource = replaceModuleBody(source, moduleKey, mutated);
  return { applied: true, detail: site.detail, moduleKey, source: nextSource };
}

/** Count how many valid targets exist for a type within a module. */
export function countTargets(source: string, moduleKey: string, type: AttackType): number {
  const body = getModuleBody(source, moduleKey);
  if (body === null) return 0;
  const masked = maskNonCode(body);
  switch (type) {
    case "flip_operator":
      return collectOperators(masked).length;
    case "boundary":
      return collectBoundaries(masked).length;
    case "logical":
      return collectLogical(masked).length;
    case "zero_compare":
      return collectZeroComparisons(masked).length;
    case "increment":
      return collectIncrements(masked).length;
    case "loop_bound":
      return collectLoopBounds(masked).length;
    case "token_misspell":
      return collectMisspells(masked).length;
    case "semicolon":
      return collectSemicolons(masked).length;
    case "bracket":
      return collectBrackets(masked).length;
    default:
      return 0;
  }
}
