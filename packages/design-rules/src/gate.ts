/**
 * The contrast gate.
 *
 * Open in the design-system plan since the beginning, and the one part of a
 * colour system that has to be a program rather than a page. A wall of
 * swatches catches a failure when somebody happens to look at it; this
 * catches it when somebody changes a value.
 *
 * Two rules it follows, both learned the hard way on this site:
 *
 *   Every pair the site renders is listed, including the hovered and
 *   pressed ones. A hover that has never been measured is where a candidate
 *   quietly breaches a floor, because nobody screenshots a hover.
 *
 *   A pair that sits below its floor on purpose is DECLARED, with the
 *   reason. It reports as "under, declared" and does not fail. The failure
 *   mode this is written against is a known-bad pair being rediscovered as a
 *   bug six months later and argued about again.
 */

import { contrast } from "./colour.ts";
import { fillViolations } from "./fills.ts";
import { palette, softMix, steps } from "./tokens.ts";

const mix = (accent: string, base: string, amount: number): string => {
  const parse = (hex: string) =>
    [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const [ar, ag, ab] = parse(accent) as [number, number, number];
  const [br, bg, bb] = parse(base) as [number, number, number];
  const channel = (a: number, b: number) =>
    Math.round(b + amount * (a - b))
      .toString(16)
      .padStart(2, "0");
  return `#${channel(ar, br)}${channel(ag, bg)}${channel(ab, bb)}`;
};

const soft = {
  cool: mix(palette.accent, palette.surface, softMix.rest),
  coolHover: mix(palette.accent, palette.surface, softMix.hover),
  coolPressed: mix(palette.accent, palette.surface, softMix.pressed),
  warm: mix(palette.warm, palette.surface, softMix.rest),
  warmHover: mix(palette.warm, palette.surface, softMix.hover),
  warmPressed: mix(palette.warm, palette.surface, softMix.pressed),
};

export interface Pair {
  what: string;
  fg: string;
  bg: string;
  /** 4.5 for text, 3 for a control's own edge (WCAG 1.4.11). */
  floor: number;
  /** Below the floor on purpose. Reported, never silently passed. */
  declared?: string;
}

export const pairs: Pair[] = [
  { what: "body text on the page", fg: palette.ink, bg: palette.bg, floor: 4.5 },
  { what: "muted text on the page", fg: palette.muted, bg: palette.bg, floor: 4.5 },
  { what: "dim text on the page", fg: palette.dim, bg: palette.bg, floor: 4.5 },
  { what: "dim text on a card", fg: palette.dim, bg: palette.surface, floor: 4.5 },
  { what: "dim text on a hovered card", fg: palette.dim, bg: steps["violet-a3"], floor: 4.5 },
  {
    what: "dim text on a pressed card",
    fg: palette.dim,
    bg: steps["violet-a4"],
    floor: 4.5,
    declared:
      "4.21:1, and it lasts as long as a mouse button is held. There is no assignment where dim clears 4.5 on both a hover and a pressed step above the card, so this is a floor rather than an oversight.",
  },
  {
    what: "card edge against the page",
    fg: palette.border,
    bg: palette.bg,
    floor: 3,
    declared:
      "A decorative edge, not a control. WCAG 1.4.11 applies to the boundaries of user interface components, which a card is not.",
  },
  // The primary is FILLED at rest now, and the secondary is an unfilled ring
  // that never gains a fill in any state. The old rows measured the reverse —
  // an outlined primary that filled on hover, and a secondary on the gray
  // ramp whose edge sat at 1.61:1. That miss is closed by the move onto the
  // cool ramp rather than waived, so its declaration is gone rather than
  // reworded.
  { what: "primary button label on its fill", fg: palette.bg, bg: steps["cool-9"], floor: 4.5 },
  { what: "primary button label on its hovered fill", fg: palette.bg, bg: steps["cool-12"], floor: 4.5 },
  { what: "primary button label on its pressed fill", fg: palette.bg, bg: steps["cool-11"], floor: 4.5 },
  { what: "secondary button edge against the page", fg: steps["cool-9"], bg: palette.bg, floor: 3 },
  { what: "secondary button edge, hovered", fg: steps["cool-12"], bg: palette.bg, floor: 3 },
  { what: "secondary button edge, pressed", fg: steps["cool-11"], bg: palette.bg, floor: 3 },
  { what: "secondary button label at rest", fg: steps["cool-11"], bg: palette.bg, floor: 4.5 },
  { what: "secondary button label, hovered", fg: steps["cool-12"], bg: palette.bg, floor: 4.5 },
  { what: "focus ring against the page", fg: steps["cool-9"], bg: palette.bg, floor: 3 },
  { what: "cool label on its soft fill", fg: steps["cool-11"], bg: soft.cool, floor: 4.5 },
  { what: "cool label on its hovered soft fill", fg: steps["cool-11"], bg: soft.coolHover, floor: 4.5 },
  { what: "cool label on its pressed soft fill", fg: steps["cool-11"], bg: soft.coolPressed, floor: 4.5 },
  { what: "warm label on its soft fill", fg: steps["warm-11"], bg: soft.warm, floor: 4.5 },
  { what: "warm label on its hovered soft fill", fg: steps["warm-11"], bg: soft.warmHover, floor: 4.5 },
  { what: "warm label on its pressed soft fill", fg: steps["warm-11"], bg: soft.warmPressed, floor: 4.5 },
  { what: "warm button edge against the page", fg: steps["warm-8"], bg: palette.bg, floor: 3 },
  { what: "page colour on the warm solid", fg: palette.bg, bg: palette.warm, floor: 4.5 },
  {
    what: "disabled text on a card",
    fg: steps["gray-8"],
    bg: palette.surface,
    floor: 4.5,
    declared:
      "Disabled controls are explicitly exempt from WCAG contrast minimums, and looking unavailable is the whole job. The one real exemption in the system.",
  },
];

export interface GateResult {
  text: string;
  failures: number;
}

export function gate(): GateResult {
  const lines: string[] = ["contrast gate", ""];
  let failures = 0;
  let declared = 0;

  const width = Math.max(...pairs.map((pair) => pair.what.length));

  for (const pair of pairs) {
    const ratio = contrast(pair.fg, pair.bg);
    const passes = ratio >= pair.floor;
    if (passes) {
      lines.push(
        `  ok    ${pair.what.padEnd(width)}  ${ratio.toFixed(2).padStart(6)}:1  floor ${pair.floor}`,
      );
      continue;
    }
    if (pair.declared) {
      declared++;
      lines.push(
        `  ·     ${pair.what.padEnd(width)}  ${ratio.toFixed(2).padStart(6)}:1  floor ${pair.floor}  declared`,
      );
      lines.push(`          ${pair.declared}`);
      continue;
    }
    failures++;
    lines.push(
      `  FAIL  ${pair.what.padEnd(width)}  ${ratio.toFixed(2).padStart(6)}:1  floor ${pair.floor}`,
    );
  }

  lines.push(
    "",
    `${pairs.length} pairs · ${declared} declared below floor · ${failures} failing`,
  );

  // The fill rule. Not a ratio, so it does not belong in the table above, but
  // it fails the same build for the same reason: it is a rule that holds in
  // every screenshot and breaks under a pointer. Three sightlines, because a
  // fill arrives three ways — declared, applied, or pasted onto the control
  // in the markup. See the header of fills.ts.
  const fills = fillViolations();
  lines.push("", "fill rule — only the primary carries a background");
  if (fills.length === 0) {
    lines.push("  ok    no control but btn-primary gets one");
  }
  for (const finding of fills) {
    failures++;
    lines.push(
      `  FAIL  ${finding.control} gets a background`,
      `          ${finding.file}:${finding.line}  ${finding.source}`,
    );
  }

  return { text: lines.join("\n"), failures };
}
