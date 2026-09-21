/**
 * Colour maths. Hex in, WCAG contrast out, plus the OKLCH conversion
 * `/lab/reference/scale` uses to report where a step actually landed.
 *
 * What is left is what the gate needs. The scale generator this file was
 * built for is gone — see the README — and its gamut mapping, hue mixing and
 * OKLab distance went with it on 2026-09-21, rather than sitting here
 * exported and unused as a hint that regenerating is still on the table.
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

export function parseHex(hex: string): Rgb {
  const body = hex.replace("#", "");
  if (body.length !== 6) throw new Error(`not a six-digit hex: ${hex}`);
  return {
    r: parseInt(body.slice(0, 2), 16) / 255,
    g: parseInt(body.slice(2, 4), 16) / 255,
    b: parseInt(body.slice(4, 6), 16) / 255,
  };
}

const toLinear = (value: number) =>
  value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;

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
