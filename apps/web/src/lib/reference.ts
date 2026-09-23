/**
 * The reference pages, listed once: the /lab cards and each page's own
 * eyebrow both read from here, so the two cannot disagree.
 *
 * The label is a count of what the page holds — a fact the title does not
 * give, like the counts on the list pages. Chosen in #14 over a single word
 * per page, which mostly repeated the title ("Palette" on Colour). The counts
 * are typed, not computed: the data lives in each page's frontmatter, so a
 * page that gains a token, a step or a component updates its count here.
 */

export interface Reference {
  href: string;
  title: string;
  label: string;
  body: string;
}

export const reference: Reference[] = [
  {
    href: "/lab/reference/type",
    title: "Type",
    label: "2 faces",
    body: "Outfit over IBM Plex Mono. The full specimen, the micro-label tracking ramp and the scale — the place to check a size before it ships.",
  },
  {
    href: "/lab/reference/colour",
    title: "Colour",
    label: "13 tokens · 28 pairs",
    body: "Violet c as live token swatches, plus a contrast matrix computed in the page against WCAG AA — the minimum text-contrast standard.",
  },
  {
    href: "/lab/reference/scale",
    title: "Scale",
    label: "9 steps · 5 accents",
    body: "The palette plotted by brightness, colourfulness and hue. A measurement rather than a specification — including the finding that its steps are eleven times apart, which is why it is not generated.",
  },
  {
    href: "/lab/reference/components",
    title: "Components",
    label: "8 components",
    body: "The pieces that actually recur: project card, list row, micro-label, code block, link states, timeline node.",
  },
];

/** The label for one page, by its path. Throws on a page missing from the list. */
export const labelFor = (href: string) => {
  const page = reference.find((entry) => entry.href === href);
  if (!page) throw new Error(`No reference entry for ${href}`);
  return page.label;
};
