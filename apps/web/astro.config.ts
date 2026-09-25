import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { AstroIntegration } from "astro";
import { defineConfig, fontProviders } from "astro/config";

import tailwindcss from "@tailwindcss/vite";
import expressiveCode from "astro-expressive-code";
import mdx from "@astrojs/mdx";
import { getVersion } from "./src/lib/version";

const google = fontProviders.google();

/** Writes dist/version.json — see "Versioning" in the monorepo plan. */
const versionManifest = (): AstroIntegration => ({
  name: "version-manifest",
  hooks: {
    "astro:build:done": ({ dir }) => {
      writeFileSync(
        fileURLToPath(new URL("version.json", dir)),
        `${JSON.stringify(getVersion(), null, 2)}\n`,
      );
    },
  },
});

const sans = ["system-ui", "sans-serif"];
const mono = ["ui-monospace", "monospace"];

// https://astro.build/config
export default defineConfig({
  site: "https://andrejkolic.com",
  output: "static",

  /**
   * Locked 2026-09-19 after the `/lab/type` comparison.
   *
   * Outfit for display and text, IBM Plex Mono for micro-labels and code — the
   * pairing disko.media uses, verified against the live site rather than
   * guessed. Sora and IBM Plex Sans were the losing candidates and are gone.
   *
   * Outfit is variable, so one file covers the whole weight range: 31.5 KB
   * against IBM Plex Sans's 249.5 KB across six static weights.
   *
   * Astro downloads and self-hosts these at build time, so there is no runtime
   * dependency on a font CDN — see the "no vendor lock-in" principle in the
   * monorepo plan.
   */
  fonts: [
    {
      name: "Outfit",
      cssVariable: "--ff-outfit",
      provider: google,
      weights: ["400 800"],
      // latin-ext carries ć, the author's name. unicode-range means a page
      // downloads it only when it uses one of those letters.
      subsets: ["latin", "latin-ext"],
      fallbacks: sans,
    },
    {
      name: "IBM Plex Mono",
      cssVariable: "--ff-plex-mono",
      provider: google,
      // 400 code, 500 micro-labels, 600 bold tokens in code blocks.
      weights: [400, 500, 600],
      subsets: ["latin", "latin-ext"],
      fallbacks: mono,
    },
  ],

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [
    // Expressive Code must come before MDX — it registers the code-block
    // renderer that MDX then uses for fenced blocks.
    expressiveCode({
      themes: ["houston"],
      // Dark-only for now, so a single theme is enough.
      useDarkModeMediaQuery: false,
      styleOverrides: {
        borderRadius: "0.75rem",
        borderColor: "var(--lab-border)",
        codeBackground: "var(--lab-code-bg)",
        codeFontFamily: "var(--ff-mono)",
        uiFontFamily: "var(--ff-mono)",
        frames: {
          shadowColor: "transparent",
          editorTabBarBackground: "var(--lab-surface)",
          editorActiveTabBackground: "var(--lab-code-bg)",
          // No accent line over the one tab (#21): cyan marks what can be
          // clicked, and a code block's single tab cannot be.
          editorActiveTabIndicatorTopColor: "transparent",
          terminalTitlebarBackground: "var(--lab-surface)",
          terminalBackground: "var(--lab-code-bg)",
        },
      },
    }),
    mdx(),
    versionManifest(),
  ],
});
