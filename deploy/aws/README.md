# deploy/aws

Publishes `apps/web/dist` to S3, served by CloudFront at `andrejkolic.com` (apex and
`www`, which 301-redirects to it) and `lab-staging.andrejkolic.com`. DNS stays in Route 53
— see the "custom domain" section of the monorepo plan for why AWS was picked over moving
nameservers to Cloudflare.

Adapted from [rookie-trader](https://github.com/andrej-kolic/rookie-trader)'s
`infra/aws`, itself based on AWS's
[amazon-cloudfront-secure-static-site](https://github.com/aws-samples/amazon-cloudfront-secure-static-site)
sample: CloudFormation templates (`templates/`), a deploy script (`scripts/deploy.sh`),
and a scoped GitHub OIDC role for CI. `docs/` and the Makefile are carried over from that
sample and describe the generic template rather than this repo's setup — read this file
first.

Nothing here is imported by `apps/web` — the dependency runs one way only.

## Environments

Defined in `deploy-config.json`:

- **`staging`** — `lab-staging.andrejkolic.com`, no apex. Permanent: it's the only place
  to test infra changes (the redirect function, CSP, cache rules) before production —
  `*.workers.dev` (the Cloudflare target) only tests application pages, not this
  infrastructure.
- **`production`** — `www.andrejkolic.com` plus the apex.

Each is a separate CloudFormation stack (`reys-lab-staging`, `reys-lab-production`), so a
staging change can't touch production.

## Deploying

Preferred: the "Deploy AWS infra" and "Deploy AWS content" GitHub Actions workflows
(`workflow_dispatch`, pick the environment). Content deploys build first, so the gate
(`packages/design-rules`) runs before anything ships.

Locally, from this directory:

```
./scripts/deploy.sh infra staging      # CloudFormation stack: S3, ACM, CloudFront, Route 53
./scripts/deploy.sh content staging    # sync apps/web/dist, invalidate the cache
./scripts/deploy.sh outputs staging    # bucket name, distribution id, URL
```

Swap `staging` for `production` once a change is verified on staging. `pnpm exec turbo run
deploy` (not `pnpm --filter @reys-lab/deploy-aws deploy` — pnpm 11 reserves `deploy` as a
built-in command) runs the package's own `deploy` script, which targets staging content
only; anything else, including any production action or an infra deploy, is deliberately a
manual step, not a one-liner.

## Credentials

CI: `AWS_ROLE_ARN` as a repository secret, assumed via GitHub OIDC — no long-lived AWS
keys. The role (`templates/github-oidc.yaml`) is scoped to this project's own stacks,
S3 buckets and CloudFront resources, set up once with `./scripts/oidc.sh`.

Local: an AWS CLI profile with credentials for account `629994690329`.

## Changing the CSP or cache rules

Edit `templates/cloudfront-site.yaml` (`ResponseHeadersPolicy` for headers,
`ViewerRequestFunction` for the www redirect and the directory-index rewrite, the
`*CachePolicy` resources for TTLs), then deploy infra to staging and check the browser
console before production.
