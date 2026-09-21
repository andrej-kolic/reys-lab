/**
 * Colour maths. OKLCH in, sRGB hex out, plus the two contrast functions the
 * gate needs.
 *
 * OKLCH rather than HSL or Lab because the whole generator is an argument
 * about perceptual spacing: a lightness curve is only meaningful if equal
 * steps look equal, and OKLab is the cheapest space where they roughly do.
 * Hue is kept separate from chroma so a scale can rotate hue without
 * changing how saturated it is, which is the mechanism the accent scales run
 * on.
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface Oklch {
  /** 0 (black) to 1 (white). Not CIE L*, which runs 0–100. */
  l: number;
  c: number;
  /** Degrees, 0–360. */
  h: number;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export function parseHex(hex: string): Rgb {
  const body = hex.replace("#", "");
  if (body.length !== 6) throw new Error(`not a six-digit hex: ${hex}`);
  return {
    r: parseInt(body.slice(0, 2), 16) / 255,
    g: parseInt(body.slice(2, 4), 16) / 255,
    b: parseInt(body.slice(4, 6), 16) / 255,
  };
}

export function toHex({ r, g, b }: Rgb): string {
  const channel = (value: number) =>
    Math.round(clamp01(value) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

const toLinear = (value: number) =>
  value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;

const fromLinear = (value: number) =>
  value <= 0.0031308 ? value * 12.92 : 1.055 * value ** (1 / 2.4) - 0.055;

export function rgbToOklch({ r, g, b }: Rgb): Oklch {
  const lr = toLinear(r);
  const lg = toLinear(g);
  const lb = toLinear(b);

  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);

  const okL = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const okA = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const okB = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  return {
    l: okL,
    c: Math.hypot(okA, okB),
    h: ((Math.atan2(okB, okA) * 180) / Math.PI + 360) % 360,
  };
}

export function oklchToRgb({ l, c, h }: Oklch): Rgb {
  const radians = (h * Math.PI) / 180;
  const a = c * Math.cos(radians);
  const b = c * Math.sin(radians);

  const lc = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const mc = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const sc = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;

  return {
    r: fromLinear(4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc),
    g: fromLinear(-1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc),
    b: fromLinear(-0.0041960863 * lc - 0.7034186147 * mc + 1.707614701 * sc),
  };
}

const EPSILON = 1e-6;

const inGamut = ({ r, g, b }: Rgb) =>
  r >= -EPSILON && r <= 1 + EPSILON &&
  g >= -EPSILON && g <= 1 + EPSILON &&
  b >= -EPSILON && b <= 1 + EPSILON;

/**
 * Bring a colour into sRGB by giving up chroma, never lightness.
 *
 * Clipping the channels instead — which is what happens if you just round —
 * shifts hue and lightness together and does it differently per hue, so two
 * steps built from the same curve stop being the same distance apart. Losing
 * chroma is visible but it is visible in one dimension, and it is the one
 * dimension the curve is not making promises about.
 */
export function toGamut(colour: Oklch): { rgb: Rgb; clipped: boolean } {
  const direct = oklchToRgb(colour);
  if (inGamut(direct)) return { rgb: direct, clipped: false };

  let low = 0;
  let high = colour.c;
  for (let i = 0; i < 24; i++) {
    const mid = (low + high) / 2;
    if (inGamut(oklchToRgb({ ...colour, c: mid }))) low = mid;
    else high = mid;
  }
  return { rgb: oklchToRgb({ ...colour, c: low }), clipped: true };
}

export const hexOf = (colour: Oklch) => toHex(toGamut(colour).rgb);

export const oklchOf = (hex: string) => rgbToOklch(parseHex(hex));

/** WCAG 2.x relative luminance. Deliberately not OKLab lightness — the floors
 *  the site is checked against are WCAG's, so the check has to be WCAG's. */
export function luminance(hex: string): number {
  const { r, g, b } = parseHex(hex);
  return (
    0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
  );
}

export function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Euclidean distance in OKLab. Used only to report how far a generated step
 *  landed from the sampled value it is meant to reproduce. */
export function difference(a: string, b: string): number {
  const x = oklchOf(a);
  const y = oklchOf(b);
  const toAb = ({ l, c, h }: Oklch) => {
    const radians = (h * Math.PI) / 180;
    return [l, c * Math.cos(radians), c * Math.sin(radians)] as const;
  };
  const [l1, a1, b1] = toAb(x);
  const [l2, a2, b2] = toAb(y);
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
}

/** Shortest way round the hue circle, so 350° to 10° is +20 and not −340. */
export function mixHue(from: number, to: number, t: number): number {
  const delta = ((to - from + 540) % 360) - 180;
  return (from + delta * t + 360) % 360;
}
