import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection } from "astro:content";
import { toMarkdown } from "../../lib/agents";

export const getStaticPaths = (async () => {
  const entries = await getCollection("projects", ({ data }) => !data.draft);
  return entries.map((entry) => ({
    params: { slug: entry.id },
    props: { entry },
  }));
}) satisfies GetStaticPaths;

export const GET: APIRoute<{ entry: Parameters<typeof toMarkdown>[0] }> = ({ props }) =>
  new Response(toMarkdown(props.entry), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
