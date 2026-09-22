/**
 * The experiment registry.
 *
 * Experiments are .astro pages rather than MDX entries — they render live
 * candidates side by side, which is not something a prose loader can
 * describe. So the metadata lives here, in one typed list that the lab index,
 * the experiment pages and the project detail pages all read. One list rather
 * than three that can disagree.
 *
 * Numbering is global and sequential across every project, which is what
 * makes the lab read as a notebook. It also means an abandoned experiment
 * leaves a permanent visible gap — accepted deliberately.
 */

/**
 * Who an experiment was run for.
 *
 * `href` is absent for the site itself, and that absence is the model, not an
 * omission: /lab *is* the site's project page, so it has no row in /projects
 * and there is nowhere else to point. Everything else links to its write-up.
 */
export interface Project {
  name: string;
  /** Shown after the name, in parentheses. For the site, says so. */
  note?: string;
  href?: string;
}

export const projects: Record<string, Project> = {
  "reys-lab": { name: "Rey’s Lab", note: "this site" },
  "rookie-trader": {
    name: "Rookie Trader",
    href: "/projects/rookie-trader",
  },
  grounder: { name: "Grounder", href: "/projects/grounder" },
};

export interface Experiment {
  /** Zero-padded, and the prefix of the slug. */
  number: string;
  /** Path segment under /lab/experiments. */
  slug: string;
  title: string;
  /** `settled` freezes the page: it is a record and is never updated. */
  status: "open" | "settled";
  /** ISO date. Opened, or settled — whichever the status says. */
  date: string;
  summary: string;
  /**
   * Required, always. An experiment with an implicit owner reads as hanging
   * in space — which is exactly what it looked like when the site's own
   * experiments left this undefined and nothing rendered.
   */
  project: keyof typeof projects;
}

export const experiments: Experiment[] = [
  {
    number: "01",
    slug: "01-choosing-a-palette",
    title: "Choosing a palette",
    status: "settled",
    date: "2026-09-20",
    project: "reys-lab",
    summary:
      "Four palettes built, three judged at full-screen scale, violet c won. Frozen: the losing palettes still render there and nowhere else on the site.",
  },
  {
    number: "03",
    slug: "03-the-primary-action",
    title: "The primary action",
    status: "settled",
    date: "2026-09-21",
    project: "reys-lab",
    summary:
      "Ten candidates, and the winner was not in the grid. The question looked like which treatment and hue the primary should take; it was really a rule the pair never had — a fill means primary, so the secondary never gets one.",
  },
  {
    number: "02",
    slug: "02-the-hero-signature",
    title: "The hero signature",
    status: "open",
    date: "2026-09-20",
    project: "reys-lab",
    summary:
      "Whether the name carries a multi-hue gradient, and drawn from what. Six fills including no fill at all, at the size they would ship at.",
  },
];

export const href = (experiment: Experiment) =>
  `/lab/experiments/${experiment.slug}`;

export const owner = (experiment: Experiment) => projects[experiment.project];

export const bySlug = (slug: string) =>
  experiments.find((experiment) => experiment.slug === slug);

/** Open first — an open experiment is the live one and should read that way. */
export const byStatus = (status: Experiment["status"]) =>
  experiments
    .filter((experiment) => experiment.status === status)
    .sort((a, b) => b.number.localeCompare(a.number));

/** The project↔experiment relation, read from the project's side. */
export const forProject = (project: string) =>
  experiments
    .filter((experiment) => experiment.project === project)
    .sort((a, b) => a.number.localeCompare(b.number));
