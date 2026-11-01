import React, { useState } from 'react';
import { ThemePresetId } from '../types/settings';
import { THEME_PRESETS, THEME_METADATA, applyThemeToDom } from '../utils/themeEngine';
import { storageService } from '../services/storage';
import { soundEffects } from '../utils/soundEffects';

interface AnimatedThemeShowcaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ThemePresetId;
  onSelectTheme: (presetId: ThemePresetId) => void;
}

type ThemeCategoryFilter = 'all' | 'anime' | 'cyber' | 'space' | 'epic' | 'cozy' | 'classic';

export const AnimatedThemeShowcaseModal: React.FC<AnimatedThemeShowcaseModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme,
}) => {
  const [selectedPreviewTheme, setSelectedPreviewTheme] = useState<ThemePresetId>(currentTheme);
  const [categoryFilter, setCategoryFilter] = useState<ThemeCategoryFilter>('all');

  if (!isOpen) return null;

  const THEME_ANIMATION_BADGES: Partial<Record<ThemePresetId, { badge: string; desc: string }>> = {
    'mountain-summit': { badge: '❄️ Falling Snowflakes', desc: 'Snowy alpine ridge mist & gentle floating snowflakes' },
    'sakura-shrine': { badge: '🌸 Drifting Sakura', desc: '12 fluttering cherry blossom petals swaying with natural wind' },
    'cyber-matrix': { badge: '👾 1337 Green Rain', desc: 'Phosphor green digital code streams cascading down CRT scanlines' },
    'galaxy-space': { badge: '🚀 Shooting Stars', desc: 'Deep cosmic nebula with streaking shooting stars & meteors' },
    'neon-road': { badge: '🏎️ Synthwave Grid', desc: 'Glowing retro horizon sun & endless scrolling perspective highway' },
    'sea-beach': { badge: '🌊 Rolling Waves', desc: 'Tropical turquoise undulating ocean waves & seafoam' },
    'aurora-borealis': { badge: '🌌 Northern Curtains', desc: 'Shimmering undulating polar emerald & violet aurora ribbons' },
    'magic-academy': { badge: '🔮 Transmutation Rune', desc: 'Rotating arcane circle with astrological transmutation rings' },
    'underwater-atlantis': { badge: '🧜 Rising Bubbles', desc: 'Sunlight water caustics & translucent rising air bubbles' },
    'volcano-forge': { badge: '🔥 Rising Embers', desc: 'Molten rock hearth with glowing orange and yellow sparks' },
    'dragon-fire': { badge: '🐉 Dragon Embers', desc: 'Blazing crimson flames & floating fire embers' },
    'fighting-coliseum': { badge: '⚔️ Arena Torches', desc: 'Blazing flank flame pillars & champion glory glow' },
    'superhero-city': { badge: '🏙️ Night Searchlights', desc: 'Scanning night sky searchlight beams over skyscraper silhouette' },
    'steampunk-airship': { badge: '⚙️ Spinning Gears', desc: 'Interlocking rotating brass cogwheels & Victorian machinery' },
    'sunset-lofi': { badge: '🌇 Rainy Window', desc: 'Warm golden hour sunset with gentle raindrops sliding on glass' },
    'fairytale-wonderland': { badge: '🧚 Fairy Lights', desc: 'Bioluminescent floating spores & enchanted glowing lights' },
    'candy-pop': { badge: '🍬 Floating Sweets', desc: 'Pastel floating candy bubbles & bouncing sparkle hearts' },
    'kawaii-anime': { badge: '🎀 Pastel Sparkles', desc: 'Bouncing pink hearts, kawaii sparkles, and soft cotton clouds' },
    'railway-express': { badge: '🚂 Rhythmic Tracks', desc: 'Vintage train ties, lantern glow & locomotive steam' },
    'jorna-waterfall': { badge: '💧 Cascading Mist', desc: 'Vertical waterfall streams with sparkling river spray' },
    'anime-village': { badge: '🏡 Rolling Hills', desc: 'Pastoral green grass hills & gentle village breeze' },
    'sci-fi-mecha': { badge: '🤖 Cyber Radar HUD', desc: 'Concentric rotating radar telemetry rings' },
    'pixel-dungeon': { badge: '🗡️ 8-Bit Stone', desc: 'Retro pixel stone bricks & flickering torchlight' },
    'retro-arcade': { badge: '🕹️ 1984 Arcade Grid', desc: 'Vaporwave perspective grid with CRT scanlines' },
    'climb-default': { badge: '🏔️ Signature Summit', desc: 'Signature electric indigo CP mountaineer ambiance' },
    'midnight': { badge: '🌙 Sapphire Night', desc: 'Deep sapphire obsidian ambiance for intense late-night coding' },
    'amoled': { badge: '🖤 True Pitch Black', desc: 'Pure 0% OLED battery saver with razor-sharp neon edges' },
    'ocean': { badge: '🌊 Abyssal Deep', desc: 'Deep ocean currents with bioluminescent glow' },
    'forest': { badge: '🌲 Emerald Pine', desc: 'Evergreen woodland with sunbeam dappling' },
    'violet': { badge: '💜 Amethyst Dust', desc: 'Starlight violet crystal glow' },
  };

  const getThemeGroup = (id: ThemePresetId): ThemeCategoryFilter => {
    switch (id) {
      case 'sakura-shrine':
      case 'anime-village':
      case 'ninja-shadow':
      case 'cyberpunk-tokyo':
      case 'kawaii-anime':
        return 'anime';
      case 'cyber-matrix':
      case 'neon-road':
      case 'sci-fi-mecha':
      case 'retro-arcade':
        return 'cyber';
      case 'galaxy-space':
      case 'aurora-borealis':
      case 'magic-academy':
      case 'underwater-atlantis':
        return 'space';
      case 'dragon-fire':
      case 'volcano-forge':
      case 'fighting-coliseum':
      case 'pixel-dungeon':
      case 'valhalla-viking':
      case 'pirate-cove':
      case 'wild-west':
      case 'superhero-city':
        return 'epic';
      case 'sunset-lofi':
      case 'coffee-overdrive':
      case 'candy-pop':
      case 'fairytale-wonderland':
      case 'warm-neutral':
        return 'cozy';
      case 'mountain-summit':
      case 'sea-beach':
      case 'railway-express':
      case 'jorna-waterfall':
      case 'jungle-safari':
      case 'desert-oasis':
      case 'climb-default':
      case 'midnight':
      case 'amoled':
      case 'high-contrast':
      case 'ocean':
      case 'forest':
      case 'violet':
      case 'steampunk-airship':
      default:
        return 'classic';
    }
  };

  const allPresetIds = Object.keys(THEME_PRESETS) as ThemePresetId[];
  const filteredPresets = allPresetIds.filter((id) => {
    if (categoryFilter === 'all') return true;
    return getThemeGroup(id) === categoryFilter;
  });

  const previewPreset = THEME_PRESETS[selectedPreviewTheme] || THEME_PRESETS['climb-default'];
  const previewMeta = THEME_METADATA[selectedPreviewTheme] || { icon: '🎨', category: 'nature', ambientTitle: 'CLIMB World' };
  const previewAnim = THEME_ANIMATION_BADGES[selectedPreviewTheme] || { badge: '✨ Living Atmosphere', desc: 'Dynamic ambient gradient orbs and micro-particles' };

  const isLight = storageService.getSettings()?.theme?.mode === 'light';
  const previewColors = isLight ? (previewPreset.light || previewPreset.dark) : previewPreset.dark;

  const handleApplyTheme = (id: ThemePresetId) => {
    soundEffects.playThemeJingle(id);
    onSelectTheme(id);
  };

  const handleSurpriseMe = () => {
    soundEffects.playDiceRoll();
    const random = allPresetIds[Math.floor(Math.random() * allPresetIds.length)];
    setSelectedPreviewTheme(random);
    handleApplyTheme(random);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="theme-showcase-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl bg-slate-900 border border-cyan-500/30 shadow-2xl shadow-cyan-500/15 overflow-hidden text-slate-100"
      >
        {/* Header */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-slate-950 via-cyan-950/40 to-slate-950 border-b border-cyan-500/20 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl animate-bounce-subtle">🎨</span>
              <h2 id="theme-showcase-title" className="text-xl sm:text-2xl font-black bg-gradient-to-r from-cyan-700 via-teal-700 to-amber-700 dark:from-cyan-300 dark:via-teal-200 dark:to-amber-200 bg-clip-text text-transparent">
                World Realm Theme Palace (40 Animated Worlds)
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-cyan-800 dark:text-cyan-200/80 mt-0.5">
              Transform your coding journey with living, animated scenery: falling sakura, Matrix rain, shooting stars, and ocean waves!
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSurpriseMe}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/25 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
              title="Roll a random animated realm"
            >
              <span>🎲</span>
              <span>Surprise Me</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold text-lg cursor-pointer transition-all active:scale-95 border border-white/10"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="px-6 py-3 bg-slate-900/60 border-b border-white/5 flex flex-wrap items-center gap-1.5 overflow-x-auto text-xs font-bold">
          {[
            { id: 'all', label: '🌟 All (40)' },
            { id: 'anime', label: '🌸 Anime & Japanese (5)' },
            { id: 'cyber', label: '⚡ Cyber & Matrix (4)' },
            { id: 'space', label: '🌌 Space & Arcane (4)' },
            { id: 'epic', label: '🔥 Fantasy & Battles (8)' },
            { id: 'cozy', label: '☕ Cozy & Lofi (5)' },
            { id: 'classic', label: '🏔️ Mountaineer Classics (14)' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCategoryFilter(tab.id as ThemeCategoryFilter)}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                categoryFilter === tab.id
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                  : 'bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800/60 border border-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body: Active Spotlight Showcase + Grid */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Spotlight Realm Stage */}
          <div
            className="p-5 sm:p-6 rounded-3xl border border-white/10 relative overflow-hidden transition-all duration-300 shadow-xl"
            style={{
              backgroundColor: previewColors.bgSurface,
              borderColor: previewColors.borderFocus,
              boxShadow: `0 0 35px ${previewColors.accentGlow}`,
            }}
          >
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-3xl p-2 rounded-2xl bg-black/40 border border-white/10 shadow-inner">
                    {previewMeta.icon}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl sm:text-2xl font-black text-white" style={{ color: previewColors.textMain }}>
                        {previewPreset.name}
                      </h3>
                      {currentTheme === selectedPreviewTheme && (
                        <span className="px-2.5 py-0.5 rounded-full bg-cyan-500 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                          ACTIVE REALM
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-slate-400">{previewMeta.ambientTitle}</p>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 max-w-xl" style={{ color: previewColors.textMuted }}>
                  {previewPreset.description}
                </p>

                {/* Animation details badge */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="px-3 py-1 rounded-xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                    {previewAnim.badge}
                  </span>
                  <span className="text-xs text-slate-400 hidden sm:inline italic">
                    {previewAnim.desc}
                  </span>
                </div>
              </div>

              {/* Action & Palette Preview */}
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                {/* Mini Swatches */}
                <div className="flex items-center gap-1.5 p-2 rounded-2xl bg-black/40 border border-white/10">
                  <div
                    className="w-6 h-6 rounded-xl border border-white/20 shadow-xs"
                    title="Primary"
                    style={{ backgroundColor: previewColors.primary }}
                  />
                  <div
                    className="w-6 h-6 rounded-xl border border-white/20 shadow-xs"
                    title="Secondary"
                    style={{ backgroundColor: previewColors.secondary }}
                  />
                  <div
                    className="w-6 h-6 rounded-xl border border-white/20 shadow-xs"
                    title="App Background"
                    style={{ backgroundColor: previewColors.bgApp }}
                  />
                  <div
                    className="w-6 h-6 rounded-xl border border-white/20 shadow-xs"
                    title="Card Surface"
                    style={{ backgroundColor: previewColors.bgCard }}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleApplyTheme(selectedPreviewTheme)}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-2xl font-black text-xs text-slate-950 shadow-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: previewColors.primary,
                    color: '#ffffff',
                    boxShadow: `0 0 20px ${previewColors.accentGlow}`,
                  }}
                >
                  <span>✓</span>
                  <span>{currentTheme === selectedPreviewTheme ? 'Realm Active' : 'Enter This Realm'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Grid of All Realms */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                Explore {filteredPresets.length} Animated Worlds
              </h4>
              <span className="text-xs text-slate-500">Click any world to preview and activate</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredPresets.map((presetId) => {
                const preset = THEME_PRESETS[presetId];
                const meta = THEME_METADATA[presetId] || { icon: '🎨', category: 'nature' };
                const anim = THEME_ANIMATION_BADGES[presetId];
                const isCurrent = presetId === currentTheme;
                const isPreviewed = presetId === selectedPreviewTheme;

                return (
                  <div
                    key={presetId}
                    onClick={() => {
                      setSelectedPreviewTheme(presetId);
                      handleApplyTheme(presetId);
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative group flex flex-col justify-between ${
                      isCurrent
                        ? 'border-cyan-400 bg-cyan-950/40 shadow-lg ring-2 ring-cyan-400/50 scale-[1.01]'
                        : isPreviewed
                        ? 'border-indigo-400 bg-indigo-950/30'
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl group-hover:scale-125 transition-transform duration-200">
                          {meta.icon}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-xs"
                            style={{ backgroundColor: preset.dark.primary }}
                          />
                          <div
                            className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-xs"
                            style={{ backgroundColor: preset.dark.secondary }}
                          />
                        </div>
                      </div>

                      <h5 className="font-extrabold text-sm text-white line-clamp-1 group-hover:text-cyan-300 transition-colors">
                        {preset.name}
                      </h5>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {preset.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-[10px] text-cyan-400 font-bold truncate max-w-[120px]">
                        {anim?.badge.split(' ')[0] || '✨'} {anim?.badge.slice(3) || 'Animated'}
                      </span>
                      {isCurrent ? (
                        <span className="text-[10px] text-cyan-400 font-black flex items-center gap-0.5">
                          <span>✓</span> Active
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 group-hover:text-white font-bold transition-colors">
                          Apply →
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950/80 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>💡 Tip: All animated background scenery respects your performance &amp; accessibility settings.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
