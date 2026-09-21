# AGENTS.md — reys-lab

Portfolio and developer blog for andrejkolic.com. Astro, static output, pnpm workspaces
driven by turbo.

The `README.md` is the front door and states the architecture rules — static-only app, no
adapter, `dist/` as the contract, dependency arrow pointing from `deploy/*` to `apps/web`.
Read it before changing anything structural; breaking one of those is a bug, not a style
preference.

## Layout

```text
apps/web/              Astro. Static. Knows nothing about hosting.
  src/pages/lab/       the playground: experiments and reference pages
  src/styles/          global.css (tokens + utilities), scales.css (generated Radix steps)
packages/design-rules/ the gate — contrast matrix and the fill rule
packages/eslint-config/ shared eslint config
deploy/cloudflare/     wrangler config and a one-line deploy script
services/              future independent backends (empty)
```

## Plans live outside the repo

Every architecture and design decision is recorded in three plan files in the Obsidian
vault, not in this repository:

```text
~/Documents/obsidian/dev/10-Projects/reys-lab/plans/
  reys-lab-design-plan.md         how it looks, and why
  reys-lab-design-system-plan.md  tokens, states, the gate
  reys-lab-monorepo-plan.md       architecture
```

They are the source of truth and they cite commit SHAs. Read the relevant one before
proposing a change, and update it when a decision changes — a decision that exists only in
a commit message is a decision that will be re-argued in a month.

## The gate

`packages/design-rules` checks the design rules that are rules rather than taste. Two of
them today:

1. **Contrast.** Every foreground/background pair the site actually paints, including
   hovered and pressed states, measured against its WCAG floor. A pair below floor on
   purpose is *declared* with a reason and reported without failing; silence is not an
   option.
2. **A fill means primary.** Only `btn-primary` may declare a background. `fills.ts` reads
   `global.css` and fails on any background inside another `btn-*` block.

`build` dependsOn `^gate` in `turbo.json`, so building runs it. The `gate` task declares
`apps/web/src/styles/global.css` in its `inputs` because it reads a file outside its own
package — remove that and turbo will cache past a stylesheet the gate never read, which
has already happened once.

Run it alone with `pnpm run gate`. It prints every pair, so read the output rather than
just the exit code.

## Quality loop

1. Change `apps/web/src/` or `packages/`
2. `pnpm run build` — includes the gate
3. `pnpm run lint` and `pnpm run check`
4. For anything visual, look at it. This project settles design questions by looking, in a
   `/lab/experiments/` page, not by arguing in prose.

CI runs exactly those commands on every pull request, and `Gate, lint and types` is a
required check on `main`.

## Conventions

- Node 24 (`.nvmrc`), pnpm 11. Shared dependency versions are pinned once in the
  `catalog:` block of `pnpm-workspace.yaml`.
- **Merge commits only.** Squash and rebase are disabled on the GitHub repo. The plans cite
  commit SHAs, and a rebase merge rewrites every one of them.
- **Commits follow the `git` rule** — Conventional Commits, one logical change each,
  adopted 2026-09-21. Everything before that date is prose subjects ("Settle experiment 03
  on J, and make a fill mean primary"); that history stays as it is and is never rewritten.
  Put the PR number in the subject when there is one: `fix(design-rules): declare the css
  input (#3)`.
- Comments in `global.css` carry the reasoning for the values above them. If you change a
  value, change the comment in the same edit; a comment that argues with the code below it
  is worse than no comment.
- Colour work is gated by the design-system plan. Do not invent a state value — every
  hover, pressed, focus and disabled value is a step on a generated scale in `scales.css`.
- Experiment pages are records. A settled experiment keeps its losing candidates on the
  page; nothing is rewritten to match the verdict.

## Where things are written down

- `README.md` — architecture rules, layout, deployment, licensing
- `apps/web/AGENTS.md` — Astro specifics and doc links for the app itself
- `.claude/rules/` and `.cursor/rules/` — cross-project rules for commits, testing,
  security, docs and prose. **Generated, not edited here.** They come from
  `andrej-kolic/playbook`; refresh with `pnpm rules:install`, and make changes in that
  repo. Each file's first line carries a `<!-- playbook:<name> vN (date) -->` marker, so a
  stale copy is visible by reading it.
- `/lab/reference/` on the site — the palette, the scale and the components, as published
  pages that are meant to stay true
