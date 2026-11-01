import React, { useState } from 'react';
import {
  CompilerIcon as Cpu,
  TerminalIcon as Terminal,
  CodeFileIcon as FileCode,
  RetryIcon as RotateCcw,
} from '../icons';
import { CompetitiveProgrammingPreferences } from '../../types/settings';
import { ProgrammingLanguage } from '../../types';
import { useTranslation } from '../../utils/i18n';
import {
  DEFAULT_CPP20_TEMPLATE,
  DEFAULT_CPP17_TEMPLATE,
  DEFAULT_PYTHON_TEMPLATE,
} from '../../utils/settingsDefaults';

interface CompetitiveProgrammingSettingsSectionProps {
  cp: CompetitiveProgrammingPreferences;
  onChange: (updated: CompetitiveProgrammingPreferences) => void;
}

export const CompetitiveProgrammingSettingsSection: React.FC<CompetitiveProgrammingSettingsSectionProps> = ({
  cp,
  onChange,
}) => {
  const { t } = useTranslation();
  const [activeTemplateLang, setActiveTemplateLang] = useState<ProgrammingLanguage>('cpp20');

  const handleResetTemplate = (lang: ProgrammingLanguage) => {
    let def = DEFAULT_CPP20_TEMPLATE;
    if (lang === 'cpp17') def = DEFAULT_CPP17_TEMPLATE;
    if (lang === 'python') def = DEFAULT_PYTHON_TEMPLATE;

    onChange({
      ...cp,
      codeTemplates: {
        ...cp.codeTemplates,
        [lang]: def,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Training Parameters & Difficulty Range */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <span>Problem Discovery & Rating Tuning</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Configure default filters and rating ranges applied in the Problem Explorer and Mission Control.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Min Rating */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">Minimum Rating</label>
            <input
              type="number"
              min={800}
              max={3500}
              step={100}
              value={cp.defaultDifficultyMin}
              onChange={(e) => onChange({ ...cp, defaultDifficultyMin: Number(e.target.value) })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          {/* Max Rating */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">Maximum Rating</label>
            <input
              type="number"
              min={800}
              max={3500}
              step={100}
              value={cp.defaultDifficultyMax}
              onChange={(e) => onChange({ ...cp, defaultDifficultyMax: Number(e.target.value) })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          {/* Training Intensity */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">{t('cp.intensity')}</label>
            <select
              value={cp.trainingIntensity}
              onChange={(e) => onChange({ ...cp, trainingIntensity: e.target.value as any })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="casual">{t('cp.intensity_casual')}</option>
              <option value="standard">{t('cp.intensity_standard')}</option>
              <option value="intensive">{t('cp.intensity_intensive')}</option>
            </select>
          </div>

          {/* Recommendation Behavior */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">Recommendation Engine</label>
            <select
              value={cp.recommendationBehavior}
              onChange={(e) => onChange({ ...cp, recommendationBehavior: e.target.value as any })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="adaptive">Adaptive (Weakness-targeted)</option>
              <option value="stretch">Stretch (+100 difficulty challenge)</option>
              <option value="review_first">Spaced Repetition First</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
          {/* Default Sort */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">Default Problem Sorting</label>
            <select
              value={cp.defaultSort}
              onChange={(e) => onChange({ ...cp, defaultSort: e.target.value as any })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="rating_asc">Difficulty: Low to High (800 → 1600)</option>
              <option value="rating_desc">Difficulty: High to Low (1600 → 800)</option>
              <option value="contest_id">Contest ID (Newest contests first)</option>
              <option value="popularity">Most Solved by Global Community</option>
            </select>
          </div>

          {/* Default Filter */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">Default Filter State</label>
            <select
              value={cp.defaultFilter}
              onChange={(e) => onChange({ ...cp, defaultFilter: e.target.value as any })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="unsolved_only">Hide Already Solved Problems</option>
              <option value="all">Show All Problems (Including Solved)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Monaco Editor Preferences */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>Monaco Workspace Code Editor</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Personalize typography, tab size, line wrap, and editor themes for the in-browser competitive programming IDE.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {/* Editor Theme */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">{t('cp.editor_theme')}</label>
            <select
              value={cp.editorTheme}
              onChange={(e) => onChange({ ...cp, editorTheme: e.target.value as any })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="vs-dark">VS Code Dark</option>
              <option value="light">VS Code Light</option>
              <option value="hc-black">High Contrast Black</option>
            </select>
          </div>

          {/* Font Family */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">{t('cp.editor_font_family')}</label>
            <select
              value={cp.codeFontFamily}
              onChange={(e) => onChange({ ...cp, codeFontFamily: e.target.value as any })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 cursor-pointer font-mono"
            >
              <option value="JetBrains Mono">JetBrains Mono</option>
              <option value="Fira Code">Fira Code</option>
              <option value="Menlo">Menlo / Monaco</option>
              <option value="Consolas">Consolas</option>
              <option value="Source Code Pro">Source Code Pro</option>
            </select>
          </div>

          {/* Tab Size */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">{t('cp.editor_tab_size')}</label>
            <select
              value={cp.editorTabSize}
              onChange={(e) => onChange({ ...cp, editorTabSize: Number(e.target.value) as any })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value={2}>2 Spaces</option>
              <option value={4}>4 Spaces (Standard CP)</option>
              <option value={8}>8 Spaces</option>
            </select>
          </div>
        </div>

        {/* Font Size Slider */}
        <div className="space-y-1.5 text-xs pt-2">
          <div className="flex items-center justify-between">
            <label className="font-bold text-slate-700 dark:text-slate-300">{t('cp.editor_font_size')}</label>
            <span className="font-mono font-bold text-cyan-400">{cp.editorFontSize}px</span>
          </div>
          <input
            type="range"
            min={11}
            max={22}
            step={1}
            value={cp.editorFontSize}
            onChange={(e) => onChange({ ...cp, editorFontSize: Number(e.target.value) })}
            className="w-full accent-cyan-500 cursor-pointer"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Line Numbers */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/70">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white text-xs">{t('cp.editor_line_numbers')}</p>
              <p className="text-[11px] text-slate-400">Display margin line indices</p>
            </div>
            <button
              type="button"
              onClick={() => onChange({ ...cp, lineNumbers: !cp.lineNumbers })}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                cp.lineNumbers ? 'bg-cyan-600' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  cp.lineNumbers ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Word Wrap */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/70">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white text-xs">{t('cp.editor_word_wrap')}</p>
              <p className="text-[11px] text-slate-400">Soft-wrap long lines</p>
            </div>
            <button
              type="button"
              onClick={() => onChange({ ...cp, wordWrap: !cp.wordWrap })}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                cp.wordWrap ? 'bg-cyan-600' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  cp.wordWrap ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Starter Code Templates */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-400" />
              <span>{t('cp.template')}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Custom boilerplates auto-populated whenever you open a new problem in the Workspace.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleResetTemplate(activeTemplateLang)}
            className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white px-2.5 py-1 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Boilerplate</span>
          </button>
        </div>

        {/* Language Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          {(['cpp20', 'cpp17', 'python'] as ProgrammingLanguage[]).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setActiveTemplateLang(lang)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTemplateLang === lang
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-700/60 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {lang === 'cpp20' ? 'C++20' : lang === 'cpp17' ? 'C++17' : 'Python 3'}
            </button>
          ))}
        </div>

        {/* Template Code Area */}
        <textarea
          rows={10}
          value={cp.codeTemplates[activeTemplateLang] || ''}
          onChange={(e) =>
            onChange({
              ...cp,
              codeTemplates: {
                ...cp.codeTemplates,
                [activeTemplateLang]: e.target.value,
              },
            })
          }
          className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-emerald-500 leading-relaxed"
          spellCheck={false}
        />
      </div>
    </div>
  );
};
