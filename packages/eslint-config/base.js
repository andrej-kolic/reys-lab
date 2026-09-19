import js from "@eslint/js";
import ts from "typescript-eslint";

/** Shared flat config. Packages extend this and add their own overrides. */
export default [
  { ignores: ["**/dist/**", "**/.astro/**", "**/.turbo/**", "**/.wrangler/**"] },
  js.configs.recommended,
  ...ts.configs.recommended,
];
