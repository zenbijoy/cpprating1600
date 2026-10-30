import React, { useState } from 'react';
import { CopyIcon as Copy, CheckIcon as Check } from '../icons';
import { MathText, Latex } from '../common/MathText';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  // Parse lines for lightweight, safe, fast rendering without heavy external parsers
  const lines = content.split('\n');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const renderBlocks = () => {
    const blocks: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeBuffer: string[] = [];
    let codeLang = '';
    let inMathBlock = false;
    let mathBuffer: string[] = [];
    let blockIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Code block start/end
      if (line.trim().startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeLang = line.trim().slice(3).trim();
          codeBuffer = [];
        } else {
          inCodeBlock = false;
          const currentIdx = blockIndex++;
          const fullCode = codeBuffer.join('\n');
          blocks.push(
            <div key={`code-${currentIdx}`} className="my-3 rounded-xl overflow-hidden border border-slate-700/60 bg-slate-950 shadow-inner">
              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400 font-mono">
                <span>{codeLang || 'code'}</span>
                <button
                  type="button"
                  onClick={() => handleCopyCode(fullCode, currentIdx)}
                  className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {copiedIndex === currentIdx ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3.5 overflow-x-auto text-xs font-mono text-emerald-300 leading-relaxed">
                <code>{fullCode}</code>
              </pre>
            </div>
          );
        }
        continue;
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        continue;
      }

      // Display Math block $$...$$
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('$$')) {
        if (!inMathBlock) {
          if (trimmedLine.endsWith('$$') && trimmedLine.length > 2) {
            // Single-line block math
            const math = trimmedLine.slice(2, -2).trim();
            blocks.push(
              <div key={`mathblk-${i}`} className="my-3 overflow-x-auto text-center py-1">
                <Latex math={math} displayMode />
              </div>
            );
            continue;
          }
          inMathBlock = true;
          mathBuffer = [trimmedLine.slice(2)];
        } else {
          inMathBlock = false;
          const fullMath = mathBuffer.join('\n');
          blocks.push(
            <div key={`mathblk-${blockIndex++}`} className="my-3 overflow-x-auto text-center py-1">
              <Latex math={fullMath} displayMode />
            </div>
          );
        }
        continue;
      }

      if (inMathBlock) {
        if (trimmedLine.endsWith('$$')) {
          inMathBlock = false;
          mathBuffer.push(trimmedLine.slice(0, -2));
          const fullMath = mathBuffer.join('\n');
          blocks.push(
            <div key={`mathblk-${blockIndex++}`} className="my-3 overflow-x-auto text-center py-1">
              <Latex math={fullMath} displayMode />
            </div>
          );
        } else {
          mathBuffer.push(line);
        }
        continue;
      }

      // Headings
      if (line.startsWith('# ')) {
        blocks.push(
          <h1 key={`h1-${i}`} className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-4 mb-2">
            {renderInline(line.slice(2))}
          </h1>
        );
      } else if (line.startsWith('## ')) {
        blocks.push(
          <h2 key={`h2-${i}`} className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-3 mb-1.5">
            {renderInline(line.slice(3))}
          </h2>
        );
      } else if (line.startsWith('### ')) {
        blocks.push(
          <h3 key={`h3-${i}`} className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-2 mb-1">
            {renderInline(line.slice(4))}
          </h3>
        );
      } else if (line.startsWith('> ')) {
        // Blockquote
        blocks.push(
          <blockquote key={`quote-${i}`} className="border-l-4 border-indigo-500 pl-3 my-2 text-xs italic text-slate-600 dark:text-slate-400">
            {renderInline(line.slice(2))}
          </blockquote>
        );
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        // Bullet
        blocks.push(
          <li key={`li-${i}`} className="ml-4 list-disc text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            {renderInline(line.slice(2))}
          </li>
        );
      } else if (line.trim() === '') {
        blocks.push(<div key={`sp-${i}`} className="h-2" />);
      } else {
        // Standard paragraph
        blocks.push(
          <p key={`p-${i}`} className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed my-1">
            {renderInline(line)}
          </p>
        );
      }
    }

    return blocks;
  };

  const renderInline = (text: string) => {
    // Handle inline backticks `code` and bold **bold**
    const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={idx} className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-mono text-[11px]">
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={idx} className="font-semibold text-slate-900 dark:text-slate-100">
            <MathText text={part.slice(2, -2)} inline />
          </strong>
        );
      }
      return <MathText key={idx} text={part} inline />;
    });
  };

  return <div className={`prose-sm ${className}`}>{renderBlocks()}</div>;
};
