/**
 * The palette, as data.
 *
 * A mirror of `apps/web/src/styles/global.css`, and the one thing in this
 * package that can drift. It is a mirror rather than a parser because the
 * alternative — reading the CSS and resolving `color-mix` and custom
 * property chains — is a small browser, and the gate is not worth a small
 * browser. The list is short and the drift shows up as a gate result that
 * disagrees with the page, which is a loud failure rather than a quiet one.
 *
 * Nothing here generates anything. An earlier version of this package tried
 * to derive the palette from a curve; it is deleted, and the reasoning is in
 * the README. These are the values that were eyedropped off the reference
 * frames, and they stay eyedropped.
 */

/** Sampled off the supernova and canyon-portal frames. Settled 2026-09-20. */
export const palette = {
  void: "#100c24",
  bg: "#191233",
  surface: "#241e47",
  raised: "#33286c",
  border: "#3f3179",
  line: "#6b449b",
  ink: "#edebfb",
  muted: "#ada8d1",
  dim: "#9d98be",
  accent: "#3bb8f5",
  warm: "#ffd23f",
} as const;

/**
 * Steps from the pasted Radix scales that the site binds to. Only the ones
 * something actually renders — the rest are kept whole in `scales.css` so
 * the file stays regenerable, and a value nothing uses does not need
 * checking.
 */
export const steps = {
  "violet-a3": "#332c5d", // --lab-hover, composited over the surface
  "violet-a4": "#3b2e72", // --lab-pressed, likewise
  "cool-8": "#007bb3", // --lab-outline
  "cool-9": "#3bb8f5", // --lab-solid, --lab-focus
  "cool-10": "#2aade9", // --lab-solid-hover
  "cool-11": "#48c3ff", // --lab-outline-ink
  "warm-8": "#816b28",
  "warm-11": "#ffd23f",
  "gray-6": "#3c3950", // the secondary button's resting border
  "gray-7": "#494561", // and its hovered one
  "gray-8": "#615b83", // --lab-disabled-text
} as const;

/**
 * The soft fills, which are the one place the site computes a colour rather
 * than naming one: the card surface tinted with an accent, in sRGB, at three
 * strengths. Resolved here so the gate checks what is painted.
 */
export const softMix = { rest: 0.08, hover: 0.12, pressed: 0.16 } as const;
