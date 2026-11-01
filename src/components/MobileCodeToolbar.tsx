import React from 'react';
import { ProgrammingLanguage } from '../types';

interface MobileCodeToolbarProps {
  editorRef: React.RefObject<any>;
  language: ProgrammingLanguage;
  fontSize?: number;
  onFontSizeChange?: (size: number) => void;
  wordWrap?: 'on' | 'off';
  onToggleWordWrap?: () => void;
  onFormatCode?: () => void;
  className?: string;
}

export const MobileCodeToolbar: React.FC<MobileCodeToolbarProps> = ({
  editorRef,
  language,
  fontSize,
  onFontSizeChange,
  wordWrap,
  onToggleWordWrap,
  onFormatCode,
  className = '',
}) => {
  const insertText = (text: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    try {
      const selection = editor.getSelection();
      if (selection) {
        editor.executeEdits('mobile-toolbar', [
          {
            range: selection,
            text,
            forceMoveMarkers: true,
          },
        ]);
        editor.focus();
      }
    } catch {
      // fallback
    }
  };

  const insertPair = (open: string, close: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    try {
      const selection = editor.getSelection();
      if (selection) {
        const model = editor.getModel();
        const selectedText = model ? model.getValueInRange(selection) : '';
        const newText = `${open}${selectedText}${close}`;

        editor.executeEdits('mobile-toolbar', [
          {
            range: selection,
            text: newText,
            forceMoveMarkers: true,
          },
        ]);

        if (selection.isEmpty()) {
          const pos = editor.getPosition();
          if (pos) {
            editor.setPosition({
              lineNumber: pos.lineNumber,
              column: pos.column - close.length,
            });
          }
        }
        editor.focus();
      }
    } catch {
      // fallback
    }
  };

  const moveCursor = (direction: 'left' | 'right') => {
    const editor = editorRef.current;
    if (!editor) return;

    try {
      const pos = editor.getPosition();
      if (pos) {
        const newCol = direction === 'left' ? Math.max(1, pos.column - 1) : pos.column + 1;
        editor.setPosition({ lineNumber: pos.lineNumber, column: newCol });
        editor.focus();
      }
    } catch {
      // fallback
    }
  };

  const triggerUndo = () => {
    try {
      editorRef.current?.trigger('mobile-toolbar', 'undo', null);
      editorRef.current?.focus();
    } catch {}
  };

  const triggerRedo = () => {
    try {
      editorRef.current?.trigger('mobile-toolbar', 'redo', null);
      editorRef.current?.focus();
    } catch {}
  };

  const handleTab = () => {
    insertText('    ');
  };

  const isCpp = language === 'cpp20' || language === 'cpp17' || language === 'c';
  const isPython = language === 'python';
  const isJs = language === 'javascript';
  const isJava = language === 'java';

  return (
    <div
      className={`flex items-center overflow-x-auto no-scrollbar py-1 px-2 bg-slate-900 border-t border-b border-slate-800 text-xs shrink-0 select-none gap-1 ${className}`}
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* Undo / Redo */}
      <button
        type="button"
        onClick={triggerUndo}
        className="px-2 py-1 rounded bg-slate-800 active:bg-slate-700 text-slate-300 font-mono text-xs shrink-0 active:scale-95 transition-transform"
        title="Undo"
      >
        ↺
      </button>
      <button
        type="button"
        onClick={triggerRedo}
        className="px-2 py-1 rounded bg-slate-800 active:bg-slate-700 text-slate-300 font-mono text-xs shrink-0 active:scale-95 transition-transform"
        title="Redo"
      >
        ↻
      </button>

      {/* Cursor Left / Right */}
      <button
        type="button"
        onClick={() => moveCursor('left')}
        className="px-2 py-1 rounded bg-slate-800 active:bg-slate-700 text-slate-300 font-mono text-xs shrink-0 active:scale-95 transition-transform"
        title="Move Cursor Left"
      >
        ←
      </button>
      <button
        type="button"
        onClick={() => moveCursor('right')}
        className="px-2 py-1 rounded bg-slate-800 active:bg-slate-700 text-slate-300 font-mono text-xs shrink-0 active:scale-95 transition-transform"
        title="Move Cursor Right"
      >
        →
      </button>

      {/* Tab / Indent */}
      <button
        type="button"
        onClick={handleTab}
        className="px-2.5 py-1 rounded bg-slate-800 active:bg-slate-700 text-indigo-300 font-mono font-semibold text-xs shrink-0 active:scale-95 transition-transform"
        title="Insert Indent / Tab"
      >
        Tab
      </button>

      <div className="w-px h-4 bg-slate-800 shrink-0 mx-0.5" />

      {/* Code pairs */}
      <button
        type="button"
        onClick={() => insertPair('{', '}')}
        className="px-2 py-1 rounded bg-slate-800 active:bg-slate-700 text-emerald-300 font-mono font-semibold text-xs shrink-0 active:scale-95 transition-transform"
      >
        {'{ }'}
      </button>
      <button
        type="button"
        onClick={() => insertPair('(', ')')}
        className="px-2 py-1 rounded bg-slate-800 active:bg-slate-700 text-emerald-300 font-mono font-semibold text-xs shrink-0 active:scale-95 transition-transform"
      >
        ( )
      </button>
      <button
        type="button"
        onClick={() => insertPair('[', ']')}
        className="px-2 py-1 rounded bg-slate-800 active:bg-slate-700 text-emerald-300 font-mono font-semibold text-xs shrink-0 active:scale-95 transition-transform"
      >
        [ ]
      </button>
      <button
        type="button"
        onClick={() => insertPair('"', '"')}
        className="px-2 py-1 rounded bg-slate-800 active:bg-slate-700 text-amber-300 font-mono font-semibold text-xs shrink-0 active:scale-95 transition-transform"
      >
        " "
      </button>
      <button
        type="button"
        onClick={() => insertPair("'", "'")}
        className="px-2 py-1 rounded bg-slate-800 active:bg-slate-700 text-amber-300 font-mono font-semibold text-xs shrink-0 active:scale-95 transition-transform"
      >
        ' '
      </button>

      <div className="w-px h-4 bg-slate-800 shrink-0 mx-0.5" />

      {/* Crucial CP characters */}
      {[';', '=', '<', '>', '!', '&', '|', '+', '-', '*', '/', '%', ':', ','].map((char) => (
        <button
          key={char}
          type="button"
          onClick={() => insertText(char)}
          className="px-2 py-1 rounded bg-slate-800 active:bg-slate-700 text-slate-200 font-mono text-xs shrink-0 active:scale-95 transition-transform"
        >
          {char}
        </button>
      ))}

      <div className="w-px h-4 bg-slate-800 shrink-0 mx-0.5" />

      {/* Language specific quick snippets */}
      {isCpp && (
        <>
          <button
            type="button"
            onClick={() => insertText('cin >> ')}
            className="px-2 py-1 rounded bg-indigo-950/80 border border-indigo-800/60 active:bg-indigo-900 text-indigo-300 font-mono text-xs shrink-0 active:scale-95 transition-transform"
          >
            cin &gt;&gt;
          </button>
          <button
            type="button"
            onClick={() => insertText('cout << ')}
            className="px-2 py-1 rounded bg-indigo-950/80 border border-indigo-800/60 active:bg-indigo-900 text-indigo-300 font-mono text-xs shrink-0 active:scale-95 transition-transform"
          >
            cout &lt;&lt;
          </button>
          <button
            type="button"
            onClick={() => insertText('endl')}
            className="px-2 py-1 rounded bg-slate-800 active:bg-slate-700 text-indigo-200 font-mono text-xs shrink-0"
          >
            endl
          </button>
          <button
            type="button"
            onClick={() => insertText('long long ')}
            className="px-2 py-1 rounded bg-slate-800 active:bg-slate-700 text-sky-300 font-mono text-xs shrink-0"
          >
            ll
          </button>
          <button
            type="button"
            onClick={() => insertText('vector<int> ')}
            className="px-2 py-1 rounded bg-slate-800 active:bg-slate-700 text-sky-300 font-mono text-xs shrink-0"
          >
            vector
          </button>
          <button
            type="button"
            onClick={() => insertText('return 0;\n')}
            className="px-2 py-1 rounded bg-slate-800 active:bg-slate-700 text-rose-300 font-mono text-xs shrink-0"
          >
            return 0;
          </button>
        </>
      )}

      {isPython && (
        <>
          <button
            type="button"
            onClick={() => insertPair('print(', ')')}
            className="px-2 py-1 rounded bg-indigo-950/80 border border-indigo-800/60 active:bg-indigo-900 text-indigo-300 font-mono text-xs shrink-0 active:scale-95 transition-transform"
          >
            print()
          </button>
          <button
            type="button"
            onClick={() => insertText('input()')}
            className="px-2 py-1 rounded bg-indigo-950/80 border border-indigo-800/60 active:bg-indigo-900 text-indigo-300 font-mono text-xs shrink-0 active:scale-95 transition-transform"
          >
            input()
          </button>
          <button
            type="button"
            onClick={() => insertText('map(int, input().split())')}
            className="px-2 py-1 rounded bg-slate-800 active:bg-slate-700 text-sky-300 font-mono text-xs shrink-0"
          >
            map(int)
          </button>
          <button
            type="button"
            onClick={() => insertPair('range(', ')')}
            className="px-2 py-1 rounded bg-slate-800 active:bg-slate-700 text-sky-300 font-mono text-xs shrink-0"
          >
            range()
          </button>
        </>
      )}

      {isJs && (
        <>
          <button
            type="button"
            onClick={() => insertPair('console.log(', ')')}
            className="px-2 py-1 rounded bg-indigo-950/80 border border-indigo-800/60 active:bg-indigo-900 text-indigo-300 font-mono text-xs shrink-0 active:scale-95 transition-transform"
          >
            console.log
          </button>
          <button
            type="button"
            onClick={() => insertText('const ')}
            className="px-2 py-1 rounded bg-slate-800 active:bg-slate-700 text-sky-300 font-mono text-xs shrink-0"
          >
            const
          </button>
          <button
            type="button"
            onClick={() => insertText('let ')}
            className="px-2 py-1 rounded bg-slate-800 active:bg-slate-700 text-sky-300 font-mono text-xs shrink-0"
          >
            let
          </button>
        </>
      )}

      {isJava && (
        <>
          <button
            type="button"
            onClick={() => insertPair('System.out.println(', ');')}
            className="px-2 py-1 rounded bg-indigo-950/80 border border-indigo-800/60 active:bg-indigo-900 text-indigo-300 font-mono text-xs shrink-0 active:scale-95 transition-transform"
          >
            sysout
          </button>
        </>
      )}

      <div className="w-px h-4 bg-slate-800 shrink-0 mx-0.5" />

      {/* Font Size controls */}
      {fontSize && onFontSizeChange && (
        <div className="flex items-center gap-0.5 bg-slate-800/80 rounded px-1 shrink-0">
          <button
            type="button"
            onClick={() => onFontSizeChange(Math.max(11, fontSize - 1))}
            className="px-1.5 py-0.5 text-slate-400 hover:text-white font-mono text-[11px]"
            title="Decrease Editor Font Size"
          >
            A-
          </button>
          <span className="text-[10px] text-slate-400 font-mono">{fontSize}</span>
          <button
            type="button"
            onClick={() => onFontSizeChange(Math.min(20, fontSize + 1))}
            className="px-1.5 py-0.5 text-slate-400 hover:text-white font-mono text-[11px]"
            title="Increase Editor Font Size"
          >
            A+
          </button>
        </div>
      )}

      {/* Word Wrap Toggle */}
      {wordWrap && onToggleWordWrap && (
        <button
          type="button"
          onClick={onToggleWordWrap}
          className={`px-2 py-1 rounded text-[11px] font-mono shrink-0 transition-colors ${
            wordWrap === 'on'
              ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
              : 'bg-slate-800 text-slate-400'
          }`}
          title="Toggle Word Wrap"
        >
          Wrap: {wordWrap === 'on' ? 'ON' : 'OFF'}
        </button>
      )}

      {/* Format Code */}
      {onFormatCode && (
        <button
          type="button"
          onClick={onFormatCode}
          className="px-2 py-1 rounded bg-slate-800 active:bg-slate-700 text-slate-300 font-mono text-[11px] shrink-0"
          title="Format Code"
        >
          Format
        </button>
      )}
    </div>
  );
};
