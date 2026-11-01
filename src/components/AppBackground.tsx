import React, { useEffect, useState } from 'react';
import { ThemePresetId } from '../types/settings';
import { storageService } from '../services/storage';

export const AppBackground: React.FC = () => {
  const [activeTheme, setActiveTheme] = useState<ThemePresetId>(() => {
    return storageService.getSettings()?.theme?.preset || 'climb-default';
  });

  useEffect(() => {
    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.config?.preset) {
        setActiveTheme(customEvent.detail.config.preset);
      }
    };

    window.addEventListener('climb1600:theme-changed', handleThemeChange);
    return () => window.removeEventListener('climb1600:theme-changed', handleThemeChange);
  }, []);

  // Theme-specific ambient orb colors (covers all 40 themes)
  const getOrbGradients = () => {
    switch (activeTheme) {
      case 'mountain-summit':
        return {
          orb1: 'from-sky-400/25 via-blue-500/15 to-transparent',
          orb2: 'from-amber-300/20 via-sky-400/10 to-transparent',
          orb3: 'from-indigo-400/20 to-transparent',
        };
      case 'sea-beach':
        return {
          orb1: 'from-cyan-400/30 via-teal-400/15 to-transparent',
          orb2: 'from-amber-400/20 via-yellow-300/15 to-transparent',
          orb3: 'from-sky-500/20 to-transparent',
        };
      case 'railway-express':
        return {
          orb1: 'from-amber-500/25 via-fuchsia-600/15 to-transparent',
          orb2: 'from-purple-500/20 via-rose-500/15 to-transparent',
          orb3: 'from-amber-400/20 to-transparent',
        };
      case 'jorna-waterfall':
        return {
          orb1: 'from-emerald-400/30 via-teal-500/20 to-transparent',
          orb2: 'from-cyan-400/25 via-emerald-600/15 to-transparent',
          orb3: 'from-teal-300/20 to-transparent',
        };
      case 'neon-road':
        return {
          orb1: 'from-rose-500/35 via-pink-600/20 to-transparent',
          orb2: 'from-purple-600/25 via-violet-500/15 to-transparent',
          orb3: 'from-amber-400/20 to-transparent',
        };
      case 'anime-village':
        return {
          orb1: 'from-lime-400/25 via-emerald-500/15 to-transparent',
          orb2: 'from-amber-300/20 via-yellow-400/10 to-transparent',
          orb3: 'from-green-500/20 to-transparent',
        };
      case 'sci-fi-mecha':
        return {
          orb1: 'from-cyan-400/30 via-blue-600/20 to-transparent',
          orb2: 'from-indigo-500/25 via-violet-600/15 to-transparent',
          orb3: 'from-sky-400/20 to-transparent',
        };
      case 'fighting-coliseum':
        return {
          orb1: 'from-orange-600/35 via-red-600/25 to-transparent',
          orb2: 'from-amber-500/30 via-yellow-500/15 to-transparent',
          orb3: 'from-rose-600/25 to-transparent',
        };
      case 'sakura-shrine':
        return {
          orb1: 'from-pink-400/30 via-rose-400/20 to-transparent',
          orb2: 'from-fuchsia-400/20 via-pink-300/15 to-transparent',
          orb3: 'from-red-400/15 to-transparent',
        };
      case 'pixel-dungeon':
        return {
          orb1: 'from-amber-500/25 via-yellow-600/15 to-transparent',
          orb2: 'from-purple-600/20 via-indigo-700/15 to-transparent',
          orb3: 'from-amber-400/20 to-transparent',
        };
      case 'steampunk-airship':
        return {
          orb1: 'from-amber-600/25 via-yellow-700/15 to-transparent',
          orb2: 'from-orange-500/20 via-amber-800/15 to-transparent',
          orb3: 'from-amber-400/15 to-transparent',
        };
      case 'aurora-borealis':
        return {
          orb1: 'from-emerald-400/35 via-teal-400/20 to-transparent',
          orb2: 'from-violet-500/25 via-purple-600/15 to-transparent',
          orb3: 'from-cyan-400/25 to-transparent',
        };
      case 'desert-oasis':
        return {
          orb1: 'from-amber-400/25 via-yellow-500/15 to-transparent',
          orb2: 'from-sky-400/20 via-blue-500/15 to-transparent',
          orb3: 'from-orange-400/20 to-transparent',
        };
      case 'ninja-shadow':
        return {
          orb1: 'from-indigo-600/25 via-blue-700/15 to-transparent',
          orb2: 'from-slate-500/20 via-indigo-800/15 to-transparent',
          orb3: 'from-violet-500/15 to-transparent',
        };
      case 'magic-academy':
        return {
          orb1: 'from-purple-500/30 via-violet-600/20 to-transparent',
          orb2: 'from-cyan-400/20 via-blue-500/15 to-transparent',
          orb3: 'from-fuchsia-400/20 to-transparent',
        };
      case 'underwater-atlantis':
        return {
          orb1: 'from-sky-500/30 via-cyan-600/20 to-transparent',
          orb2: 'from-teal-400/25 via-blue-600/15 to-transparent',
          orb3: 'from-emerald-400/20 to-transparent',
        };
      case 'sunset-lofi':
        return {
          orb1: 'from-rose-400/30 via-coral-400/20 to-transparent',
          orb2: 'from-amber-400/25 via-purple-500/15 to-transparent',
          orb3: 'from-pink-500/20 to-transparent',
        };
      case 'volcano-forge':
        return {
          orb1: 'from-orange-600/35 via-red-600/25 to-transparent',
          orb2: 'from-amber-500/25 via-rose-700/15 to-transparent',
          orb3: 'from-red-500/25 to-transparent',
        };
      case 'cyberpunk-tokyo':
        return {
          orb1: 'from-pink-500/35 via-rose-600/20 to-transparent',
          orb2: 'from-cyan-400/30 via-blue-500/15 to-transparent',
          orb3: 'from-fuchsia-500/25 to-transparent',
        };
      case 'wild-west':
        return {
          orb1: 'from-orange-500/25 via-amber-600/15 to-transparent',
          orb2: 'from-yellow-500/20 via-stone-600/15 to-transparent',
          orb3: 'from-amber-400/20 to-transparent',
        };
      case 'pirate-cove':
        return {
          orb1: 'from-yellow-400/25 via-amber-500/15 to-transparent',
          orb2: 'from-cyan-500/25 via-teal-600/15 to-transparent',
          orb3: 'from-amber-300/20 to-transparent',
        };
      case 'superhero-city':
        return {
          orb1: 'from-red-500/30 via-rose-600/15 to-transparent',
          orb2: 'from-blue-600/25 via-indigo-600/15 to-transparent',
          orb3: 'from-yellow-400/20 to-transparent',
        };
      case 'fairytale-wonderland':
        return {
          orb1: 'from-purple-400/30 via-fuchsia-400/15 to-transparent',
          orb2: 'from-emerald-400/25 via-teal-300/15 to-transparent',
          orb3: 'from-pink-400/20 to-transparent',
        };
      case 'valhalla-viking':
        return {
          orb1: 'from-blue-500/30 via-cyan-600/15 to-transparent',
          orb2: 'from-amber-400/20 via-sky-600/15 to-transparent',
          orb3: 'from-indigo-400/20 to-transparent',
        };
      case 'cyber-matrix':
        return {
          orb1: 'from-emerald-500/25 via-green-500/15 to-transparent',
          orb2: 'from-cyan-500/20 via-emerald-600/10 to-transparent',
          orb3: 'from-green-400/20 to-transparent',
        };
      case 'candy-pop':
        return {
          orb1: 'from-pink-500/25 via-rose-400/15 to-transparent',
          orb2: 'from-cyan-400/25 via-sky-300/15 to-transparent',
          orb3: 'from-amber-300/20 to-transparent',
        };
      case 'kawaii-anime':
        return {
          orb1: 'from-purple-500/25 via-fuchsia-400/15 to-transparent',
          orb2: 'from-pink-400/25 via-rose-300/15 to-transparent',
          orb3: 'from-indigo-400/20 to-transparent',
        };
      case 'retro-arcade':
        return {
          orb1: 'from-rose-500/30 via-pink-600/15 to-transparent',
          orb2: 'from-amber-400/25 via-orange-500/15 to-transparent',
          orb3: 'from-violet-600/25 to-transparent',
        };
      case 'galaxy-space':
        return {
          orb1: 'from-indigo-600/30 via-purple-600/20 to-transparent',
          orb2: 'from-cyan-500/25 via-blue-500/15 to-transparent',
          orb3: 'from-violet-500/20 to-transparent',
        };
      case 'jungle-safari':
        return {
          orb1: 'from-emerald-500/25 via-teal-600/15 to-transparent',
          orb2: 'from-amber-500/20 via-yellow-500/10 to-transparent',
          orb3: 'from-green-600/20 to-transparent',
        };
      case 'coffee-overdrive':
        return {
          orb1: 'from-amber-600/25 via-orange-700/15 to-transparent',
          orb2: 'from-yellow-600/20 via-amber-800/15 to-transparent',
          orb3: 'from-orange-500/20 to-transparent',
        };
      case 'dragon-fire':
        return {
          orb1: 'from-red-600/30 via-rose-600/20 to-transparent',
          orb2: 'from-orange-500/25 via-amber-600/15 to-transparent',
          orb3: 'from-red-500/20 to-transparent',
        };
      case 'ocean':
        return {
          orb1: 'from-cyan-500/25 via-teal-500/15 to-transparent',
          orb2: 'from-blue-600/20 via-sky-500/15 to-transparent',
          orb3: 'from-emerald-400/15 to-transparent',
        };
      default:
        // climb-default / midnight / amoled / etc.
        return {
          orb1: 'from-indigo-500/20 via-purple-500/15 to-transparent',
          orb2: 'from-cyan-500/15 via-blue-600/10 to-transparent',
          orb3: 'from-violet-500/15 to-transparent',
        };
    }
  };

  const orbs = getOrbGradients();

  // Floating themed micro-particles
  const getThemeParticles = () => {
    switch (activeTheme) {
      case 'mountain-summit':
        return ['🏔️', '❄️', '🦅', '⛅', '✨', '🧗', '⭐'];
      case 'sea-beach':
        return ['🐬', '🌊', '🌴', '🫧', '☀️', '🐚', '✨'];
      case 'railway-express':
        return ['🚂', '🛤️', '🏮', '💨', '✨', '🎫', '🌄'];
      case 'jorna-waterfall':
        return ['🌊', '💧', '🌿', '✨', '🪷', '🫧', '🍃'];
      case 'neon-road':
        return ['🏎️', '⚡', '🌃', '✨', '🚦', '🔥', '★'];
      case 'anime-village':
        return ['🏡', '🌾', '🦋', '🌻', '🍃', '✨', '🏮'];
      case 'sci-fi-mecha':
        return ['🤖', '🛸', '🛰️', '⚡', '💫', '01', '💠'];
      case 'fighting-coliseum':
        return ['⚔️', '🔥', '💥', '⚡', '🥊', '✨', '👑'];
      case 'sakura-shrine':
        return ['🌸', '⛩️', '🏮', '✨', '💮', '🍃', '🕊️'];
      case 'pixel-dungeon':
        return ['🗡️', '🪙', '🗝️', '💎', '👾', '✨', '🛡️'];
      case 'steampunk-airship':
        return ['⚙️', '🎈', '🧭', '💨', '✨', '📜', '🔧'];
      case 'aurora-borealis':
        return ['🌌', '✨', '🌟', '❄️', '💫', '⭐', '🧊'];
      case 'desert-oasis':
        return ['🏜️', '🌴', '🏺', '✨', '⭐', '🌙', '💧'];
      case 'ninja-shadow':
        return ['🥷', '🌙', '🗡️', '📜', '✨', '🍃', '⚡'];
      case 'magic-academy':
        return ['🔮', '📖', '✨', '🌟', '🪄', '⭐', '🕯️'];
      case 'underwater-atlantis':
        return ['🧜', '🫧', '🪸', '🐠', '✨', '🐚', '🌊'];
      case 'sunset-lofi':
        return ['🌇', '☕', '🎧', '✨', '📼', '🌧️', '⭐'];
      case 'volcano-forge':
        return ['🌋', '🔨', '🔥', '⚡', '💥', '🛡️', '✨'];
      case 'cyberpunk-tokyo':
        return ['🏮', '⚡', '🍜', '🤖', '✨', '01', '💖'];
      case 'wild-west':
        return ['🤠', '🌵', '⭐', '🐎', '✨', '🪙', '🌾'];
      case 'pirate-cove':
        return ['🏴‍☠️', '🦜', '💎', '🪙', '🌊', '⚓', '✨'];
      case 'superhero-city':
        return ['🦸', '💥', '⚡', '🏙️', '✨', '⭐', '🔥'];
      case 'fairytale-wonderland':
        return ['🍄', '🧚', '✨', '🦋', '🌸', '🪄', '⭐'];
      case 'valhalla-viking':
        return ['🛡️', '⚡', '🪓', '🐺', '✨', '❄️', '🔥'];
      case 'cyber-matrix':
        return ['01', '&&', '1337', '</>', '0xFF', '✓', '||'];
      case 'candy-pop':
        return ['🍬', '🫧', '✨', '🍭', '⭐', '💖', '🍡'];
      case 'kawaii-anime':
        return ['🌸', '✨', '🐾', '🎀', '⭐', '💮', '🐱'];
      case 'retro-arcade':
        return ['👾', '🕹️', '⚡', '★', '💎', '👑', '🔥'];
      case 'galaxy-space':
        return ['⭐', '✨', '🚀', '🛸', '🪐', '💫', '🌟'];
      case 'coffee-overdrive':
        return ['☕', '🥐', '✨', '💡', '⚡', '🔥'];
      case 'dragon-fire':
        return ['🔥', '⚡', '💥', '⚔️', '✨', '👑'];
      default:
        return ['✨', '⚡', '🏔️', '🚀', '💡', '🎯'];
    }
  };

  const particles = getThemeParticles();

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none select-none overflow-hidden -z-10 transition-colors duration-500"
    >
      {/* 1. Large Ambient Glowing Blurred Orbs */}
      <div
        className={`absolute -top-32 -left-32 w-96 h-96 sm:w-[500px] sm:h-[500px] rounded-full bg-gradient-to-br ${orbs.orb1} blur-3xl opacity-75 transform-gpu animate-levitate`}
      />
      <div
        className={`absolute top-1/3 -right-32 w-80 h-80 sm:w-[450px] sm:h-[450px] rounded-full bg-gradient-to-bl ${orbs.orb2} blur-3xl opacity-60 transform-gpu animate-pulse-glow`}
      />
      <div
        className={`absolute -bottom-32 left-1/4 w-96 h-96 sm:w-[550px] sm:h-[550px] rounded-full bg-gradient-to-tr ${orbs.orb3} blur-3xl opacity-50 transform-gpu animate-levitate`}
      />

      {/* 2. Delicate Themed Floating Micro-Particles */}
      <div className="absolute inset-0 opacity-25 dark:opacity-30 overflow-hidden">
        {particles.map((p, i) => (
          <span
            key={i}
            className="absolute text-sm sm:text-base animate-levitate filter drop-shadow-xs select-none"
            style={{
              top: `${(i * 13 + 7) % 92}%`,
              left: `${(i * 17 + 5) % 95}%`,
              animationDelay: `${i * 0.6}s`,
              animationDuration: `${4 + (i % 3)}s`,
            }}
          >
            {p}
          </span>
        ))}
      </div>

      {/* ================================================================= */}
      {/* 3. DEDICATED CARTOON & ANIME SCENE ANIMATION LAYERS               */}
      {/* ================================================================= */}

      {/* 🏔️ MOUNTAIN SUMMIT: Parallax alpine mountain ridges & 14 falling snowflakes */}
      {activeTheme === 'mountain-summit' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute bottom-0 inset-x-0 h-72 opacity-25 dark:opacity-20 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 1200 300" preserveAspectRatio="none">
              <polygon points="0,300 200,120 450,220 700,90 950,200 1200,140 1200,300" fill="#38bdf8" opacity="0.4" />
              <polygon points="0,300 150,170 350,250 550,140 800,240 1050,160 1200,230 1200,300" fill="#0284c7" opacity="0.5" />
              <polygon points="200,120 170,150 230,150" fill="#ffffff" opacity="0.8" />
              <polygon points="700,90 660,130 740,130" fill="#ffffff" opacity="0.8" />
            </svg>
          </div>
          {/* Drifting Snowflakes */}
          {[...Array(14)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-snow-drift select-none text-white opacity-85"
              style={{
                left: `${(i * 7.2 + 3) % 96}%`,
                top: '-20px',
                fontSize: `${11 + (i % 3) * 4}px`,
                animationDelay: `${i * 0.55}s`,
                animationDuration: `${6.5 + (i % 4)}s`,
                filter: 'drop-shadow(0 0 5px #38bdf8)',
              }}
            >
              ❄
            </div>
          ))}
        </div>
      )}

      {/* ⛩️ SAKURA SHRINE: Torii silhouette & 12 fluttering cherry blossom petals */}
      {activeTheme === 'sakura-shrine' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute bottom-0 right-6 sm:right-16 w-36 sm:w-48 h-40 sm:h-52 opacity-25">
            <svg viewBox="0 0 160 180" fill="#f43f5e">
              <rect x="20" y="24" width="120" height="10" rx="3" />
              <path d="M10 18Q80 8 150 18L148 26Q80 16 12 26Z" />
              <rect x="30" y="34" width="100" height="6" />
              <rect x="36" y="24" width="12" height="156" rx="2" />
              <rect x="112" y="24" width="12" height="156" rx="2" />
            </svg>
          </div>
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-sakura-drift text-pink-400 select-none opacity-85"
              style={{
                left: `${(i * 8.5 + 4) % 96}%`,
                top: '-20px',
                animationDelay: `${i * 0.7}s`,
                animationDuration: `${7 + (i % 5)}s`,
              }}
            >
              <svg width={14 + (i % 3) * 4} height={14 + (i % 3) * 4} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C12 2 15 7 15 11C15 14.5 13 17 12 17C11 17 9 14.5 9 11C9 7 12 2 12 2Z" />
                <path d="M12 17C12 17 17 15 18 13C19 11 17 8 15 8" opacity="0.6" />
              </svg>
            </div>
          ))}
        </div>
      )}

      {/* 👾 CYBER MATRIX: Cascading green code rain & phosphor scanlines */}
      {activeTheme === 'cyber-matrix' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden font-mono text-emerald-400 select-none opacity-45">
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(rgba(16, 185, 129, 0.25) 1px, transparent 1px)',
              backgroundSize: '100% 4px',
            }}
          />
          {['100101', '0xFF4A', '1337', '<CODE>', '&&010', 'AC_1600', '01101', 'DP[i][j]', 'O(1)', 'BIN_SEARCH', '0b1101', 'MOD_1E9'].map((code, i) => (
            <div
              key={i}
              className="absolute animate-matrix-rain text-xs tracking-widest font-black"
              style={{
                left: `${(i * 8.5 + 3) % 95}%`,
                top: '-40px',
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${4.2 + (i % 3) * 1.2}s`,
                textShadow: '0 0 10px rgba(52, 211, 153, 0.9)',
              }}
            >
              {code.split('').map((c, j) => (
                <div key={j} className="leading-tight">{c}</div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* 🚀 GALAXY SPACE: Cosmic shooting stars & vibrant nebula clouds */}
      {activeTheme === 'galaxy-space' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[0, 1, 2, 3].map((s) => (
            <div
              key={s}
              className="absolute animate-shooting-star"
              style={{
                top: `${14 + s * 22}%`,
                right: `${12 + s * 20}%`,
                animationDelay: `${s * 2}s`,
                animationDuration: `${4.5 + s * 1.5}s`,
              }}
            >
              <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-cyan-300 to-white rounded-full shadow-[0_0_12px_#38bdf8]" />
            </div>
          ))}
          <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-fuchsia-600/15 blur-3xl animate-pulse-glow" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-cyan-500/15 blur-3xl animate-levitate" />
        </div>
      )}

      {/* 🏎️ NEON ROAD: Glowing retro horizon sun & scrolling synthwave highway */}
      {activeTheme === 'neon-road' && (
        <div className="absolute bottom-0 inset-x-0 h-80 pointer-events-none overflow-hidden">
          <div className="absolute bottom-28 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-gradient-to-t from-pink-500 via-rose-500 to-amber-400 opacity-60 blur-xs shadow-[0_0_60px_rgba(244,63,94,0.65)]">
            <div
              className="w-full h-full rounded-full"
              style={{
                backgroundImage: 'repeating-linear-gradient(180deg, transparent 0px, transparent 6px, rgba(15, 23, 42, 0.95) 6px, rgba(15, 23, 42, 0.95) 10px)',
              }}
            />
          </div>
          <div
            className="absolute bottom-0 inset-x-0 h-48 animate-synthwave-grid"
            style={{
              backgroundImage:
                'linear-gradient(rgba(244, 63, 94, 0.5) 2px, transparent 2px), linear-gradient(90deg, rgba(6, 182, 212, 0.5) 2px, transparent 2px)',
              backgroundSize: '48px 48px',
              transform: 'perspective(220px) rotateX(68deg)',
              transformOrigin: 'bottom center',
            }}
          />
        </div>
      )}

      {/* 🏖️ SEA BEACH: Rolling turquoise ocean waves with animated surf */}
      {activeTheme === 'sea-beach' && (
        <div className="absolute bottom-0 inset-x-0 h-48 opacity-40 pointer-events-none overflow-hidden">
          <svg className="w-[125%] h-full animate-ocean-wave" viewBox="0 0 1400 180" preserveAspectRatio="none">
            <path
              d="M0,80 C350,140 700,40 1050,100 C1220,130 1350,70 1400,90 L1400,180 L0,180 Z"
              fill="#06b6d4"
              opacity="0.6"
            />
            <path
              d="M0,110 C250,60 600,150 950,90 C1180,60 1300,120 1400,105 L1400,180 L0,180 Z"
              fill="#0891b2"
              opacity="0.8"
            />
          </svg>
        </div>
      )}

      {/* 🌌 AURORA BOREALIS: Emerald and violet northern lights curtains */}
      {activeTheme === 'aurora-borealis' && (
        <div className="absolute top-0 inset-x-0 h-96 pointer-events-none overflow-hidden opacity-60">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/35 via-teal-400/20 to-transparent blur-3xl animate-aurora-wave" />
          <div className="absolute inset-0 bg-gradient-to-r from-teal-400/30 via-violet-500/25 to-emerald-400/30 blur-2xl animate-aurora-wave" style={{ animationDelay: '3s' }} />
        </div>
      )}

      {/* 🔮 MAGIC ACADEMY: Giant rotating arcane transmutation circle & runes */}
      {activeTheme === 'magic-academy' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center opacity-35">
          <div className="w-[450px] h-[450px] rounded-full border-2 border-purple-400/40 animate-magic-rune flex items-center justify-center shadow-[0_0_35px_rgba(168,85,247,0.3)]">
            <div className="w-[360px] h-[360px] rounded-full border border-dashed border-amber-300/40 flex items-center justify-center">
              <div className="w-[280px] h-[280px] border border-cyan-400/35 rotate-45" />
              <div className="w-[280px] h-[280px] border border-purple-300/35 rotate-12 absolute" />
            </div>
          </div>
        </div>
      )}

      {/* 🧜 UNDERWATER ATLANTIS: Sunlight caustics & rising pearlescent bubbles */}
      {activeTheme === 'underwater-atlantis' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-72 bg-gradient-to-b from-cyan-400/25 via-teal-400/10 to-transparent blur-2xl opacity-60" />
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bubble-ascend rounded-full bg-cyan-300/35 border border-cyan-200/60 shadow-[0_0_10px_rgba(6,182,212,0.6)]"
              style={{
                left: `${(i * 8.5 + 5) % 95}%`,
                width: `${10 + (i % 4) * 5}px`,
                height: `${10 + (i % 4) * 5}px`,
                animationDelay: `${i * 0.65}s`,
                animationDuration: `${7 + (i % 4)}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* 🔥 VOLCANO FORGE / DRAGON FIRE / FIGHTING COLISEUM: Rising molten embers */}
      {(activeTheme === 'volcano-forge' || activeTheme === 'dragon-fire' || activeTheme === 'fighting-coliseum') && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute bottom-0 inset-x-0 h-44 bg-gradient-to-t from-orange-600/40 via-red-600/15 to-transparent blur-2xl" />
          {[...Array(14)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-ember-rise rounded-full"
              style={{
                left: `${(i * 7.5 + 4) % 96}%`,
                bottom: '0px',
                width: `${3 + (i % 4) * 2.5}px`,
                height: `${3 + (i % 4) * 2.5}px`,
                backgroundColor: i % 2 === 0 ? '#fbbf24' : '#f97316',
                boxShadow: '0 0 10px #ea580c',
                animationDelay: `${i * 0.45}s`,
                animationDuration: `${5.5 + (i % 4)}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* 🏙️ SUPERHERO CITY: Scanning night searchlight beams & skyscraper skyline */}
      {activeTheme === 'superhero-city' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute bottom-0 left-1/4 w-36 h-[90vh] bg-gradient-to-t from-yellow-300/30 via-yellow-200/10 to-transparent blur-xl animate-searchlight-left" />
          <div className="absolute bottom-0 right-1/4 w-36 h-[90vh] bg-gradient-to-t from-cyan-300/30 via-cyan-200/10 to-transparent blur-xl animate-searchlight-right" />
          <div className="absolute bottom-0 inset-x-0 h-44 opacity-35">
            <svg className="w-full h-full" viewBox="0 0 1000 150" preserveAspectRatio="none" fill="#0f172a">
              <rect x="20" y="40" width="60" height="110" />
              <rect x="90" y="20" width="75" height="130" />
              <rect x="175" y="60" width="50" height="90" />
              <rect x="235" y="10" width="90" height="140" />
              <rect x="335" y="50" width="65" height="100" />
              <rect x="410" y="25" width="80" height="125" />
              <rect x="500" y="45" width="70" height="105" />
              <rect x="580" y="15" width="95" height="135" />
              <rect x="685" y="55" width="60" height="95" />
              <rect x="755" y="30" width="85" height="120" />
              <rect x="850" y="60" width="60" height="90" />
              <rect x="920" y="20" width="70" height="130" />
            </svg>
          </div>
        </div>
      )}

      {/* ⚙️ STEAMPUNK AIRSHIP: Dual rotating brass cogwheels */}
      {activeTheme === 'steampunk-airship' && (
        <div className="absolute bottom-10 right-10 w-72 h-72 pointer-events-none opacity-30">
          <div className="w-56 h-56 rounded-full border-4 border-dashed border-amber-500 animate-gear-spin flex items-center justify-center">
            <div className="w-40 h-40 rounded-full border-2 border-amber-600/60" />
          </div>
          <div className="w-36 h-36 rounded-full border-4 border-dashed border-yellow-500 animate-gear-spin-rev absolute -top-8 -left-8" />
        </div>
      )}

      {/* 🌇 SUNSET LOFI: Warm golden hour & rain streams sliding down window glass */}
      {activeTheme === 'sunset-lofi' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute bottom-0 inset-x-0 h-64 bg-gradient-to-t from-amber-500/25 via-rose-500/15 to-transparent blur-2xl" />
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-rain-stream w-0.5 bg-gradient-to-b from-transparent via-sky-300 to-transparent rounded-full opacity-65"
              style={{
                left: `${(i * 8.5 + 4) % 95}%`,
                top: '-50px',
                height: `${40 + (i % 4) * 20}px`,
                animationDelay: `${i * 0.22}s`,
                animationDuration: `${1.8 + (i % 3) * 0.4}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* 🧚 FAIRYTALE WONDERLAND: Floating enchanted fairy lights & glowing orbs */}
      {activeTheme === 'fairytale-wonderland' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bubble-ascend rounded-full bg-pink-300/45 shadow-[0_0_14px_#f472b6]"
              style={{
                left: `${(i * 8.2 + 3) % 96}%`,
                width: `${6 + (i % 3) * 3}px`,
                height: `${6 + (i % 3) * 3}px`,
                animationDelay: `${i * 0.65}s`,
                animationDuration: `${6.5 + (i % 4)}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* 🍬 CANDY POP & KAWAII ANIME: Floating pastel hearts & sparkle bubbles */}
      {(activeTheme === 'candy-pop' || activeTheme === 'kawaii-anime') && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bubble-ascend rounded-full bg-gradient-to-tr from-pink-400/35 to-cyan-300/35 border border-pink-200/50 shadow-[0_0_12px_rgba(244,114,182,0.4)] flex items-center justify-center text-[10px]"
              style={{
                left: `${(i * 9.5 + 5) % 95}%`,
                width: `${16 + (i % 3) * 6}px`,
                height: `${16 + (i % 3) * 6}px`,
                animationDelay: `${i * 0.8}s`,
                animationDuration: `${7.5 + (i % 4)}s`,
              }}
            >
              {i % 2 === 0 ? '💖' : '✨'}
            </div>
          ))}
        </div>
      )}

      {/* 🚂 RAILWAY EXPRESS: Train tracks & passing ties */}
      {activeTheme === 'railway-express' && (
        <div className="absolute bottom-0 inset-x-0 h-36 opacity-30 dark:opacity-25 pointer-events-none">
          <div className="w-full border-b-2 border-amber-500/40 absolute bottom-12" />
          <div className="w-full border-b-2 border-amber-500/30 absolute bottom-8" />
          <div
            className="absolute bottom-8 left-0 right-0 h-4"
            style={{
              backgroundImage: 'repeating-linear-gradient(90deg, rgba(245,158,11,0.5) 0px, rgba(245,158,11,0.5) 3px, transparent 3px, transparent 24px)',
            }}
          />
        </div>
      )}

      {/* 🌊 JORNA WATERFALL: Cascading waterfall mist */}
      {activeTheme === 'jorna-waterfall' && (
        <div className="absolute top-0 right-10 w-48 h-full opacity-25 pointer-events-none overflow-hidden">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: 'repeating-linear-gradient(180deg, rgba(16,185,129,0.4) 0px, rgba(16,185,129,0.4) 14px, transparent 14px, transparent 36px)',
              animation: 'spin 12s linear infinite',
            }}
          />
        </div>
      )}

      {/* 🏡 ANIME VILLAGE: Gentle pastoral rolling hills */}
      {activeTheme === 'anime-village' && (
        <div className="absolute bottom-0 inset-x-0 h-56 opacity-25 dark:opacity-20 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 1200 200" preserveAspectRatio="none">
            <path d="M0,120 Q300,50 600,100 T1200,80 L1200,200 L0,200 Z" fill="#84cc16" opacity="0.6" />
            <path d="M0,150 Q450,90 900,130 T1200,120 L1200,200 L0,200 Z" fill="#4d7c0f" opacity="0.8" />
          </svg>
        </div>
      )}

      {/* 🤖 SCI-FI MECHA: Cyber HUD telemetry circles */}
      {activeTheme === 'sci-fi-mecha' && (
        <div className="absolute top-24 right-24 w-80 h-80 rounded-full border border-cyan-500/25 opacity-35 flex items-center justify-center animate-spin-slow">
          <div className="w-64 h-64 rounded-full border border-dashed border-cyan-400/35 flex items-center justify-center">
            <div className="w-48 h-48 rounded-full border border-cyan-300/25" />
          </div>
        </div>
      )}

      {/* 🗡️ PIXEL DUNGEON: 8-Bit dungeon grid */}
      {activeTheme === 'pixel-dungeon' && (
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(250, 204, 21, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(250, 204, 21, 0.3) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
      )}

      {/* 🕹️ RETRO ARCADE: Scrolling arcade grid */}
      {activeTheme === 'retro-arcade' && (
        <div
          className="absolute bottom-0 left-0 right-0 h-64 opacity-25 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(244, 63, 94, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(244, 63, 94, 0.4) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            transform: 'perspective(300px) rotateX(60deg)',
            transformOrigin: 'bottom center',
          }}
        />
      )}
    </div>
  );
};
