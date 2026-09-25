/**
 * Qwen writes math as \[ ... \] and \( ... \), which Markdown turns into literal brackets.
 * remark-math is configured to accept only $$ ... $$ (so "5$" prices never become math),
 * so both forms are rewritten to double-dollar delimiters. Code blocks and inline code are left alone.
 */
export function normalizeMath(markdown: string): string {
  return markdown
    .split(/(```[\s\S]*?```|`[^`\n]*`)/g)
    .map((part, i) => {
      if (i % 2 === 1) return part;
      return part
        .replace(/\\\[([\s\S]+?)\\\]/g, (_, body: string) => `\n$$\n${body.trim()}\n$$\n`)
        .replace(/\\\(([\s\S]+?)\\\)/g, (_, body: string) => `$$${body.trim()}$$`);
    })
    .join("");
}

export function hasMath(markdown: string): boolean {
  return markdown.includes("$$");
}
