import React, { useState } from 'react';
import { ANIME_CHARACTERS, AnimeCharacterId, AnimeCharacterMeta } from './assets/MascotAndStickers';
import { storageService } from '../services/storage';
import { soundEffects } from '../utils/soundEffects';

interface CuteCharactersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCharacter?: (characterId: AnimeCharacterId) => void;
}

export const CuteCharactersModal: React.FC<CuteCharactersModalProps> = ({
  isOpen,
  onClose,
  onSelectCharacter,
}) => {
  const [selectedCharId, setSelectedCharId] = useState<AnimeCharacterId>(() => {
    return storageService.getSettings()?.theme?.selectedCharacter || 'mochi-bunny';
  });

  const [filter, setFilter] = useState<'all' | 'cartoon' | 'classic'>('cartoon');
  const [activeMood, setActiveMood] = useState<'happy' | 'coding' | 'celebrating' | 'thinking' | 'zen' | 'excited'>('happy');
  const [viewMode, setViewMode] = useState<'sprite' | 'artwork'>('artwork');
  const [speechBubbleText, setSpeechBubbleText] = useState<string>('');

  if (!isOpen) return null;

  const cartoonIds: AnimeCharacterId[] = [
    'mochi-bunny',
    'pip-penguin',
    'boba-otter',
    'kitsu-fox',
    'bao-panda',
  ];

  const filteredCharacters = ANIME_CHARACTERS.filter((c) => {
    if (filter === 'cartoon') return cartoonIds.includes(c.id);
    if (filter === 'classic') return !cartoonIds.includes(c.id);
    return true;
  });

  const currentChar = ANIME_CHARACTERS.find((c) => c.id === selectedCharId) || ANIME_CHARACTERS[0];
  const CurrentSprite = currentChar.component;

  const handleSelectCompanion = (id: AnimeCharacterId) => {
    setSelectedCharId(id);
    soundEffects.playLevelUpCute();

    const currentSettings = storageService.getSettings();
    if (currentSettings) {
      storageService.saveSettings({
        ...currentSettings,
        theme: {
          ...currentSettings.theme,
          selectedCharacter: id,
        },
      });
    }

    if (onSelectCharacter) {
      onSelectCharacter(id);
    }
  };

  const handleCharClick = (char: AnimeCharacterMeta) => {
    soundEffects.playPop();
    const randomQuote = char.dialogues[Math.floor(Math.random() * char.dialogues.length)];
    setSpeechBubbleText(randomQuote);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cute-characters-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-slate-900 border border-indigo-500/30 shadow-2xl shadow-indigo-500/20 overflow-hidden text-slate-100"
      >
        {/* Header */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-indigo-950/80 via-purple-950/70 to-slate-900/90 border-b border-indigo-500/20 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl animate-bounce-subtle">✨</span>
              <h2 id="cute-characters-title" className="text-xl sm:text-2xl font-black bg-gradient-to-r from-pink-600 via-indigo-600 to-amber-600 dark:from-pink-300 dark:via-indigo-200 dark:to-amber-200 bg-clip-text text-transparent">
                Cute Cartoon App Companions
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-indigo-800 dark:text-indigo-300/80 mt-0.5">
              Choose your cute algorithm partner to accompany you on your climb to 1600 rating!
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold text-lg cursor-pointer transition-all active:scale-95 border border-white/10"
          >
            ✕
          </button>
        </div>

        {/* Filter Tabs & View Toggle */}
        <div className="px-6 py-3 bg-slate-900/60 border-b border-white/5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950/70 border border-white/10 text-xs font-bold">
            <button
              type="button"
              onClick={() => setFilter('cartoon')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                filter === 'cartoon'
                  ? 'bg-gradient-to-r from-pink-500 to-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🐰 Cute Cartoon Cuties (5)
            </button>
            <button
              type="button"
              onClick={() => setFilter('classic')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                filter === 'classic'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ⚡ Anime Heroes (12)
            </button>
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                filter === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🌟 All (17)
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-semibold">Display:</span>
            <div className="flex rounded-xl bg-slate-950 border border-white/10 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('artwork')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  viewMode === 'artwork' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                🎨 Sticker Art
              </button>
              <button
                type="button"
                onClick={() => setViewMode('sprite')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  viewMode === 'sprite' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                📐 Vector SVG
              </button>
            </div>
          </div>
        </div>

        {/* Modal Body: Active Character Spotlight + Character Grid */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Spotlight Hero Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-950/40 via-purple-950/30 to-slate-900 border border-indigo-500/30 relative overflow-hidden flex flex-col md:flex-row items-center gap-6">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Character Visual */}
            <div
              onClick={() => handleCharClick(currentChar)}
              className="relative shrink-0 flex flex-col items-center cursor-pointer group"
              title="Click to hear speech!"
            >
              {viewMode === 'artwork' && currentChar.image ? (
                <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-3xl overflow-hidden p-2 bg-gradient-to-tr from-pink-500/20 via-indigo-500/20 to-amber-500/20 border border-indigo-400/40 shadow-xl transition-transform duration-300 group-hover:scale-105">
                  <img
                    src={currentChar.image}
                    alt={currentChar.name}
                    className="w-full h-full object-contain rounded-2xl drop-shadow-lg"
                  />
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-pink-500 text-white text-[10px] font-black shadow-sm">
                    KAWAII
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-3xl bg-slate-950/60 border border-white/10 shadow-xl transition-transform duration-300 group-hover:scale-110">
                  <CurrentSprite size={130} mood={activeMood} />
                </div>
              )}

              <span className="mt-2 text-[11px] font-bold text-indigo-300 flex items-center gap-1 group-hover:text-pink-300 transition-colors">
                <span>🔊</span> Click to hear quote
              </span>
            </div>

            {/* Character Info & Actions */}
            <div className="flex-1 space-y-3 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span className="text-2xl">{currentChar.avatarEmoji}</span>
                <h3 className="text-2xl font-black text-white">{currentChar.name}</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold">
                  {currentChar.title}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                  {currentChar.animeGenre}
                </span>
              </div>

              {/* Speech bubble */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-indigo-500/30 text-sm text-indigo-200 shadow-inner relative italic">
                <span className="text-pink-400 font-bold not-italic">“</span>
                {speechBubbleText || currentChar.quote}
                <span className="text-pink-400 font-bold not-italic">”</span>
              </div>

              {/* Mood selector if in Vector mode */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 pt-1">
                <span className="text-xs text-slate-400 font-semibold mr-1">Mood:</span>
                {(['happy', 'coding', 'celebrating', 'thinking', 'zen', 'excited'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setActiveMood(m)}
                    className={`px-2.5 py-0.5 rounded-lg text-xs font-bold capitalize transition-all ${
                      activeMood === m
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {/* Companion Active / Set Button */}
              <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
                {selectedCharId === currentChar.id ? (
                  <div className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black flex items-center gap-1.5 shadow-sm">
                    <span>✓</span> Current Active Companion Hero
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSelectCompanion(currentChar.id)}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-indigo-500/25 transition-all active:scale-95 cursor-pointer"
                  >
                    Set as My Companion Hero ⭐
                  </button>
                )}

                {currentChar.image && (
                  <a
                    href={currentChar.image}
                    download={`${currentChar.id}.jpg`}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-white/10 transition-colors flex items-center gap-1"
                  >
                    <span>📥</span> Save High-Res Art
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Grid of Characters */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-black text-slate-300 uppercase tracking-wider">
                Select from {filteredCharacters.length} Companions
              </h4>
              <span className="text-xs text-slate-400">Click any companion to preview &amp; select</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              {filteredCharacters.map((char) => {
                const isSelected = char.id === selectedCharId;
                const Sprite = char.component;

                return (
                  <div
                    key={char.id}
                    onClick={() => {
                      setSelectedCharId(char.id);
                      handleCharClick(char);
                    }}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer relative group flex flex-col items-center justify-between ${
                      isSelected
                        ? 'border-pink-500 bg-pink-950/30 shadow-lg ring-2 ring-pink-500/40 scale-[1.02]'
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-800/40 hover:scale-[1.01]'
                    }`}
                  >
                    {/* Active badge */}
                    {isSelected && (
                      <span className="absolute -top-2 inset-x-0 mx-auto w-max px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-500 to-indigo-600 text-white text-[9px] font-black shadow-sm">
                        ACTIVE
                      </span>
                    )}

                    {/* Character Visual */}
                    <div className="py-2">
                      {viewMode === 'artwork' && char.image ? (
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-900 border border-white/10 p-1 mx-auto shadow-sm">
                          <img
                            src={char.image}
                            alt={char.name}
                            className="w-full h-full object-contain rounded-lg"
                          />
                        </div>
                      ) : (
                        <Sprite size={70} mood="happy" />
                      )}
                    </div>

                    <div className="w-full mt-1">
                      <div className="flex items-center justify-center gap-1 font-bold text-xs text-white truncate">
                        <span>{char.avatarEmoji}</span>
                        <span className="truncate">{char.name}</span>
                      </div>
                      <p className="text-[10px] text-indigo-300 font-semibold truncate mt-0.5">
                        {char.title}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectCompanion(char.id);
                      }}
                      className={`w-full mt-2.5 py-1 rounded-lg text-[10px] font-black transition-all ${
                        isSelected
                          ? 'bg-pink-600 text-white'
                          : 'bg-slate-800 hover:bg-indigo-600/50 text-slate-300 hover:text-white'
                      }`}
                    >
                      {isSelected ? '✓ Chosen' : 'Select'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950/80 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>💡 Tip: Your companion appears in your Dashboard, AI Coach, and Problem Arena!</span>
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
