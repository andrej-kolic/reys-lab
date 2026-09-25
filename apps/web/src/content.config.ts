import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

/**
 * The boundary between content and presentation.
 *
 * Zod runs at build time, so a post missing a `date` fails the build rather
 * than rendering "Invalid Date" in production, and templates get real types
 * off `entry.data` instead of `any`.
 *
 * Experiments are deliberately absent. They are bespoke .astro comparison
 * pages, not prose, so a glob-over-MDX loader does not describe them — they
 * live in `src/lib/experiments.ts` instead. See the monorepo plan.
 */

const blog = defineCollection({
  loader: glob({ base: "./src/content/blog", pattern: "**/*.mdx" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const projects = defineCollection({
  loader: glob({ base: "./src/content/projects", pattern: "**/*.mdx" }),
  schema: ({ image }) => z.object({
    title: z.string(),
    /** One sentence, no adjectives. Carries the whole card. */
    description: z.string(),
    /**
     * Hand-ranked, ascending, best first. The projects index is never sorted
     * by date: chronology buries the best work under the most recent.
     */
    order: z.number(),
    stack: z.array(z.string()).default([]),
    status: z.string(),
    /**
     * The card's image, a path relative to the .mdx file. Optional until
     * every project has one; a card without it shows the dot-grid
     * placeholder. See the content plan (#24).
     */
    thumbnail: image().optional(),
    /**
     * Outbound links, one button each, in this order. Rendered on the detail
     * page only — a card that links straight to GitHub means the write-up
     * never gets opened, and the section degrades into a link list. A list
     * rather than fixed fields because projects differ in kind: a web app
     * has a live demo, a CLI has a package registry.
     */
    links: z
      .array(z.object({ label: z.string(), url: z.url() }))
      .default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog, projects };
