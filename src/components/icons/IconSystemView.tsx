import React, { useState, useMemo } from 'react';
import { ICON_CATALOG } from './iconCatalog';
import { IconSize, IconVariant, IconSemantic, IconCategory, IconMeta } from './types';
import { SearchIcon, CheckIcon, CopyIcon, RefreshIcon } from './generalActionIcons';

export const IconSystemView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<IconCategory | 'ALL'>('ALL');
  const [selectedSize, setSelectedSize] = useState<IconSize>(24);
  const [selectedVariant, setSelectedVariant] = useState<IconVariant>('default');
  const [selectedSemantic, setSelectedSemantic] = useState<IconSemantic>('inherit');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLightModePreview, setIsLightModePreview] = useState(false);

  const categories: { id: IconCategory | 'ALL'; label: string; count: number }[] = useMemo(() => {
    return [
      { id: 'ALL', label: 'All Icons', count: ICON_CATALOG.length },
      { id: 'A', label: 'A. Navigation', count: ICON_CATALOG.filter((i) => i.category === 'A').length },
      { id: 'B', label: 'B. General Actions', count: ICON_CATALOG.filter((i) => i.category === 'B').length },
      { id: 'C', label: 'C. Competitive Programming', count: ICON_CATALOG.filter((i) => i.category === 'C').length },
      { id: 'D', label: 'D. AI Assistant', count: ICON_CATALOG.filter((i) => i.category === 'D').length },
      { id: 'E', label: 'E. Dashboard Analytics', count: ICON_CATALOG.filter((i) => i.category === 'E').length },
      { id: 'F', label: 'F. Account & Settings', count: ICON_CATALOG.filter((i) => i.category === 'F').length },
      { id: 'G', label: 'G. Notifications & Status', count: ICON_CATALOG.filter((i) => i.category === 'G').length },
      { id: 'H', label: 'H. Interface Controls', count: ICON_CATALOG.filter((i) => i.category === 'H').length },
    ];
  }, []);

  const filteredIcons = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return ICON_CATALOG.filter((icon) => {
      const matchCat = selectedCategory === 'ALL' || icon.category === selectedCategory;
      if (!matchCat) return false;
      if (!q) return true;
      return (
        icon.name.toLowerCase().includes(q) ||
        icon.keywords.some((k) => k.toLowerCase().includes(q)) ||
        icon.recommendedPlaces.some((p) => p.toLowerCase().includes(q)) ||
        icon.categoryName.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, selectedCategory]);

  const handleCopy = (icon: IconMeta) => {
    const componentName = icon.component.name || icon.id;
    const sizeProp = selectedSize !== 24 ? ` size={${selectedSize}}` : '';
    const variantProp = selectedVariant !== 'default' ? ` variant="${selectedVariant}"` : '';
    const semanticProp = selectedSemantic !== 'inherit' ? ` semantic="${selectedSemantic}"` : '';
    const snippet = `<${componentName}${sizeProp}${variantProp}${semanticProp} />`;

    navigator.clipboard.writeText(snippet);
    setCopiedId(icon.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className={`min-h-screen py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200 ${isLightModePreview ? 'bg-[#F8FAFC] text-[#0F172A]' : 'bg-slate-950 text-slate-100'}`}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Board matching CLIMB 1600 Icon System reference */}
        <div className={`p-6 sm:p-8 rounded-2xl border transition-all ${isLightModePreview ? 'bg-white border-[#E2E8F0] shadow-sm' : 'bg-slate-900/80 border-slate-800 shadow-xl'}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-3">
                <span className="font-black text-2xl tracking-tight text-[#2563EB]">CLIMB 1600</span>
                <span className="text-xl font-bold text-slate-400">/</span>
                <span className="text-xl font-bold">Icon System</span>
              </div>
              <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mt-1">
                Build • Practice • Achieve
              </p>
            </div>

            {/* Design Tokens Color Chips */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-800/60">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]"></span>
                Primary #2563EB
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-400 dark:border-indigo-800/60">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4F46E5]"></span>
                Indigo #4F46E5
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/60">
                <span className="w-2.5 h-2.5 rounded-full bg-[#059669]"></span>
                Success #059669
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800/60">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]"></span>
                Warning #D97706
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800/60">
                <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]"></span>
                Error #DC2626
              </span>
            </div>

            {/* Spec Badge */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsLightModePreview(!isLightModePreview)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  isLightModePreview
                    ? 'bg-slate-100 border-slate-300 text-slate-800'
                    : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                }`}
              >
                {isLightModePreview ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              </button>
              <div className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/10 border border-blue-500/30 text-blue-400">
                24 × 24 • 2px stroke • Rounded
              </div>
            </div>
          </div>

          {/* Interactive Controls Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            {/* Search */}
            <div className="relative">
              <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search all icons, keywords, or usage..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-4 py-2 rounded-xl text-sm border transition-all ${
                  isLightModePreview
                    ? 'bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500'
                    : 'bg-slate-800/80 border-slate-700 focus:bg-slate-800 focus:border-blue-500'
                } outline-none`}
              />
            </div>

            {/* Sizes */}
            <div className="flex items-center gap-1 p-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50">
              <span className="text-xs font-semibold px-2 text-slate-400">Size:</span>
              {[16, 20, 24].map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size as IconSize)}
                  className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedSize === size
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {size}px
                </button>
              ))}
            </div>

            {/* Semantic Colors */}
            <div className="flex items-center gap-1 p-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50">
              <span className="text-xs font-semibold px-2 text-slate-400">Color:</span>
              {(['inherit', 'primary', 'indigo', 'success', 'warning', 'error'] as IconSemantic[]).map((sem) => (
                <button
                  key={sem}
                  onClick={() => setSelectedSemantic(sem)}
                  className={`flex-1 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                    selectedSemantic === sem
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sem === 'inherit' ? 'Auto' : sem.slice(0, 3)}
                </button>
              ))}
            </div>

            {/* States & Variants */}
            <div className="flex items-center gap-1 p-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50">
              <span className="text-xs font-semibold px-2 text-slate-400">State:</span>
              {(['default', 'hover', 'active', 'disabled', 'focus'] as IconVariant[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setSelectedVariant(v)}
                  className={`flex-1 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                    selectedVariant === v
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {v === 'focus' ? 'Foc' : v.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : isLightModePreview
                    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                }`}
              >
                {cat.label} ({cat.count})
              </button>
            ))}
          </div>
        </div>

        {/* Icons Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredIcons.map((icon) => {
            const IconComponent = icon.component;
            const isCopied = copiedId === icon.id;
            const effectiveSemantic = selectedSemantic === 'inherit' ? icon.defaultSemantic || 'inherit' : selectedSemantic;

            return (
              <div
                key={icon.id}
                onClick={() => handleCopy(icon)}
                className={`group relative p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
                  isLightModePreview
                    ? 'bg-white border-[#E2E8F0] hover:border-blue-400 hover:bg-blue-50/20'
                    : 'bg-slate-900/60 border-slate-800/80 hover:border-blue-500/50 hover:bg-slate-800/50'
                }`}
              >
                {/* Category Pill */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-3 font-mono">
                  <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-bold">
                    {icon.category}
                  </span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-500 font-semibold">
                    {isCopied ? 'Copied!' : 'Click to copy'}
                  </span>
                </div>

                {/* Centered Icon Render */}
                <div className="h-16 flex items-center justify-center">
                  <div className={`p-3 rounded-xl transition-all ${
                    selectedVariant === 'active'
                      ? 'bg-blue-500/10'
                      : isLightModePreview
                      ? 'bg-slate-50 group-hover:bg-blue-50'
                      : 'bg-slate-800/50 group-hover:bg-blue-900/20'
                  }`}>
                    <IconComponent
                      size={selectedSize}
                      variant={selectedVariant}
                      semantic={effectiveSemantic}
                    />
                  </div>
                </div>

                {/* Name */}
                <h4 className="text-center font-bold text-xs truncate mt-2 group-hover:text-blue-500 transition-colors">
                  {icon.name}
                </h4>

                {/* Recommended Place Tooltip */}
                <p className="text-[10px] text-slate-400 truncate text-center mt-1">
                  {icon.recommendedPlaces[0] || icon.categoryName}
                </p>

                {/* Copy Status Badge */}
                {isCopied && (
                  <div className="absolute inset-0 bg-blue-600/90 text-white rounded-xl flex flex-col items-center justify-center p-2 backdrop-blur-xs animate-in fade-in zoom-in-95 duration-150">
                    <CheckIcon size={24} className="mb-1" />
                    <span className="text-xs font-bold">JSX Copied!</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Empty Search Result */}
        {filteredIcons.length === 0 && (
          <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800">
            <SearchIcon size={40} className="mx-auto text-slate-500 mb-3" />
            <h3 className="text-lg font-bold">No icons found</h3>
            <p className="text-sm text-slate-400 mt-1">
              Try searching for different keywords (e.g. &quot;terminal&quot;, &quot;run&quot;, &quot;streak&quot;, &quot;analytics&quot;)
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
              }}
              className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-500"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Reference & Design Specs Footer */}
        <div className={`p-6 rounded-2xl border ${isLightModePreview ? 'bg-white border-[#E2E8F0]' : 'bg-slate-900/80 border-slate-800'}`}>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
            System Design Specification & Verification
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-400">
            <div>
              <p className="font-bold text-slate-200 mb-1">Geometry & Metrics</p>
              <p>24x24 standard viewBox, with crisp 2px line weight, rounded line ends (stroke-linecap: round) and rounded intersections (stroke-linejoin: round).</p>
            </div>
            <div>
              <p className="font-bold text-slate-200 mb-1">Scale Tokens</p>
              <p>Supports 16px (sm - dense tables & chips), 20px (md - action buttons & inputs), and 24px (lg - primary navigation & headers).</p>
            </div>
            <div>
              <p className="font-bold text-slate-200 mb-1">Semantic Palette Integration</p>
              <p>Strictly compliant with CLIMB 1600 tokens: Primary (#2563EB), Indigo (#4F46E5), Success (#059669), Warning (#D97706), Error (#DC2626).</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
