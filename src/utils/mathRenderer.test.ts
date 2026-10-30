import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parseMathText, renderLatexToHtml } from './mathRenderer';

describe('LaTeX & Math Rendering Engine', () => {
  it('renders standard inline LaTeX equations via KaTeX', () => {
    const html = renderLatexToHtml('N \\le 10^5');
    assert.ok(html.includes('katex'));
    assert.ok(html.includes('10'));
  });

  it('parses Question 1 from baseline diagnostic check', () => {
    const q1 = 'A problem has $N \\le 10^5$ and a 1.0 second limit. Which time complexity will safely pass?';
    const tokens = parseMathText(q1);

    const mathTokens = tokens.filter(t => t.type === 'math-inline');
    assert.strictEqual(mathTokens.length, 1);
    assert.strictEqual(mathTokens[0].content, 'N \\le 10^5');
    assert.ok(mathTokens[0].html?.includes('katex'));
  });

  it('parses Option A ($O(N^2)$) and Option B ($O(N)$ or $O(N \\log N)$)', () => {
    const optA = 'A. $O(N^2)$';
    const tokensA = parseMathText(optA);
    assert.ok(tokensA.some(t => t.type === 'math-inline' && t.content === 'O(N^2)'));

    const optB = 'B. $O(N)$ or $O(N \\log N)$';
    const tokensB = parseMathText(optB);
    const mathB = tokensB.filter(t => t.type === 'math-inline');
    assert.strictEqual(mathB.length, 2);
    assert.strictEqual(mathB[0].content, 'O(N)');
    assert.strictEqual(mathB[1].content, 'O(N \\log N)');
  });

  it('parses Question 2 integer limits ($10^6$ and $\\approx 2 \\times 10^9$)', () => {
    const optA = 'A. $10^6$';
    const tokensA = parseMathText(optA);
    assert.ok(tokensA.some(t => t.type === 'math-inline' && t.content === '10^6'));

    const optB = 'B. $\\approx 2 \\times 10^9$';
    const tokensB = parseMathText(optB);
    assert.ok(tokensB.some(t => t.type === 'math-inline' && t.content === '\\approx 2 \\times 10^9'));
  });

  it('parses Question 3 prefix sums ($O(1)$ time)', () => {
    const optA = 'A. Range sum queries in $O(1)$ time';
    const tokens = parseMathText(optA);
    const mathTokens = tokens.filter(t => t.type === 'math-inline');
    assert.strictEqual(mathTokens.length, 1);
    assert.strictEqual(mathTokens[0].content, 'O(1)');
    assert.ok(mathTokens[0].html?.includes('katex'));
  });

  it('handles Codeforces $$$...$$$ delimiters', () => {
    const text = 'Given $$$1 \\le n \\le 10^5$$$, find optimal answer.';
    const tokens = parseMathText(text);
    const mathTokens = tokens.filter(t => t.type === 'math-inline');
    assert.strictEqual(mathTokens.length, 1);
    assert.strictEqual(mathTokens[0].content, '1 \\le n \\le 10^5');
  });

  it('handles block display math ($$...$$ and \\[...\\])', () => {
    const text = 'Formula:\n$$\\sum_{i=1}^n i = \\frac{n(n+1)}{2}$$\nDone.';
    const tokens = parseMathText(text);
    const blockTokens = tokens.filter(t => t.type === 'math-block');
    assert.strictEqual(blockTokens.length, 1);
    assert.ok(blockTokens[0].html?.includes('katex-display'));
  });

  it('preserves code blocks and inline code without treating code as math', () => {
    const text = 'Use `int count = 0;` and for complexity $O(N)$: ```cpp\nint main() { return 0; }\n```';
    const tokens = parseMathText(text);
    assert.ok(tokens.some(t => t.type === 'code-inline' && t.content === 'int count = 0;'));
    assert.ok(tokens.some(t => t.type === 'code-block'));
    assert.ok(tokens.some(t => t.type === 'math-inline' && t.content === 'O(N)'));
  });

  it('auto-detects unbracketed complexity and power expressions when autoDetect is enabled', () => {
    const text = 'An algorithm with O(N^2) complexity will exceed limit for 10^5 items.';
    const tokens = parseMathText(text, { autoDetect: true });
    const mathTokens = tokens.filter(t => t.type === 'math-inline');
    assert.ok(mathTokens.some(t => t.content === 'O(N^2)'));
    assert.ok(mathTokens.some(t => t.content === '10^5'));
  });
});
