## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

After a content schema change or a branch switch, start it with `--force`: the dev server
otherwise reloads its saved copy of the content and pages can crash on missing fields.

## For agents reading the site

`/llms.txt` and a `.md` copy of every post and project (`/blog/<slug>.md`,
`/projects/<slug>.md`) are generated at build time by `src/lib/agents.ts`. Never edit
them by hand. A new post or project appears in both on its own; its `title` and
`description` are its line in `/llms.txt`.

Pages written as `.astro`, like `/cv`, have no Markdown source. They are in `/llms.txt`
only if listed in `pages` in `src/lib/agents.ts`. The build fails if a link there has no
page in `dist/`, so a rename or delete must update that list.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
