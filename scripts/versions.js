#!/usr/bin/env node
// Fetches /version.json from every deployed target and prints one line
// each. A script, not a lab page: a page can't read JSON from other origins
// without CORS on each host. See "Versioning" in the monorepo plan.

const targets = [
  { name: "aws-staging", url: "https://lab-staging.andrejkolic.com/version.json" },
  { name: "cf-workers", url: "https://reys-lab-web.andrejkolic.workers.dev/version.json" },
  { name: "aws-prod", url: "https://andrejkolic.com/version.json" },
];

const nameWidth = Math.max(...targets.map((target) => target.name.length));
const branchWidth = 16;

const results = await Promise.all(
  targets.map(async (target) => {
    try {
      const response = await fetch(target.url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return { ...target, version: await response.json() };
    } catch (error) {
      return { ...target, error };
    }
  }),
);

for (const result of results) {
  const name = result.name.padEnd(nameWidth);
  if (result.error) {
    console.log(`${name}  error: ${result.error.message}`);
    continue;
  }
  const { commit, branch, date, dirty } = result.version;
  const line = [
    name,
    commit.slice(0, 7),
    branch.padEnd(branchWidth),
    date.slice(0, 16).replace("T", " "),
  ];
  if (dirty) line.push("dirty");
  console.log(line.join("  "));
}
