/**
 * The build's identity, read from git.
 *
 * Git is the single source of truth for what a deployed build is running —
 * see "Versioning" in the monorepo plan. Nothing here is numbered by hand:
 * no package version, no required tag. `date` is the commit's own time, not
 * the time of the build, so rebuilding the same commit produces the same
 * output.
 */
import { execFileSync } from "node:child_process";
import { site } from "./site";

export interface VersionInfo {
  /** Full SHA. Footer and `versions` script display the first 7 chars. */
  commit: string;
  branch: string;
  /** Commit time, ISO 8601 UTC. */
  date: string;
  dirty: boolean;
  source: string;
}

const git = (...args: string[]) =>
  execFileSync("git", args, { encoding: "utf8" }).trim();

let cached: VersionInfo | undefined;

export function getVersion(): VersionInfo {
  if (!cached) {
    const commitEpochSeconds = Number(git("show", "-s", "--format=%ct", "HEAD"));
    cached = {
      commit: git("rev-parse", "HEAD"),
      // CI checks out a detached HEAD, so `git branch --show-current` is
      // empty there; GITHUB_REF_NAME carries the branch name instead.
      branch: process.env.GITHUB_REF_NAME || git("branch", "--show-current"),
      date: new Date(commitEpochSeconds * 1000).toISOString(),
      dirty: git("status", "--porcelain").length > 0,
      source: site.repo,
    };
  }
  return cached;
}

export const shortSha = (commit: string) => commit.slice(0, 7);

/** "2026-09-25 14:32" — the footer's and `versions` script's format. */
export const formatBuildTimestamp = (date: string) =>
  date.slice(0, 16).replace("T", " ");
