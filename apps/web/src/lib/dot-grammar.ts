/**
 * A TextMate grammar for Graphviz `dot`, which Shiki does not ship.
 *
 * Covers what a post shows: keywords, quoted and bare names, edge arrows,
 * `[name=value]` attributes, numbers and comments. Registered in
 * astro.config.ts through Expressive Code's `shiki.langs`.
 */
import type { PluginShikiOptions } from "astro-expressive-code";

type Language = NonNullable<PluginShikiOptions["langs"]>[number];

export const dotGrammar: Language = {
  name: "dot",
  scopeName: "source.dot",
  aliases: ["graphviz", "gv"],
  patterns: [
    { include: "#comment" },
    { include: "#string" },
    {
      name: "keyword.control.dot",
      match: "\\b(?i:strict|digraph|graph|subgraph|node|edge)\\b",
    },
    { name: "keyword.operator.edge.dot", match: "--|->" },
    {
      match: "\\b([A-Za-z_][A-Za-z0-9_]*)\\s*(=)",
      captures: {
        1: { name: "entity.other.attribute-name.dot" },
        2: { name: "keyword.operator.assignment.dot" },
      },
    },
    { name: "constant.numeric.dot", match: "-?(?:\\.\\d+|\\d+(?:\\.\\d*)?)" },
    { name: "variable.other.dot", match: "\\b[A-Za-z_][A-Za-z0-9_]*\\b" },
    { name: "punctuation.separator.dot", match: "[;,]" },
  ],
  repository: {
    comment: {
      patterns: [
        { name: "comment.line.double-slash.dot", match: "//.*$" },
        { name: "comment.line.number-sign.dot", match: "^\\s*#.*$" },
        { name: "comment.block.dot", begin: "/\\*", end: "\\*/" },
      ],
    },
    string: {
      name: "string.quoted.double.dot",
      begin: '"',
      end: '"',
      patterns: [{ name: "constant.character.escape.dot", match: '\\\\.' }],
    },
  },
};
