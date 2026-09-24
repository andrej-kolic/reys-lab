# reys-lab

Portfolio and developer blog for andrejkolic.com.

## Architecture rules

These are the point of the repo. Breaking one is a bug, not a style preference.

**1. `apps/web` is static-only. No Astro adapter. Ever.**
`astro build` emits plain HTML/CSS/JS. An adapter (`@astrojs/cloudflare`, `@astrojs/vercel`, …)
compiles the site into one vendor's runtime and puts that vendor inside the app package at the
build layer. That is the lock-in we are avoiding, and no deployment wrapper can undo it.

**2. The contract between app and deployment is the `dist/` directory.**
Not a TypeScript interface. The filesystem is the most portable contract there is.

**3. The dependency arrow points one way.**
`deploy/*` depends on `apps/web`. `apps/web` knows nothing about deployment. This is enforced
by the workspace dependency in each deploy package — if it ever reverses, it shows up in a
`package.json` diff.

**4. Backends are separate deployables.**
See `services/README.md`.

## Layout

```
apps/web/          Astro. Static. Knows nothing about hosting.
deploy/aws/        S3 + CloudFront + Route 53, live host for andrejkolic.com
deploy/cloudflare/ wrangler config + a one-line deploy script
packages/          shared eslint config
services/          future independent backends (empty)
```

## Deployment

Every package under `deploy/*` exposes a `deploy` script and publishes `apps/web/dist`.
Adding a host means adding a folder and a CI job — zero application changes.

- **`deploy/aws`** — S3 + CloudFront, DNS in Route 53. The live host for
  `andrejkolic.com`; see `deploy/aws/README.md`.
- **`deploy/cloudflare`** — Cloudflare Workers Static Assets, kept as the portability
  proof that the static-only architecture isn't tied to one host.

Not `pnpm --filter <package> deploy`: pnpm 11 reserves `deploy` as a built-in command, so
that form never reaches the package's script. Go through turbo instead, which also picks
up the `deploy → ^build` edge so `apps/web` is rebuilt first:

```
pnpm exec turbo run deploy --filter=@reys-lab/deploy-aws
```

## Licensing

Two licenses, deliberately:

- **`LICENSE`** — MIT, covering the source code. Take it, use it.
- **`LICENSE-CONTENT`** — the writing and media. Rights reserved, but quoting and linking
  are fine and anything more is a matter of asking.

The split exists because "MIT" on a repo that contains your writing licenses strangers to
republish your writing. Loosening the content terms later (to Creative Commons, say) is
easy; tightening them is not, because a CC grant on an already-published version cannot be
withdrawn. So the restrictive side is the reversible one.

## Requirements

Node 24 (`.nvmrc`), pnpm 11. Shared dependency versions are pinned once in the
`catalog:` block of `pnpm-workspace.yaml`.
