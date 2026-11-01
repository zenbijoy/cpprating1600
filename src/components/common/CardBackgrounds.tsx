import React from 'react';
import { FunnyStickerBadge, StickerType } from '../assets/MascotAndStickers';

export type CardVariant =
  | 'cosmic'
  | 'matrix'
  | 'coffee'
  | 'arcade'
  | 'candy'
  | 'emerald'
  | 'fire'
  | 'frost'
  | 'sunset'
  | 'clean';

interface FunCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  sticker?: StickerType;
  stickerTilt?: number;
  stickerPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  className?: string;
  children: React.ReactNode;
}

export const FunCard: React.FC<FunCardProps> = ({
  variant = 'clean',
  sticker,
  stickerTilt = 6,
  stickerPosition = 'top-right',
  className = '',
  children,
  ...rest
}) => {
  // Styles for different fun backgrounds
  const getVariantStyles = (): {
    wrapper: string;
    decorOverlay: React.ReactNode;
    glowOrb?: React.ReactNode;
  } => {
    switch (variant) {
      case 'cosmic':
        return {
          wrapper:
            'bg-gradient-to-br from-indigo-50/90 via-purple-50/70 to-slate-100/90 dark:from-slate-900 dark:via-indigo-950/80 dark:to-purple-950/70 border-indigo-200/80 dark:border-indigo-500/30 text-slate-900 dark:text-white shadow-lg shadow-indigo-100/40 dark:shadow-indigo-950/30',
          decorOverlay: (
            <>
              {/* Starry Dust Pattern */}
              <div
                className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-25"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.35) 1px, transparent 1px), radial-gradient(circle at 20% 80%, rgba(14, 165, 233, 0.35) 1.5px, transparent 1.5px)',
                  backgroundSize: '48px 48px, 72px 72px',
                }}
              />
              {/* Subtle Cosmic Nebula Glow */}
              <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-gradient-to-br from-indigo-500/15 via-purple-500/10 to-transparent blur-2xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full bg-gradient-to-tr from-cyan-500/15 to-transparent blur-2xl pointer-events-none" />
              {/* Playful Floating Celestial Emoji */}
              <span className="absolute top-3 right-4 text-xs opacity-35 select-none pointer-events-none animate-levitate">
                ✨
              </span>
              <span
                className="absolute bottom-3 left-4 text-xs opacity-25 select-none pointer-events-none animate-levitate"
                style={{ animationDelay: '1.5s' }}
              >
                🪐
              </span>
            </>
          ),
        };

      case 'matrix':
        return {
          wrapper:
            'bg-gradient-to-br from-emerald-50/90 via-teal-50/70 to-slate-100/90 dark:from-slate-950 dark:via-emerald-950/60 dark:to-slate-900 border-emerald-200/80 dark:border-emerald-500/30 text-slate-900 dark:text-emerald-50 shadow-lg shadow-emerald-100/40 dark:shadow-emerald-950/20',
          decorOverlay: (
            <>
              {/* Tech Circuit Dots */}
              <div
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                  backgroundImage:
                    'radial-gradient(rgba(16, 185, 129, 0.4) 1px, transparent 1px), linear-gradient(to right, rgba(16, 185, 129, 0.05) 1px, transparent 1px)',
                  backgroundSize: '28px 28px, 28px 28px',
                }}
              />
              <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none" />
              {/* Matrix Floating Micro-Glyphs */}
              <div className="absolute top-2 right-4 text-[10px] font-mono font-bold text-emerald-600/60 dark:text-emerald-400/40 select-none pointer-events-none">
                &lt;1337/&gt;
              </div>
              <div className="absolute bottom-2 left-4 text-[9px] font-mono text-emerald-700/50 dark:text-emerald-500/30 select-none pointer-events-none">
                0101
              </div>
            </>
          ),
        };

      case 'coffee':
        return {
          wrapper:
            'bg-gradient-to-br from-amber-50/90 via-orange-50/60 to-amber-100/40 dark:from-stone-900 dark:via-amber-950/40 dark:to-stone-950 border-amber-300/60 dark:border-amber-700/40 text-stone-900 dark:text-amber-50 shadow-md shadow-amber-900/10',
          decorOverlay: (
            <>
              {/* Warm Coffee Aura */}
              <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-amber-500/15 blur-2xl pointer-events-none" />
              <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-orange-400/10 blur-xl pointer-events-none" />
              {/* Playful Floating Steam & Mug Doodles */}
              <span className="absolute top-3 right-4 text-sm opacity-40 select-none pointer-events-none animate-levitate">
                ☕
              </span>
              <span
                className="absolute bottom-2 right-6 text-xs opacity-30 select-none pointer-events-none animate-levitate"
                style={{ animationDelay: '1.2s' }}
              >
                ✨
              </span>
            </>
          ),
        };

      case 'arcade':
        return {
          wrapper:
            'bg-gradient-to-br from-purple-50/90 via-pink-50/70 to-slate-100/90 dark:from-slate-900 dark:via-purple-950/70 dark:to-pink-950/60 border-pink-200/80 dark:border-pink-500/30 text-slate-900 dark:text-white shadow-lg shadow-pink-100/40 dark:shadow-pink-950/20',
          decorOverlay: (
            <>
              {/* Synthwave Retro Grid */}
              <div
                className="absolute bottom-0 left-0 right-0 h-32 opacity-20 pointer-events-none"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(244, 63, 94, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(244, 63, 94, 0.4) 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                  transform: 'perspective(200px) rotateX(55deg)',
                  transformOrigin: 'bottom center',
                }}
              />
              <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-pink-500/20 blur-2xl pointer-events-none" />
              <span className="absolute top-3 right-4 text-xs opacity-50 select-none pointer-events-none animate-levitate">
                👾
              </span>
              <span
                className="absolute top-3 left-4 text-xs opacity-40 select-none pointer-events-none animate-levitate"
                style={{ animationDelay: '0.8s' }}
              >
                🕹️
              </span>
            </>
          ),
        };

      case 'candy':
        return {
          wrapper:
            'bg-gradient-to-br from-pink-50/90 via-purple-50/70 to-sky-50/80 dark:from-slate-900 dark:via-pink-950/30 dark:to-purple-950/40 border-pink-200 dark:border-pink-800/50 text-slate-900 dark:text-pink-50 shadow-md shadow-pink-500/10',
          decorOverlay: (
            <>
              {/* Candy Bubbles Pattern */}
              <div
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                  backgroundImage:
                    'radial-gradient(circle, rgba(236, 72, 153, 0.4) 2px, transparent 2px)',
                  backgroundSize: '36px 36px',
                }}
              />
              <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-pink-400/20 blur-2xl pointer-events-none" />
              <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-sky-400/20 blur-2xl pointer-events-none" />
              <span className="absolute top-3 right-4 text-sm opacity-40 select-none pointer-events-none animate-levitate">
                🍭
              </span>
              <span
                className="absolute bottom-2 left-4 text-xs opacity-40 select-none pointer-events-none animate-levitate"
                style={{ animationDelay: '1.4s' }}
              >
                🫧
              </span>
            </>
          ),
        };

      case 'emerald':
        return {
          wrapper:
            'bg-gradient-to-br from-emerald-50/90 via-teal-50/60 to-white dark:from-slate-900 dark:via-emerald-950/40 dark:to-slate-900 border-emerald-300/80 dark:border-emerald-700/50 text-slate-900 dark:text-emerald-50 shadow-md shadow-emerald-600/10',
          decorOverlay: (
            <>
              {/* Topo Altitude Lines */}
              <div
                className="absolute inset-0 pointer-events-none opacity-15"
                style={{
                  backgroundImage:
                    'radial-gradient(ellipse at top right, rgba(16, 185, 129, 0.4) 0%, transparent 65%)',
                }}
              />
              <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none" />
              <span className="absolute top-3 right-4 text-sm opacity-40 select-none pointer-events-none animate-levitate">
                🏆
              </span>
              <span
                className="absolute bottom-2 left-4 text-xs opacity-35 select-none pointer-events-none animate-levitate"
                style={{ animationDelay: '1s' }}
              >
                🌱
              </span>
            </>
          ),
        };

      case 'fire':
        return {
          wrapper:
            'bg-gradient-to-br from-amber-500/10 via-rose-500/10 to-orange-500/10 dark:from-slate-900 dark:via-red-950/40 dark:to-amber-950/30 border-orange-400/40 dark:border-rose-700/50 text-slate-900 dark:text-rose-50 shadow-md shadow-orange-500/15',
          decorOverlay: (
            <>
              <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-orange-500/20 blur-2xl pointer-events-none" />
              <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-red-500/15 blur-2xl pointer-events-none" />
              <span className="absolute top-3 right-4 text-sm opacity-45 select-none pointer-events-none animate-flame">
                🔥
              </span>
              <span
                className="absolute bottom-2 left-4 text-xs opacity-35 select-none pointer-events-none animate-levitate"
                style={{ animationDelay: '0.8s' }}
              >
                ⚡
              </span>
            </>
          ),
        };

      case 'frost':
        return {
          wrapper:
            'bg-gradient-to-br from-cyan-50/80 via-sky-50/60 to-white dark:from-slate-900 dark:via-sky-950/40 dark:to-slate-950 border-cyan-200 dark:border-cyan-800/50 text-slate-900 dark:text-cyan-50 shadow-md shadow-cyan-500/10',
          decorOverlay: (
            <>
              <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-cyan-400/15 blur-2xl pointer-events-none" />
              <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-blue-400/10 blur-xl pointer-events-none" />
              <span className="absolute top-3 right-4 text-xs opacity-40 select-none pointer-events-none animate-levitate">
                ❄️
              </span>
              <span
                className="absolute bottom-2 right-6 text-xs opacity-35 select-none pointer-events-none animate-levitate"
                style={{ animationDelay: '1.2s' }}
              >
                🏔️
              </span>
            </>
          ),
        };

      case 'sunset':
        return {
          wrapper:
            'bg-gradient-to-br from-amber-500/15 via-pink-500/15 to-purple-600/15 dark:from-slate-900 dark:via-purple-950/40 dark:to-pink-950/30 border-purple-300/40 dark:border-purple-800/50 text-slate-900 dark:text-purple-50 shadow-md',
          decorOverlay: (
            <>
              <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-amber-400/15 blur-2xl pointer-events-none" />
              <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-purple-500/15 blur-2xl pointer-events-none" />
              <span className="absolute top-3 right-4 text-xs opacity-40 select-none pointer-events-none animate-levitate">
                🌅
              </span>
            </>
          ),
        };

      case 'clean':
      default:
        return {
          wrapper:
            'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-sm',
          decorOverlay: null,
        };
    }
  };

  const { wrapper, decorOverlay } = getVariantStyles();

  const getStickerPosClass = () => {
    switch (stickerPosition) {
      case 'top-left':
        return '-top-3 -left-3';
      case 'bottom-right':
        return '-bottom-3 -right-3';
      case 'bottom-left':
        return '-bottom-3 -left-3';
      case 'top-right':
      default:
        return '-top-3 -right-3';
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border transition-all duration-300 interactive-card ${wrapper} ${className}`}
      {...rest}
    >
      {/* Decorative Themed Background Layers */}
      {decorOverlay}

      {/* Optional Funny Corner Sticker Badge */}
      {sticker && (
        <div className={`absolute ${getStickerPosClass()} z-20 pointer-events-none select-none`}>
          <FunnyStickerBadge type={sticker} tilt={stickerTilt} />
        </div>
      )}

      {/* Foreground Content */}
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
};
