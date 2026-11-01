import React, { useState, useEffect, useRef } from 'react';
import {
  InformationStatusIcon as Volume2,
  InformationStatusIcon as VolumeX,
  ForwardIcon as ArrowRight,
  SuggestOptimizationIcon as Zap,
  AISparkleIcon as Sparkles,
  DownloadIcon as Download,
  TerminalIcon as Terminal,
  ShieldIcon as Shield,
  CodingBracketsIcon as Code2,
  CheckCircleIcon as CheckCircle2,
} from './icons';

interface AppSplashScreenProps {
  onFinish: () => void;
  isFirstTimeDownload?: boolean;
  canSkip?: boolean;
}

export const AppSplashScreen: React.FC<AppSplashScreenProps> = ({
  onFinish,
  isFirstTimeDownload = false,
  canSkip = true,
}) => {
  const [progress, setProgress] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [videoLoaded, setVideoLoaded] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<boolean>(false);
  const [isExiting, setIsExiting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Initializing Climb 1600 System...');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const progressIntervalRef = useRef<any>(null);

  // Status message sequence based on progress
  useEffect(() => {
    if (progress < 15) {
      setStatusMessage('INITIALIZING CLIMB 1600 RUNTIME...');
    } else if (progress < 35) {
      setStatusMessage('CALIBRATING 800-1600 RATING PROGRESSION MATRIX...');
    } else if (progress < 55) {
      setStatusMessage('SYNCHRONIZING CURRICULUM & CODEFORCES CATALOG...');
    } else if (progress < 75) {
      setStatusMessage('WARMING UP MONACO IDE & TESTCASE RUNNER...');
    } else if (progress < 90) {
      setStatusMessage('ENGAGING GUARDIAN DISTRACTION SHIELD & AI COACH...');
    } else if (progress < 99) {
      setStatusMessage('OPTIMIZING LOCAL STORAGE & OFFLINE CACHE...');
    } else {
      setStatusMessage('SYSTEM READY. PREPARE TO CLIMB!');
    }
  }, [progress]);

  // Smooth progress increment loop tied to video or fallback timer
  useEffect(() => {
    // If video is active, timeupdate updates progress.
    // In addition, an interval ensures smooth continuous increment so progress feels dynamic.
    const startTime = Date.now();
    const expectedDurationMs = 9500; // ~9.5s to match the 10s video

    progressIntervalRef.current = setInterval(() => {
      if (isExiting) return;

      const video = videoRef.current;
      if (video && !video.paused && video.duration && !isNaN(video.duration)) {
        // Video-driven progress
        const videoRatio = Math.min(video.currentTime / Math.max(video.duration - 0.3, 1), 1);
        const targetPercent = Math.min(Math.round(videoRatio * 100), 100);
        setProgress((prev) => {
          if (prev >= 100) return 100;
          return Math.max(prev, targetPercent);
        });
      } else {
        // Fallback simulated progress timer (e.g. if autoplay restricted or video stalled)
        const elapsed = Date.now() - startTime;
        const simulated = Math.min(Math.round((elapsed / expectedDurationMs) * 100), 100);
        setProgress((prev) => Math.max(prev, simulated));
      }
    }, 50);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [isExiting]);

  // When progress reaches 100%, hold briefly then auto-finish
  useEffect(() => {
    if (progress >= 100 && !isExiting) {
      const timer = setTimeout(() => {
        handleExit();
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [progress, isExiting]);

  const handleExit = () => {
    if (isExiting) return;
    setIsExiting(true);
    setTimeout(() => {
      onFinish();
    }, 650);
  };

  // Keyboard shortcut: Esc / Space / Enter to skip or enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleSound = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    } else {
      setIsMuted(!isMuted);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Climb 1600 Startup Splash Screen"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between bg-[#070a12] text-white keep-white select-none overflow-hidden transition-all duration-700 ease-out ${
        isExiting ? 'opacity-0 scale-105 filter blur-md pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Background Animated Tech Grid & Cyber Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Radial ambient gradient lights */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-indigo-600/15 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-1/4 left-1/3 -translate-x-1/2 w-[500px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 right-1/4 w-[450px] h-[350px] bg-fuchsia-600/10 rounded-full blur-[130px]" />

        {/* Cyber subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(56, 189, 248, 0.4) 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      {/* Top Header Bar */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-5 sm:pt-6 flex items-center justify-between">
        {/* Brand & Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 shadow-[0_0_15px_rgba(6,182,212,0.5)]">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm tracking-widest bg-gradient-to-r from-cyan-400 via-indigo-200 to-fuchsia-400 bg-clip-text text-transparent">
                CLIMB 1600
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-950/80 border border-indigo-700/50 text-indigo-300">
                v2.4
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide">
              {isFirstTimeDownload ? 'First Time Download Setup' : 'Zero to Specialist Training'}
            </p>
          </div>
        </div>

        {/* Controls: Audio Toggle & Skip/Enter Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={toggleSound}
            aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700/70 text-xs font-medium text-slate-300 hover:text-white transition-all cursor-pointer backdrop-blur-sm shadow-sm"
          >
            {isMuted ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] hidden sm:inline">Unmute Audio</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span className="text-[11px] text-cyan-300 hidden sm:inline">Sound Active</span>
              </>
            )}
          </button>

          {canSkip && (
            <button
              type="button"
              onClick={handleExit}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer shadow-md ${
                progress >= 100
                  ? 'bg-gradient-to-r from-cyan-500 via-indigo-600 to-fuchsia-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.6)] animate-pulse'
                  : 'bg-slate-900/80 hover:bg-slate-800 border border-slate-700/70 text-slate-300 hover:text-white'
              }`}
            >
              <span>{progress >= 100 ? 'Enter App' : 'Skip Intro'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* Center Stage: Video Showcase Frame */}
      <main className="relative z-10 w-full max-w-4xl mx-auto px-4 flex flex-col items-center justify-center my-auto">
        {/* Glow halo around video frame */}
        <div className="relative w-full max-w-2xl group">
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-500/30 via-indigo-600/40 to-fuchsia-600/30 blur-xl opacity-75 group-hover:opacity-100 transition-opacity" />

          {/* Video Container Frame */}
          <div className="relative rounded-2xl border border-cyan-500/30 bg-slate-950/90 shadow-2xl shadow-indigo-950/80 overflow-hidden aspect-video flex items-center justify-center backdrop-blur-md">
            <video
              ref={videoRef}
              src="/splash_intro.mp4"
              playsInline
              autoPlay
              muted={isMuted}
              onLoadedData={() => setVideoLoaded(true)}
              onError={() => {
                console.warn('[SplashScreen] Primary video failed, trying alternate path');
                setVideoError(true);
              }}
              onEnded={() => {
                setProgress(100);
              }}
              className="w-full h-full object-cover transition-opacity duration-500"
            />

            {/* In case video is loading or fallback */}
            {(!videoLoaded || videoError) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900 p-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center mb-4 shadow-[0_0_25px_rgba(99,102,241,0.4)]">
                  <Zap className="w-8 h-8 text-cyan-400 animate-pulse" />
                </div>
                <h2 className="text-xl font-black tracking-wide text-white mb-1">CLIMB 1600</h2>
                <p className="text-xs text-slate-400 max-w-sm">
                  From Zero to Specialist • Structured Daily Missions
                </p>
              </div>
            )}

            {/* Subtle cyber scanlines overlay for enhanced high-tech sci-fi vibe */}
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.06] mix-blend-overlay"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, #000, #000 2px, transparent 2px, transparent 4px)',
              }}
            />

            {/* Corner cybernetic HUD accents */}
            <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-cyan-400 pointer-events-none" />
            <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-indigo-400 pointer-events-none" />
            <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-indigo-400 pointer-events-none" />
            <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-fuchsia-400 pointer-events-none" />
          </div>
        </div>

        {/* First Time Download Banner / Welcome Tag */}
        {isFirstTimeDownload && (
          <div className="mt-4 flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs shadow-[0_0_15px_rgba(16,185,129,0.2)] animate-in fade-in duration-300">
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold">First-Time App Download Initialized</span>
            <span className="text-[10px] text-emerald-400/80">• Setting up offline workspace</span>
          </div>
        )}
      </main>

      {/* Bottom Area: Futuristic Loading Bar & Status Telemetry */}
      <footer className="relative z-10 w-full max-w-3xl mx-auto px-4 pb-8 sm:pb-10 space-y-3">
        {/* Progress Info Header */}
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-cyan-300 font-bold tracking-wider">{statusMessage}</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold text-white">
            <span className="text-cyan-400 font-mono text-sm tracking-tight">{progress}%</span>
          </div>
        </div>

        {/* THE LOADING BAR */}
        <div className="relative w-full h-3 sm:h-3.5 rounded-full bg-slate-900/90 border border-cyan-500/30 overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.25)] p-[2px]">
          {/* Animated Background Shimmer Rail */}
          <div className="absolute inset-0 bg-slate-950/80 rounded-full" />

          {/* Active Gradient Fill Bar */}
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-fuchsia-500 transition-all duration-150 ease-out relative shadow-[0_0_12px_rgba(56,189,248,0.8)]"
            style={{ width: `${Math.min(progress, 100)}%` }}
          >
            {/* Leading tip glow particle */}
            {progress > 2 && progress < 100 && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_10px_#fff]" />
            )}

            {/* High-speed light sheen animation traversing the bar */}
            <div
              className="absolute inset-0 opacity-40 bg-gradient-to-r from-transparent via-white to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]"
              style={{
                backgroundImage:
                  'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0) 100%)',
              }}
            />
          </div>
        </div>

        {/* Sub-telemetry & Guidance */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-1 text-[11px] text-slate-400 font-medium pt-1">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Code2 className="w-3 h-3 text-indigo-400" />
              <span>Monaco C++20 / Python</span>
            </span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-cyan-400" />
              <span>Guardian Shield</span>
            </span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-fuchsia-400" />
              <span>Adaptive AI Coach</span>
            </span>
          </div>

          <div className="text-[10px] text-slate-500 font-mono">
            Press <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">Space</kbd> or{' '}
            <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">Esc</kbd> to enter
          </div>
        </div>
      </footer>
    </div>
  );
};
