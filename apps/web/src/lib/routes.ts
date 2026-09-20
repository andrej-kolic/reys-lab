/**
 * The number of static routes the site builds.
 *
 * It lives here rather than inline on /lab because `import.meta.glob` silently
 * omits the module doing the globbing — done from a page, the count is always
 * one short and looks entirely plausible while being wrong. From outside
 * src/pages there is nothing to omit.
 *
 * `**` requires at least one directory, so the top-level pages need a pattern
 * of their own.
 */
export const routeCount = Object.keys(
  import.meta.glob(["../pages/*.astro", "../pages/**/*.astro"]),
).length;
