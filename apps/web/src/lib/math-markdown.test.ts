import { describe, expect, it } from "vitest";
import { normalizeMath } from "./math-markdown";

describe("normalizeMath", () => {
  it("turns display math into a $$ block", () => {
    expect(normalizeMath("Formula: \\[ 2340 \\times 0.175 \\] fine")).toBe("Formula: \n$$\n2340 \\times 0.175\n$$\n fine");
  });

  it("turns inline math into $$...$$", () => {
    expect(normalizeMath("vale \\(x^2\\) qui")).toBe("vale $$x^2$$ qui");
  });

  it("handles multi-line display math", () => {
    expect(normalizeMath("\\[\n\\frac{17.5}{100}\n\\]")).toBe("\n$$\n\\frac{17.5}{100}\n$$\n");
  });

  it("leaves code blocks and inline code untouched", () => {
    const md = "```python\nprint('\\[x\\]')\n```\nand `\\(y\\)`";
    expect(normalizeMath(md)).toBe(md);
  });

  it("leaves plain text, prices and markdown links alone", () => {
    const md = "Costa 5$ oppure 10$. Vedi [la guida](https://example.com).";
    expect(normalizeMath(md)).toBe(md);
  });
});
