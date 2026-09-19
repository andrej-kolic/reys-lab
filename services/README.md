# services/

Independently deployable backends. Empty for now, and that is deliberate.

`apps/web` is a **static** site with no Astro adapter, which is what keeps it portable to
any host. The moment something needs a server — a contact form endpoint, an API, a
scheduled job — it belongs here as its own package with its own deploy target, **not** as
a server-rendering mode of the website.

Folding a single dynamic endpoint into the site would force an adapter, and an adapter
compiles the whole site into one vendor's runtime. That is the lock-in this repo exists to
avoid.
