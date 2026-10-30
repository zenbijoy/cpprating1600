import React, { useMemo } from 'react';
import { parseMathText, renderLatexToHtml, MathParseOptions } from '../../utils/mathRenderer';

export interface MathTextProps extends MathParseOptions {
  /** The text string containing LaTeX or mathematical notation */
  text?: string;
  /** Children can be passed as a string */
  children?: React.ReactNode;
  /** Custom CSS classes */
  className?: string;
  /** Render as an inline element (span) vs block (div). Defaults to inline (true) */
  inline?: boolean;
}

/**
 * Universal component that detects and renders LaTeX equations and CP mathematical notations.
 * Supports:
 *  - Inline math: $...$, \(...\), $$$...$$$
 *  - Display math: $$...$$, \[...\]
 *  - Auto-detected notation: O(N^2), O(N log N), 10^5, 10^9, N <= 10^5
 *  - Inline code preservation (`...`)
 */
export const MathText: React.FC<MathTextProps> = ({
  text,
  children,
  className = '',
  inline = true,
  autoDetect = true,
}) => {
  const rawContent = typeof text === 'string' ? text : typeof children === 'string' ? children : '';

  const tokens = useMemo(() => {
    if (!rawContent) return [];
    return parseMathText(rawContent, { autoDetect });
  }, [rawContent, autoDetect]);

  if (!rawContent && children) {
    return <>{children}</>;
  }

  const renderedTokens = tokens.map((token, idx) => {
    switch (token.type) {
      case 'math-inline':
        return (
          <span
            key={`math-in-${idx}`}
            className="katex-inline inline-flex items-center align-baseline select-text"
            dangerouslySetInnerHTML={{ __html: token.html || '' }}
          />
        );
      case 'math-block':
        return (
          <div
            key={`math-blk-${idx}`}
            className="katex-block my-2 overflow-x-auto py-1 text-center"
            dangerouslySetInnerHTML={{ __html: token.html || '' }}
          />
        );
      case 'code-inline':
        return (
          <code
            key={`code-in-${idx}`}
            className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-mono text-[11px]"
          >
            {token.content}
          </code>
        );
      case 'code-block':
        return (
          <pre
            key={`code-blk-${idx}`}
            className="p-3 my-2 rounded-xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto border border-slate-800"
          >
            <code>{token.content}</code>
          </pre>
        );
      case 'text':
      default:
        return <React.Fragment key={`txt-${idx}`}>{token.content}</React.Fragment>;
    }
  });

  const Wrapper = inline ? 'span' : 'div';
  return <Wrapper className={`math-text-wrapper ${className}`}>{renderedTokens}</Wrapper>;
};

/**
 * Direct LaTeX renderer for standalone formulas.
 */
export const Latex: React.FC<{
  math: string;
  displayMode?: boolean;
  className?: string;
}> = ({ math, displayMode = false, className = '' }) => {
  const html = useMemo(() => renderLatexToHtml(math, displayMode), [math, displayMode]);

  if (displayMode) {
    return (
      <div
        className={`katex-display my-2 overflow-x-auto text-center ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <span
      className={`katex-inline inline-flex items-center align-baseline ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default MathText;
