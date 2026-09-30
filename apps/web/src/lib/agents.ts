/**
 * The site as agents read it: `/llms.txt` and a Markdown copy of every post
 * and project. Both are built from the content collections, so a new entry is
 * listed with no extra step.
 *
 * Pages written as `.astro` have no Markdown source and are listed by hand in
 * `pages` below. The `llms-links` check in `astro.config.ts` fails the build
 * when one of them no longer builds, so a renamed page cannot leave a dead
 * link behind.
 */
import { getCollection, type CollectionEntry } from "astro:content";
import { site } from "./site";

/** Hand-written pages worth an agent's time. */
const pages = [
  { href: "/cv", title: "CV", description: "Experience, and how to get in touch." },
];

type Entry = CollectionEntry<"blog"> | CollectionEntry<"projects">;

const mdHref = (entry: Entry) => `/${entry.collection}/${entry.id}.md`;

export async function llmsTxt(origin: URL) {
  const [blog, projects] = await Promise.all([
    getCollection("blog", ({ data }) => !data.draft),
    getCollection("projects", ({ data }) => !data.draft),
  ]);
  blog.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
  projects.sort((a, b) => a.data.order - b.data.order);

  const link = (href: string, title: string, description: string) =>
    `- [${title}](${new URL(href, origin).href}): ${description}`;
  const section = (heading: string, entries: Entry[]) => [
    `## ${heading}`,
    "",
    ...entries.map((entry) => link(mdHref(entry), entry.data.title, entry.data.description)),
    "",
  ];

  return [
    `# ${site.name}`,
    "",
    `> ${site.author}. ${site.positioning}`,
    "",
    ...section("Projects", projects),
    ...section("Blog", blog),
    "## Pages",
    "",
    ...pages.map((page) => link(page.href, page.title, page.description)),
    "",
  ].join("\n");
}

/**
 * The entry's MDX source as plain Markdown: title and description on top, and
 * the MDX-only parts — imports, `{/* *\/}` comments, `<img>` elements whose
 * `src` is a JS expression — reduced to what an agent can read. An image
 * becomes its alt text, which on this site describes the picture in full.
 */
export function toMarkdown(entry: Entry) {
  const body = (entry.body ?? "")
    .replace(/^import .*\n/gm, "")
    .replace(/\{\/\*[\s\S]*?\*\/\}\n?/g, "")
    .replace(/<img\b[\s\S]*?alt="([^"]*)"[\s\S]*?\/>/g, "*[Image: $1]*")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return `# ${entry.data.title}\n\n> ${entry.data.description}\n\n${body}\n`;
}

