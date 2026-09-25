#!/bin/bash

# Production-only safety checks for a content deploy — see "Versioning" in
# the monorepo plan. Kept out of deploy.sh, not merged into it: deploy.sh is
# adapted from rookie-trader's infra/aws, and these checks are reys-lab-
# specific, not part of the S3+CloudFront mechanics the two projects share.
# Sourced by deploy.sh, so this runs the same way locally and in CI — the
# workflow has no checks of its own, only deploy.sh does.

VERSION_JSON="${MONOREPO_ROOT_DIR}/apps/web/dist/version.json"

refuse_non_main_production() {
    print_info "Checking the build's branch is main..."
    if [ ! -f "$VERSION_JSON" ]; then
        print_error "$VERSION_JSON not found — build the site first."
        exit 1
    fi
    # dist/ is gitignored, so it survives a later `git checkout`: the
    # currently checked-out branch can drift from what was actually built.
    # version.json's own branch is the artifact's ground truth.
    local branch
    branch=$(jq -r .branch "$VERSION_JSON")
    if [ "$branch" != "main" ]; then
        print_error "Production deploys must be a build of main (got '$branch')"
        exit 1
    fi
}

refuse_dirty_production() {
    print_info "Checking build is not dirty..."
    if [ ! -f "$VERSION_JSON" ]; then
        print_error "$VERSION_JSON not found — build the site first."
        exit 1
    fi
    if [ "$(jq -r .dirty "$VERSION_JSON")" = "true" ]; then
        print_error "Refusing to deploy a dirty build to production."
        exit 1
    fi
}

require_staging_match_production() {
    print_info "Checking production build matches staging's commit..."
    local staging_subdomain staging_domain staging_url staging_commit built_commit
    staging_subdomain=$(jq -r ".environments.staging.parameters.SubDomain" "$CONFIG_FILE")
    staging_domain=$(jq -r ".environments.staging.parameters.DomainName" "$CONFIG_FILE")
    # Cache-busted: the HTML cache policy keys on query string
    # (templates/cloudfront-site.yaml), so a unique one forces an origin read
    # instead of a response up to 60s stale.
    staging_url="https://${staging_subdomain}.${staging_domain}/version.json?_=$(date +%s)"
    staging_commit=$(curl -fsSL "$staging_url" | jq -r .commit)
    built_commit=$(jq -r .commit "$VERSION_JSON")

    if [ -z "$staging_commit" ]; then
        print_error "Could not read a commit from $staging_url"
        exit 1
    fi
    if [ "$staging_commit" != "$built_commit" ]; then
        print_error "Staging is serving $staging_commit but this build is $built_commit — deploy to staging first."
        exit 1
    fi
}

check_production_safety() {
    refuse_non_main_production
    refuse_dirty_production
    require_staging_match_production
    print_success "Production safety checks passed."
}
