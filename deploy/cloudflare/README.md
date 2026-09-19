# deploy/cloudflare

Publishes `apps/web/dist` to Cloudflare Workers Static Assets.

```
pnpm exec turbo run deploy
```

Not `pnpm --filter @reys-lab/deploy-cloudflare deploy`: pnpm 11 reserves `deploy`
as a built-in command, so that form never reaches the script and fails with
`ERR_PNPM_INVALID_DEPLOY_TARGET`. Going through turbo also picks up the
`deploy → ^build` edge, so `apps/web` is rebuilt first rather than shipping a
stale `dist/`.

Nothing here is imported by `apps/web` — the dependency runs one way only.

## Credentials

Local: `wrangler login` (browser OAuth).

CI: `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as repository secrets. The
token is a scoped "Edit Cloudflare Workers" token, not the global API key.
