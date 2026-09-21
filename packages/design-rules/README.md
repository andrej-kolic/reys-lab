# @reys-lab/design-rules

The design plan's rules, checked. Not all of them — only the ones that are
rules rather than taste, and so can be decided by a program.

Two of them so far:

- **Contrast.** Every colour pair the site renders, against the floor it has
  to clear, with the ones that sit below their floor on purpose declared
  rather than rediscovered.
- **The fill rule.** Among controls, only the primary carries a background.
  Settled by experiment 03 on 2026-09-21.

It was called `contrast` until the second one arrived, which is the drift the
name now avoids: the plan has more of this shape waiting — colour is never
the only signal, neither accent is ever a large fill, warm is never a link.

```
pnpm --filter @reys-lab/design-rules gate
```

Exits non-zero on a failure, so it can be a build step.

## Why a program and not a page

`/lab/reference/colour` already prints a contrast matrix, and it caught a
real AA failure once — by luck, because somebody happened to look at it. A
page catches a problem when it is read. This catches it when a value
changes.

The two rules it follows, both learned on this site:

**Every pair is listed, including hovered and pressed.** An unmeasured hover
is where a control quietly breaches a floor, because nobody screenshots a
hover.

**A pair below its floor on purpose is declared, with the reason.** It
reports as `declared` and does not fail. Five of the twenty-three are:
dim-on-pressed at 4.21, the card edge and the secondary button's edge in
both states, and disabled text. Without this they get found again every few
months and argued about from scratch.

## The scale generator that used to live here

This package was a colour scale generator. It is gone, and the reasoning is
worth keeping because the instinct to rebuild it will come back.

The idea was that the sampled palette describes a shape, so the shape could
be continued — filling the steps the hand-built ladder kept needing, and
making a second theme a config change. Two versions were built. The first
pinned every sampled colour and interpolated between them, which reproduced
the identity exactly and regularised nothing: a line forced through uneven
points is uneven. The second fitted smooth curves near the samples instead,
which produced an even ramp — every step 1.184× the last, one hue throughout
— at the cost of moving every colour, `raised` by the most at 0.048 in
OKLab.

Both were rejected by looking, and the reason is structural. This palette's
dark end is deliberately compressed: the page and a card are nearly the same
colour and the border carries the separation, which is the reference's
rim-light grammar and the thing the whole look rests on. An evenly spaced
scale exists to make adjacent steps clearly distinct. Those are opposite
instructions and no single curve satisfies both — which is the same wall the
design-system plan hit from the other direction when it tried to regenerate
the palette through Radix.

What the generator was actually buying was five in-between values and this
gate. Two of the five came out worse than the hand-mixed versions. The gate
does not need a generator.

The measurement survives at `/lab/reference/scale`, which plots the palette
and shows the eleven-to-one spread that settled it.
