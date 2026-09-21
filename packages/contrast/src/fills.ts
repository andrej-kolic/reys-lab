/**
 * The fill rule, checked rather than written down.
 *
 * > Among controls, only the primary action carries a background. Every other
 * > control is a ring or bare text, in every state — rest, hover, pressed,
 * > focus. A disabled primary keeps its fill. Surfaces are not controls.
 *
 * Settled by experiment 03 on 2026-09-21, and checked here because it is
 * exactly the kind of rule that holds at rest and breaks under a pointer. It
 * was broken for months: the secondary filled on hover, which made it the
 * primary's rest state, and nobody saw it because nobody screenshots a hover.
 * That is the same shape as the contrast failures this package already
 * catches — invisible in a still frame, found by luck.
 *
 * This reads the CSS rather than mirroring it, which `tokens.ts` deliberately
 * does not do. The difference is that a background declaration is a literal:
 * `background-color: <something>` either appears inside a `btn-*` block or it
 * does not, and no custom-property chain has to be resolved to know which.
 * Resolving a *colour* would need the small browser that file's header
 * refuses to build. Spotting one does not.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const CSS = fileURLToPath(
  new URL("../../../apps/web/src/styles/global.css", import.meta.url),
);

/** The one control allowed a background. */
const FILLED = "btn-primary";

/** Values that are a background declaration in name only. */
const EMPTY = new Set(["transparent", "none", "inherit", "initial", "unset"]);

export type FillFinding = {
  utility: string;
  /** The declaration as written, trimmed. */
  declaration: string;
  /** 1-indexed line in global.css, so the report is clickable. */
  line: number;
};

/**
 * Pull each `@utility <name> { ... }` block out of the stylesheet by counting
 * braces. A regex cannot do this — the blocks nest, because every button
 * declares its states as `&:hover { ... }` inside itself, and those nested
 * states are the whole point of checking.
 */
function utilities(css: string): { name: string; body: string; start: number }[] {
  const found: { name: string; body: string; start: number }[] = [];
  const opener = /@utility\s+([\w-]+)\s*\{/g;
  let match: RegExpExecArray | null;

  while ((match = opener.exec(css)) !== null) {
    let depth = 1;
    let i = match.index + match[0].length;
    const bodyStart = i;
    while (i < css.length && depth > 0) {
      if (css[i] === "{") depth++;
      else if (css[i] === "}") depth--;
      i++;
    }
    found.push({
      name: match[1]!,
      body: css.slice(bodyStart, i - 1),
      start: bodyStart,
    });
    opener.lastIndex = i;
  }
  return found;
}

/**
 * Every background a control declares that it should not have. An empty array
 * is the rule holding.
 */
export function fillViolations(css = readFileSync(CSS, "utf8")): FillFinding[] {
  const findings: FillFinding[] = [];

  for (const utility of utilities(css)) {
    if (!utility.name.startsWith("btn-")) continue;
    if (utility.name === FILLED) continue;

    const declaration = /background(-color)?\s*:\s*([^;]+);/g;
    let hit: RegExpExecArray | null;
    while ((hit = declaration.exec(utility.body)) !== null) {
      const value = hit[2]!.trim();
      if (EMPTY.has(value.toLowerCase())) continue;
      findings.push({
        utility: utility.name,
        declaration: hit[0]!.trim(),
        line: css.slice(0, utility.start + hit.index).split("\n").length,
      });
    }
  }

  return findings;
}
