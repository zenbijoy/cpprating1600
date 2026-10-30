import katex from 'katex';

export interface MathToken {
  type: 'text' | 'math-inline' | 'math-block' | 'code-inline' | 'code-block';
  content: string;
  html?: string;
  lang?: string;
}

export interface MathParseOptions {
  /**
   * If true, detects common competitive programming mathematical expressions
   * (e.g. O(N^2), 10^5, N <= 10^5, \approx 2 \times 10^9) even when not enclosed in $ delimiters.
   * Default: true.
   */
  autoDetect?: boolean;
}

/**
 * Safely renders a LaTeX expression to HTML using KaTeX.
 * Never throws — falls back to raw text with safe escaping on invalid syntax.
 */
export function renderLatexToHtml(latex: string, displayMode: boolean = false): string {
  const trimmed = latex.trim();
  if (!trimmed) return '';

  try {
    return katex.renderToString(trimmed, {
      displayMode,
      throwOnError: false,
      errorColor: '#f43f5e',
      strict: false,
    });
  } catch {
    return `<span class="katex-error font-mono text-rose-400">${escapeHtml(trimmed)}</span>`;
  }
}

/**
 * HTML escaper utility
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Auto-detects mathematical patterns in plain text slices outside of code/math delimiters.
 */
function autoDetectInPlainText(slice: string): MathToken[] {
  // Regex to detect:
  // 1. Unwrapped LaTeX with backslashes (e.g., \approx 2 \times 10^9)
  // 2. Big-O notation: e.g. O(N^2), O(N log N), O(1), O(N!), O(2^N), O(log N), O(V + E)
  // 3. Exponents / powers: e.g. 10^5, 10^6, 10^8, 10^9, 10^18, 2^N
  // 4. Inequality bounds: e.g. 1 <= n <= 10^5, N <= 10^5, 2 <= nums.length <= 10^4
  const pattern = /(\\(?:approx|times|le|ge|cdot|sum|sqrt|neq|pm|alpha)[^,\n]+?|O\([A-Za-z0-9^\s\+\-\*\/\\]+\)|\b(?:10|2)\^(?:[0-9a-zA-Z]+|\{[^}]+\})|\b[a-zA-Z0-9_.]+\s*(?:<=|>=|<|>)\s*[a-zA-Z0-9_.]+(?:\^[0-9a-zA-Z]+)?(?:\s*(?:<=|>=|<|>)\s*[a-zA-Z0-9_.]+(?:\^[0-9a-zA-Z]+)?)?)/g;

  const tokens: MathToken[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(slice)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({
        type: 'text',
        content: slice.slice(lastIndex, match.index),
      });
    }

    const rawMatch = match[0].trim();
    // Clean and convert to LaTeX format if needed
    let latexExpr = rawMatch
      .replace(/<=/g, ' \\le ')
      .replace(/>=/g, ' \\ge ')
      .replace(/\s+/g, ' ');

    // Normalize log in O(N log N) -> O(N \log N)
    if (latexExpr.startsWith('O(') && !latexExpr.includes('\\log')) {
      latexExpr = latexExpr.replace(/\blog\b/g, '\\log ');
    }

    tokens.push({
      type: 'math-inline',
      content: rawMatch,
      html: renderLatexToHtml(latexExpr, false),
    });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < slice.length) {
    tokens.push({
      type: 'text',
      content: slice.slice(lastIndex),
    });
  }

  return tokens;
}

/**
 * Parses mixed text content into structured tokens (text, math-inline, math-block, code).
 */
export function parseMathText(text: string, options: MathParseOptions = {}): MathToken[] {
  const { autoDetect = true } = options;
  if (!text) return [];

  // Combined master tokenizer regex:
  // Group 1, 2: Code blocks (```lang\n...```)
  // Group 3: Inline code (`...`)
  // Group 4: Codeforces math ($$$...$$$)
  // Group 5: Display math block ($$...$$)
  // Group 6: Display math block (\[...\])
  // Group 7: Inline math ($...$)
  // Group 8: Inline math (\(...\))
  const tokenRegex = /(?:```([a-zA-Z0-9_-]*)\n([\s\S]*?)```|`([^`]+)`|\$\$\$([\s\S]+?)\$\$\$|\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|(?<!\\)\$((?:\\\$|[^$\n])+?)\$|\\\(([\s\S]+?)\\\))/g;

  const tokens: MathToken[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    // Plain text before this match
    if (match.index > lastIndex) {
      const textSlice = text.slice(lastIndex, match.index);
      if (autoDetect) {
        tokens.push(...autoDetectInPlainText(textSlice));
      } else {
        tokens.push({ type: 'text', content: textSlice });
      }
    }

    if (match[2] !== undefined) {
      // Code block
      tokens.push({
        type: 'code-block',
        lang: match[1] || 'text',
        content: match[2],
      });
    } else if (match[3] !== undefined) {
      // Inline code
      tokens.push({
        type: 'code-inline',
        content: match[3],
      });
    } else if (match[4] !== undefined) {
      // Codeforces math ($$$...$$$)
      const content = match[4].trim();
      tokens.push({
        type: 'math-inline',
        content,
        html: renderLatexToHtml(content, false),
      });
    } else if (match[5] !== undefined || match[6] !== undefined) {
      // Display math ($$...$$ or \[...\])
      const content = (match[5] || match[6]).trim();
      tokens.push({
        type: 'math-block',
        content,
        html: renderLatexToHtml(content, true),
      });
    } else if (match[7] !== undefined || match[8] !== undefined) {
      // Inline math ($...$ or \(...\))
      const content = (match[7] || match[8]).trim();
      tokens.push({
        type: 'math-inline',
        content,
        html: renderLatexToHtml(content, false),
      });
    }

    lastIndex = match.index + match[0].length;
  }

  // Trailing plain text
  if (lastIndex < text.length) {
    const textSlice = text.slice(lastIndex);
    if (autoDetect) {
      tokens.push(...autoDetectInPlainText(textSlice));
    } else {
      tokens.push({ type: 'text', content: textSlice });
    }
  }

  return tokens;
}
