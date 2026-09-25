/**
 * Site identity and the navigation, declared once.
 *
 * Four items is roughly the ceiling before the nav starts looking bigger than
 * the site. Home is the wordmark, not a fifth item. About is not here: it is
 * merged into /cv, because a CV page and an About page tell the same story
 * twice and then neither stays current.
 *
 * Plain nouns on purpose. The lab metaphor lives in the micro-labels and the
 * page structure; a nav label that makes a recruiter guess what the section
 * is has cost more than the metaphor earned.
 */

export const site = {
  /* A typographic apostrophe, not a straight one. The hero has always set the
     name with \u2019 and the wordmark with \u0027, so the two rendered the same
     words differently on the same page, about 200px apart. */
  name: "Rey\u2019s Lab",
  author: "Andrej Kolić",
  positioning: "Full-stack engineer. React and AWS, currently learning the edge.",
  email: "andrej.kolic@gmail.com",
  github: "https://github.com/andrej-kolic",
  repo: "https://github.com/andrej-kolic/reys-lab",
} as const;

export interface NavItem {
  href: string;
  label: string;
}

export const nav: NavItem[] = [
  { href: "/projects", label: "Projects" },
  { href: "/blog", label: "Blog" },
  { href: "/cv", label: "CV" },
  { href: "/lab", label: "Lab" },
];

/**
 * Home is the wordmark rather than a nav item, so it needs its own check.
 * Without one the home page is the only page on the site where nothing is
 * marked current — no `aria-current` anywhere in the document, so the nav's
 * whole current-page system simply does not fire there.
 *
 * Exact match after normalising the trailing slash. `/` is current; `/blog`
 * is not, and neither is anything below it, because every other path has a
 * nav item of its own to carry the mark.
 */
export const isHome = (pathname: string) => pathname.replace(/\/+$/, "") === "";

/**
 * A nav item is current for its whole subtree, so /blog/a-post still marks
 * Blog. Exact match alone would leave every detail page with no current item.
 */
export const isCurrent = (pathname: string, item: NavItem) => {
  const path = pathname.replace(/\/+$/, "") || "/";
  return path === item.href || path.startsWith(`${item.href}/`);
};

export const formatDate = (date: Date | string) =>
  new Date(date).toISOString().slice(0, 10);

export const year = (date: Date | string) => new Date(date).getUTCFullYear();
