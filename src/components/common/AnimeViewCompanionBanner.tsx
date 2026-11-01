import React, { useState } from 'react';
import { AnimeCharacterId } from '../../types/settings';
import { storageService } from '../../services/storage';
import {
  AnimeCharacterSprite,
  ANIME_CHARACTERS,
  FunnyStickerBadge,
  StickerType,
} from '../assets/MascotAndStickers';
import { soundEffects } from '../../utils/soundEffects';

interface AnimeViewCompanionBannerProps {
  screenTitle: string;
  subtitle: string;
  badgeText?: string;
  badgeIcon?: string;
  stickerType?: StickerType;
  customQuip?: string;
  characterId?: AnimeCharacterId;
  actionButton?: {
    label: string;
    icon?: string;
    onClick: () => void;
  };
}

export const AnimeViewCompanionBanner: React.FC<AnimeViewCompanionBannerProps> = ({
  screenTitle,
  subtitle,
  badgeText = 'Specialist Journey',
  badgeIcon = '✨',
  stickerType = '1000_iq',
  customQuip,
  characterId,
  actionButton,
}) => {
  const activeCharId: AnimeCharacterId =
    characterId || storageService.getSettings()?.theme?.selectedCharacter || 'climby';
  const charMeta =
    ANIME_CHARACTERS.find((c) => c.id === activeCharId) || ANIME_CHARACTERS[0];

  const [quipIndex, setQuipIndex] = useState(0);

  const displayedQuip =
    customQuip || charMeta.dialogues[quipIndex % charMeta.dialogues.length];

  const handleNextQuip = () => {
    soundEffects.playPop();
    setQuipIndex((prev) => prev + 1);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-indigo-200 dark:border-indigo-500/30 bg-gradient-to-r from-indigo-50/90 via-purple-50/70 to-slate-100/90 dark:from-slate-900 dark:via-indigo-950/40 dark:to-slate-900 p-5 sm:p-6 shadow-xl backdrop-blur-md">
      {/* Background Decorative Rings */}
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 left-1/3 w-56 h-56 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-5">
        {/* Left: Text & Speech Bubble */}
        <div className="space-y-3 flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/40 text-xs font-black uppercase tracking-wide">
              <span>{badgeIcon}</span>
              <span>{badgeText}</span>
            </span>
            <FunnyStickerBadge type={stickerType} tilt={-2} />
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center justify-center sm:justify-start gap-2">
              <span>{screenTitle}</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium mt-1 leading-relaxed max-w-2xl">
              {subtitle}
            </p>
          </div>

          {/* Comic Speech Quote Bubble */}
          <div className="inline-flex items-center gap-2 p-2.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-indigo-200 dark:border-white/15 backdrop-blur-md text-xs font-bold text-indigo-950 dark:text-amber-300 shadow-md">
            <span className="text-sm">{charMeta.avatarEmoji}</span>
            <span className="italic">&ldquo;{displayedQuip}&rdquo;</span>
            <button
              type="button"
              onClick={handleNextQuip}
              className="text-[10px] px-2 py-0.5 rounded-lg bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-500/30 dark:hover:bg-indigo-500/50 text-indigo-900 dark:text-white font-black transition-colors cursor-pointer ml-1"
              title="Click for next quip"
            >
              Next 💬
            </button>
          </div>

          {actionButton && (
            <div className="pt-1">
              <button
                type="button"
                onClick={actionButton.onClick}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-black shadow-md shadow-indigo-500/20 transition-all cursor-pointer active:scale-95"
              >
                {actionButton.icon && <span>{actionButton.icon}</span>}
                <span>{actionButton.label}</span>
              </button>
            </div>
          )}
        </div>

        {/* Right: Selected Anime Character Hero Sprite */}
        <div className="shrink-0 flex flex-col items-center">
          <div className="relative p-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs shadow-lg hover:scale-105 transition-transform duration-300">
            <AnimeCharacterSprite
              characterId={activeCharId}
              size={90}
              interactive={true}
              showQuote={false}
            />
            <span className="absolute -bottom-2 inset-x-0 mx-auto w-max px-2 py-0.5 rounded-full bg-slate-900 text-amber-300 text-[9px] font-black border border-amber-400/40">
              {charMeta.name.split(' ')[0]}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
