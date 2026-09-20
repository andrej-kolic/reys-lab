/**
 * How many pages the site actually builds.
 *
 * Two parts, because two kinds of route exist. Static `.astro` pages are
 * globbed; the two dynamic routes emit one page per content entry instead, so
 * they are subtracted and the collections counted in their place. Counting
 * files alone reported 12 against a real 16.
 *
 * It lives here rather than inline on /lab because `import.meta.glob` silently
 * omits the module doing the globbing — done from a page, the count is always
 * one short and looks entirely plausible while being wrong. From outside
 * src/pages there is nothing to omit.
 *
 * `**` requires at least one directory, so the top-level pages need a pattern
 * of their own.
 */
import { getCollection } from "astro:content";

const pageFiles = Object.keys(
  import.meta.glob(["../pages/*.astro", "../pages/**/*.astro"]),
);

const dynamic = pageFiles.filter((path) => path.includes("["));

export async function countRoutes() {
  const [blog, projects] = await Promise.all([
    getCollection("blog", ({ data }) => !data.draft),
    getCollection("projects", ({ data }) => !data.draft),
  ]);
  return pageFiles.length - dynamic.length + blog.length + projects.length;
}
