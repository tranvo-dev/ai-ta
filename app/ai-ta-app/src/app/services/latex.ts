/**
 * Gemini emits LaTeX with the standard `\(...\)` / `\[...\]` delimiters, but
 * marked-katex-extension only recognises `$...$` / `$$...$$`. Rewrite the
 * delimiters so the math actually reaches KaTeX, leaving code spans and fenced
 * blocks untouched — a `\[` inside a code sample is not math.
 */
export function normalizeLatexDelimiters(markdown: string): string {
  if (!markdown) return markdown;

  // Split on fenced blocks and inline code spans; odd indices are code.
  const parts = markdown.split(/(```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]*`)/);

  return parts
    .map((part, i) => (i % 2 === 1 ? part : rewrite(part)))
    .join('');
}

function rewrite(text: string): string {
  return text
    // Display math first: `\[ ... \]` -> a `$$` block. The surrounding blank
    // lines matter: a single newline does not end a markdown paragraph, so a
    // `\[` that follows text on the same line would stay inline and never be
    // recognised as display math.
    .replace(/\\\[([\s\S]+?)\\\]/g, (_, body: string) => `\n\n$$\n${body.trim()}\n$$\n\n`)
    // Inline math: `\( ... \)` -> `$ ... $`
    .replace(/\\\(([\s\S]+?)\\\)/g, (_, body: string) => `$${body.trim()}$`);
}
