# deploy/cloudflare

Publishes `apps/web/dist` to Cloudflare Workers Static Assets.

```
pnpm --filter @reys-lab/deploy-cloudflare deploy
```

Nothing here is imported by `apps/web` — the dependency runs one way only.

## Credentials

Local: `wrangler login` (browser OAuth).

CI: `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as repository secrets. The
token is a scoped "Edit Cloudflare Workers" token, not the global API key.
