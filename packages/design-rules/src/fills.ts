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
 * A fill arrives three ways, all painting the same pixels, so all three are
 * watched (2 and 3 were issue #7):
 *
 *   1. `background-color: <something>` written out inside a `btn-*` block.
 *   2. `@apply bg-surface` inside that block, which Tailwind expands into
 *      case 1 at build time — after a checker reading only the literal has
 *      finished looking.
 *   3. `class="btn-secondary bg-surface"` in the markup, which the stylesheet
 *      never mentions at all.
 *
 * This reads the CSS rather than mirroring it, which `tokens.ts` deliberately
 * does not do. The difference is that a background declaration is a literal:
 * `background-color: <something>` either appears inside a `btn-*` block or it
 * does not, and no custom-property chain has to be resolved to know which.
 * Resolving a *colour* would need the small browser that file's header
 * refuses to build. Spotting one does not.
 *
 * Blind still: a class list built anywhere but a `class` attribute — in
 * frontmatter, in a prop, in a helper. The scan is anchored on `class=` and
 * `class:list=` deliberately, because the alternative is reading every string
 * in the app, and the experiment pages discuss `btn-primary` in prose at
 * length.
 */

import { readFileSync, readdirSync } from "node:fs";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const WEB = join(ROOT, "apps/web/src");
const CSS = join(WEB, "styles/global.css");

/** Everything the app paints markup from. */
const MARKUP = new Set([".astro", ".html", ".md", ".mdx"]);

/** The one control allowed a background. */
const FILLED = "btn-primary";

/** Values that are a background declaration in name only. */
const EMPTY = new Set(["transparent", "none", "inherit", "initial", "unset"]);

/**
 * `bg-*` utilities that set something other than a fill — size, position,
 * repeat, attachment, clip, origin, blend — plus the two that name the
 * absence of one. Everything else beginning `bg-` counts as a fill, including
 * gradients and arbitrary values, because default-deny is the only way an
 * unknown utility fails loudly instead of passing silently.
 */
const NOT_A_FILL = new Set([
  "bg-transparent",
  "bg-none",
  "bg-inherit",
  "bg-auto",
  "bg-cover",
  "bg-contain",
  "bg-fixed",
  "bg-local",
  "bg-scroll",
  "bg-repeat",
  "bg-no-repeat",
  "bg-repeat-x",
  "bg-repeat-y",
  "bg-repeat-round",
  "bg-repeat-space",
  "bg-top",
  "bg-bottom",
  "bg-left",
  "bg-right",
  "bg-center",
  "bg-left-top",
  "bg-left-bottom",
  "bg-right-top",
  "bg-right-bottom",
  "bg-top-left",
  "bg-top-right",
  "bg-bottom-left",
  "bg-bottom-right",
]);

const NOT_A_FILL_PREFIX = ["bg-clip-", "bg-origin-", "bg-blend-", "bg-position-", "bg-size-"];

export type FillFinding = {
  /** The control wearing the fill it may not have. */
  control: string;
  /** What gives it away, as written. */
  source: string;
  /** Repo-relative path, so the report is clickable. */
  file: string;
  /** 1-indexed line in that file. */
  line: number;
};

/**
 * A utility stripped of its variants and its important marker.
 * `hover:bg-surface` and `bg-surface!` both paint a background; *when* they
 * paint it is not this rule's business, since the rule covers every state.
 *
 * The cut is the last `:` outside brackets, because a variant can contain one
 * of its own — `[&:hover]:bg-surface` is one variant, not two.
 */
function bare(token: string): string {
  let depth = 0;
  let cut = -1;
  for (let i = 0; i < token.length; i++) {
    const char = token[i]!;
    if (char === "[" || char === "(") depth++;
    else if (char === "]" || char === ")") depth--;
    else if (char === ":" && depth === 0) cut = i;
  }
  return token
    .slice(cut + 1)
    .replace(/^!+/, "")
    .replace(/!+$/, "");
}

/** Does this utility put a background on the thing it is applied to? */
function isFill(token: string): boolean {
  const utility = bare(token);
  if (!utility.startsWith("bg-")) return false;
  if (NOT_A_FILL.has(utility)) return false;
  return !NOT_A_FILL_PREFIX.some((prefix) => utility.startsWith(prefix));
}

/** The control in this class list that is not allowed a fill, if there is one. */
function control(classes: string[]): string | undefined {
  return classes.find((name) => name.startsWith("btn-") && name !== FILLED);
}

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

/** Backgrounds a `btn-*` block declares or applies. */
export function cssFills(css: string, file = "apps/web/src/styles/global.css"): FillFinding[] {
  const findings: FillFinding[] = [];
  const lineAt = (offset: number) => css.slice(0, offset).split("\n").length;

  for (const utility of utilities(css)) {
    if (!utility.name.startsWith("btn-")) continue;
    if (utility.name === FILLED) continue;

    const declaration = /background(-color)?\s*:\s*([^;]+);/g;
    let hit: RegExpExecArray | null;
    while ((hit = declaration.exec(utility.body)) !== null) {
      const value = hit[2]!.trim();
      if (EMPTY.has(value.toLowerCase())) continue;
      findings.push({
        control: utility.name,
        source: hit[0]!.trim(),
        file,
        line: lineAt(utility.start + hit.index),
      });
    }

    const applied = /@apply\s+([^;{}]+);/g;
    while ((hit = applied.exec(utility.body)) !== null) {
      const fills = hit[1]!.trim().split(/\s+/).filter(isFill);
      if (fills.length === 0) continue;
      findings.push({
        control: utility.name,
        source: `@apply ${fills.join(" ")};`,
        file,
        line: lineAt(utility.start + hit.index),
      });
    }
  }

  return findings;
}

/**
 * Every class list in one markup file, with the classes it names.
 *
 * `class="a b"` is the easy half. `class:list={[...]}` is the other half and
 * it holds its classes in separate string literals — `["btn-secondary", lit &&
 * "bg-surface"]` — so the value has to be read as a whole expression and every
 * literal inside it collected. Reading only the first string would find the
 * control and miss the fill sitting next to it.
 */
function classLists(markup: string): { classes: string[]; index: number }[] {
  const lists: { classes: string[]; index: number }[] = [];
  const attribute = /\bclass(?::list)?\s*=\s*/g;
  let match: RegExpExecArray | null;

  while ((match = attribute.exec(markup)) !== null) {
    let i = match.index + match[0].length;
    const opener = markup[i];
    let text: string;

    if (opener === '"' || opener === "'") {
      const close = markup.indexOf(opener, i + 1);
      if (close === -1) continue;
      text = markup.slice(i + 1, close);
      attribute.lastIndex = close + 1;
    } else if (opener === "{") {
      let depth = 1;
      i++;
      const start = i;
      while (i < markup.length && depth > 0) {
        if (markup[i] === "{") depth++;
        else if (markup[i] === "}") depth--;
        i++;
      }
      const expression = markup.slice(start, i - 1);
      const literal = /"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'|`([^`\\]*(?:\\.[^`\\]*)*)`/g;
      const parts: string[] = [];
      let inner: RegExpExecArray | null;
      while ((inner = literal.exec(expression)) !== null) {
        parts.push(inner[1] ?? inner[2] ?? inner[3] ?? "");
      }
      text = parts.join(" ");
      attribute.lastIndex = i;
    } else {
      continue;
    }

    lists.push({
      classes: text.split(/\s+/).filter(Boolean).map(bare),
      index: match.index,
    });
  }

  return lists;
}

/** Fills applied to a control at the call site rather than in the stylesheet. */
export function markupFills(markup: string, file: string): FillFinding[] {
  const findings: FillFinding[] = [];

  for (const list of classLists(markup)) {
    const wearer = control(list.classes);
    if (!wearer) continue;
    const fills = list.classes.filter(isFill);
    if (fills.length === 0) continue;
    findings.push({
      control: wearer,
      source: `class carries ${fills.join(" ")}`,
      file,
      line: markup.slice(0, list.index).split("\n").length,
    });
  }

  return findings;
}

/** Every markup file the app paints from, in a stable order. */
function markupFiles(): string[] {
  return readdirSync(WEB, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && MARKUP.has(extname(entry.name)))
    .map((entry) => join(entry.parentPath, entry.name))
    .sort();
}

/**
 * Every background a control gets that it should not have, from the
 * stylesheet and from the markup. An empty array is the rule holding.
 */
export function fillViolations(): FillFinding[] {
  return [
    ...cssFills(readFileSync(CSS, "utf8")),
    ...markupFiles().flatMap((path) =>
      markupFills(readFileSync(path, "utf8"), path.slice(ROOT.length)),
    ),
  ];
}
