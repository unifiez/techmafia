/**
 * Client-side helpers for the fenced module format.
 *
 * A template interleaves immutable scaffolding with editable module bodies:
 *
 *   ...scaffolding...\/*<m1>*\/ body \/*<\/m1>*\/...scaffolding...
 *
 * We split the file into ordered segments so the editor can render the
 * scaffolding as read-only and each module body as an editable textarea.
 */

const FENCE = /\/\*<([A-Za-z0-9_]+)>\*\/([\s\S]*?)\/\*<\/\1>\*\//g;

export type TextSegment = { kind: "text"; text: string };
export type ModuleSegment = {
  kind: "module";
  key: string;
  open: string;
  close: string;
  body: string;
};
export type Segment = TextSegment | ModuleSegment;

/** Strip only the newlines the server adds around a body. */
export function tidyBody(body: string): string {
  return body.replace(/^\n+/, "").replace(/\n+$/, "");
}

export function splitSource(source: string): Segment[] {
  const segments: Segment[] = [];
  const re = new RegExp(FENCE.source, "g");
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source))) {
    if (m.index > last) {
      segments.push({ kind: "text", text: source.slice(last, m.index) });
    }
    const key = m[1];
    const open = `/*<${key}>*/`;
    const close = `/*</${key}>*/`;
    segments.push({ kind: "module", key, open, close, body: tidyBody(m[2]) });
    last = m.index + m[0].length;
  }
  if (last < source.length) {
    segments.push({ kind: "text", text: source.slice(last) });
  }
  return segments;
}

export function joinSource(segments: Segment[]): string {
  return segments
    .map((s) =>
      s.kind === "text"
        ? s.text
        : `${s.open}\n${tidyBody(s.body)}\n${s.close}`,
    )
    .join("");
}

/** Replace one module body in a split segment list. */
export function setModuleBody(
  segments: Segment[],
  key: string,
  body: string,
): Segment[] {
  return segments.map((s) =>
    s.kind === "module" && s.key === key ? { ...s, body } : s,
  );
}

/** True when a body has no meaningful code left (all comments / empty). */
export function isPlaceholderBody(body: string): boolean {
  const code = body
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .filter((l) => !l.startsWith("/*") && !l.startsWith("//") && !l.startsWith("*"))
    .join("");
  return (
    code.replace(/[{};]/g, "").replace(/return\s*[0-9.]*/g, "").trim().length === 0
  );
}
