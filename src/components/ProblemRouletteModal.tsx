import React, { useState, useEffect, useRef } from 'react';
import { CFProblem } from '../types';
import { soundEffects } from '../utils/soundEffects';
import { gameRewardService, SpunBounty } from '../services/gameRewardService';
import { MascotClimby, FunnyStickerBadge } from './assets/MascotAndStickers';

interface ProblemRouletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProblem: (problem: CFProblem) => void;
  userRating: number;
  solvedProblemIds?: Set<string>;
}

interface WheelSegment {
  label: string;
  ratingTier: number;
  color: string;
  textColor: string;
  icon: string;
  multiplier: number;
  tags: string[];
}

const WHEEL_SEGMENTS: WheelSegment[] = [
  { label: 'Warmup 800', ratingTier: 800, color: '#10b981', textColor: '#ffffff', icon: '🍉', multiplier: 1.0, tags: ['brute force', 'math'] },
  { label: 'Speed 900', ratingTier: 900, color: '#06b6d4', textColor: '#ffffff', icon: '⚡', multiplier: 1.2, tags: ['greedy', 'implementation'] },
  { label: 'Logic 1000', ratingTier: 1000, color: '#3b82f6', textColor: '#ffffff', icon: '🧠', multiplier: 1.3, tags: ['strings', 'math'] },
  { label: 'Search 1100', ratingTier: 1100, color: '#6366f1', textColor: '#ffffff', icon: '🔍', multiplier: 1.4, tags: ['binary search', 'sortings'] },
  { label: 'Trial 1200', ratingTier: 1200, color: '#8b5cf6', textColor: '#ffffff', icon: '⚔️', multiplier: 1.5, tags: ['math', 'two pointers'] },
  { label: 'Greedy 1300', ratingTier: 1300, color: '#ec4899', textColor: '#ffffff', icon: '🍰', multiplier: 1.6, tags: ['greedy', 'constructive'] },
  { label: 'DP Cave 1400', ratingTier: 1400, color: '#f59e0b', textColor: '#ffffff', icon: '💎', multiplier: 1.8, tags: ['dp', 'data structures'] },
  { label: 'Boss 1500+', ratingTier: 1500, color: '#ef4444', textColor: '#ffffff', icon: '👑', multiplier: 2.0, tags: ['dp', 'graphs', 'number theory'] },
  { label: 'JACKPOT x3', ratingTier: 1200, color: '#eab308', textColor: '#0f172a', icon: '🌟', multiplier: 3.0, tags: ['special problem', 'math'] },
];

const PROBLEM_POOL: CFProblem[] = [
  { contestId: 4, index: 'A', name: 'Watermelon', rating: 800, tags: ['brute force', 'math'] },
  { contestId: 71, index: 'A', name: 'Way Too Long Words', rating: 800, tags: ['strings'] },
  { contestId: 231, index: 'A', name: 'Team', rating: 800, tags: ['brute force', 'greedy'] },
  { contestId: 158, index: 'A', name: 'Next Round', rating: 800, tags: ['special problem'] },
  { contestId: 282, index: 'A', name: 'Bit++', rating: 800, tags: ['implementation'] },
  { contestId: 112, index: 'A', name: 'Petya and Strings', rating: 800, tags: ['strings'] },
  { contestId: 339, index: 'A', name: 'Helpful Maths', rating: 800, tags: ['greedy', 'sortings'] },
  { contestId: 266, index: 'A', name: 'Stones on the Table', rating: 800, tags: ['implementation'] },
  { contestId: 546, index: 'A', name: 'Soldier and Bananas', rating: 800, tags: ['math'] },
  { contestId: 977, index: 'A', name: 'Wrong Subtraction', rating: 800, tags: ['implementation'] },
  { contestId: 1328, index: 'A', name: 'Divisibility Problem', rating: 800, tags: ['math'] },
  { contestId: 69, index: 'A', name: 'Young Physicist', rating: 1000, tags: ['math'] },
  { contestId: 58, index: 'A', name: 'Chat room', rating: 1000, tags: ['greedy', 'strings'] },
  { contestId: 118, index: 'A', name: 'String Task', rating: 1000, tags: ['strings'] },
  { contestId: 122, index: 'A', name: 'Lucky Division', rating: 1000, tags: ['brute force'] },
  { contestId: 479, index: 'A', name: 'Expression', rating: 1000, tags: ['brute force', 'math'] },
  { contestId: 1335, index: 'C', name: 'Two Teams Composing', rating: 1100, tags: ['binary search', 'sortings'] },
  { contestId: 1352, index: 'C', name: 'K-th Not Divisible by n', rating: 1200, tags: ['binary search', 'math'] },
  { contestId: 1352, index: 'D', name: 'Alice, Bob and Candies', rating: 1300, tags: ['greedy', 'implementation'] },
  { contestId: 230, index: 'B', name: 'T-primes', rating: 1300, tags: ['binary search', 'math', 'number theory'] },
  { contestId: 189, index: 'A', name: 'Cut Ribbon', rating: 1300, tags: ['dp'] },
  { contestId: 455, index: 'A', name: 'Boredom', rating: 1500, tags: ['dp'] },
  { contestId: 1360, index: 'E', name: 'Polygon', rating: 1300, tags: ['constructive algorithms'] },
  { contestId: 1360, index: 'F', name: 'Spy-string', rating: 1400, tags: ['brute force', 'dp', 'strings'] },
  { contestId: 1363, index: 'B', name: 'Subsequence Hate', rating: 1300, tags: ['strings'] },
  { contestId: 1363, index: 'C', name: 'Game On Leaves', rating: 1500, tags: ['games', 'trees'] },
];

export const ProblemRouletteModal: React.FC<ProblemRouletteModalProps> = ({
  isOpen,
  onClose,
  onSelectProblem,
  userRating,
  solvedProblemIds = new Set(),
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [currentRotation, setCurrentRotation] = useState(0);
  const [landedSegment, setLandedSegment] = useState<WheelSegment | null>(null);
  const [spunProblem, setSpunProblem] = useState<CFProblem | null>(null);
  const [activeBounty, setActiveBounty] = useState<SpunBounty | null>(() => gameRewardService.getActiveSpunBounty());
  const [claimedNotice, setClaimedNotice] = useState<string | null>(null);
  const [bountySolved, setBountySolved] = useState<boolean>(false);
  const [ratingFilter, setRatingFilter] = useState<'all' | 'novice' | 'intermediate' | 'expert'>('all');

  const animFrameRef = useRef<number | null>(null);
  const lastTickAngleRef = useRef<number>(0);

  // Sync active bounty on open
  useEffect(() => {
    if (isOpen) {
      const bounty = gameRewardService.getActiveSpunBounty();
      setActiveBounty(bounty);
      if (bounty) {
        setSpunProblem(bounty.problem);
        // Check if user solved it
        const probId = `${bounty.problem.contestId}${bounty.problem.index}`;
        if (solvedProblemIds.has(probId)) {
          setBountySolved(true);
        }
      }
    }
  }, [isOpen, solvedProblemIds]);

  // Subscribe to game rewards service
  useEffect(() => {
    return gameRewardService.subscribe(() => {
      setActiveBounty(gameRewardService.getActiveSpunBounty());
    });
  }, []);

  // Draw the spinning wheel canvas
  const drawWheel = (rotation: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 15;
    const numSegments = WHEEL_SEGMENTS.length;
    const arc = (2 * Math.PI) / numSegments;

    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);

    // Draw slices
    for (let i = 0; i < numSegments; i++) {
      const seg = WHEEL_SEGMENTS[i];
      const startAngle = i * arc;
      const endAngle = startAngle + arc;

      // Slice
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = seg.color;
      ctx.fill();

      // Border line
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Text & Icon
      ctx.save();
      ctx.rotate(startAngle + arc / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = seg.textColor;
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      ctx.fillText(`${seg.icon} ${seg.label}`, radius - 20, 5);
      ctx.restore();
    }

    // Outer rim lights / studs
    ctx.beginPath();
    ctx.arc(0, 0, radius + 5, 0, 2 * Math.PI);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#facc15';
    ctx.stroke();

    for (let i = 0; i < numSegments * 2; i++) {
      const studAngle = (i * Math.PI) / numSegments;
      const sx = (radius + 5) * Math.cos(studAngle);
      const sy = (radius + 5) * Math.sin(studAngle);
      ctx.beginPath();
      ctx.arc(sx, sy, 3, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }

    ctx.restore();

    // Center Hub (Fixed metallic button)
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.beginPath();
    ctx.arc(0, 0, 32, 0, 2 * Math.PI);
    const grad = ctx.createRadialGradient(0, 0, 5, 0, 0, 32);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.5, '#4f46e5');
    grad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#fbbf24';
    ctx.stroke();

    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎯', 0, 0);
    ctx.restore();
  };

  useEffect(() => {
    drawWheel(currentRotation);
  }, [currentRotation, isOpen]);

  // Spin animation with realistic physics deceleration
  const handleSpin = () => {
    if (spinning) return;
    setSpinning(true);
    setLandedSegment(null);
    setClaimedNotice(null);

    soundEffects.playDiceRoll();

    // Total rotations: between 5 and 9 full spins + random offset
    const randomOffset = Math.random() * 2 * Math.PI;
    const spinTarget = currentRotation + (5 + Math.random() * 4) * (2 * Math.PI) + randomOffset;
    const duration = 4000; // 4 seconds
    const startAngle = currentRotation;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Quartic ease-out curve for dramatic spin deceleration
      const easeOut = 1 - Math.pow(1 - progress, 4);
      const angle = startAngle + (spinTarget - startAngle) * easeOut;
      setCurrentRotation(angle);

      // Audio click sound when passing segment boundaries
      const numSegments = WHEEL_SEGMENTS.length;
      const segmentAngle = (2 * Math.PI) / numSegments;
      if (Math.abs(angle - lastTickAngleRef.current) >= segmentAngle * 0.7) {
        soundEffects.playRouletteTick(1 + (1 - progress) * 0.8);
        lastTickAngleRef.current = angle;
      }

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        // Spin finished! Determine winning slice
        setSpinning(false);
        soundEffects.playVictory();

        // Calculate segment under the top pointer (at 3*PI/2 or -PI/2)
        const normalized = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        // Top pointer is at angle 3*PI/2
        const pointerAngle = (3 * Math.PI) / 2;
        const relativeAngle = ((pointerAngle - normalized) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
        const index = Math.floor(relativeAngle / segmentAngle) % numSegments;
        const winner = WHEEL_SEGMENTS[index];
        setLandedSegment(winner);

        // Pick problem matching segment criteria or random pool
        let candidatePool = PROBLEM_POOL.filter((p) => {
          if (winner.ratingTier >= 1500) return p.rating >= 1400;
          if (winner.ratingTier <= 800) return p.rating <= 900;
          return Math.abs(p.rating - winner.ratingTier) <= 200;
        });
        if (candidatePool.length === 0) candidatePool = PROBLEM_POOL;

        const picked = candidatePool[Math.floor(Math.random() * candidatePool.length)];
        setSpunProblem(picked);
      }
    };

    animFrameRef.current = requestAnimationFrame(step);
  };

  const handleAcceptBounty = () => {
    if (!spunProblem) return;
    soundEffects.playPop();

    const mult = landedSegment?.multiplier || 1.2;
    const baseCoins = Math.round(spunProblem.rating * 0.35 * mult);
    const bounty: SpunBounty = {
      id: `bounty_${Date.now()}`,
      problem: {
        contestId: spunProblem.contestId || 0,
        index: spunProblem.index || 'A',
        name: spunProblem.name,
        rating: spunProblem.rating || 800,
        tags: spunProblem.tags || [],
      },
      rewardCoins: baseCoins,
      giftChest: {
        title: `${spunProblem.name} Mystery Chest`,
        rarity: (spunProblem.rating || 800) >= 1400 ? 'legendary' : (spunProblem.rating || 800) >= 1100 ? 'epic' : 'rare',
        icon: landedSegment?.icon || '🎁',
      },
      spunAt: new Date().toISOString(),
      multiplier: mult,
      isSolved: false,
      isClaimed: false,
    };

    gameRewardService.setSpunBounty(bounty);
    setActiveBounty(bounty);
    onSelectProblem(spunProblem);
    onClose();
  };

  const handleClaimReward = () => {
    if (!activeBounty) return;
    soundEffects.playVictory();

    const res = gameRewardService.claimSpunBountyReward(activeBounty.id);
    if (res) {
      setClaimedNotice(`🎉 Claimed +${res.coinsAwarded} Coins & "${res.giftAwarded.title}"! Added to your inventory!`);
      setActiveBounty(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl border-2 border-indigo-400/40 bg-slate-900 p-6 sm:p-8 shadow-2xl space-y-6 text-center overflow-hidden my-auto">
        {/* Glow Auras */}
        <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full bg-pink-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />

        {/* Modal Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-800/80 text-slate-400 hover:text-white flex items-center justify-center font-bold text-lg cursor-pointer transition-all hover:bg-slate-700 active:scale-95 z-20"
        >
          ✕
        </button>

        {/* Header */}
        <div className="space-y-1.5 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-purple-500/20 text-amber-300 border border-amber-400/30">
            <span>🎡 WHEEL OF DESTINY</span>
            <span>•</span>
            <span>BOUNTY & GIFTS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Spin For Your Next Challenge!
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
            Spin the wheel, conquer the mystery algorithm problem, and claim massive coins and rare treasure chests!
          </p>
        </div>

        {/* Claimed Notice Alert */}
        {claimedNotice && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black animate-bounce-subtle">
            {claimedNotice}
          </div>
        )}

        {/* Wheel & Visual Spinner Canvas Area */}
        <div className="relative flex flex-col items-center justify-center py-2">
          {/* Top Pointer Flapper */}
          <div className="absolute top-0 z-20 flex flex-col items-center pointer-events-none">
            <div className="w-6 h-8 bg-gradient-to-b from-yellow-300 to-amber-500 clip-pointer shadow-lg filter drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
                 style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }} />
          </div>

          <div className="relative p-2 rounded-full bg-slate-800/50 border border-white/10 shadow-inner">
            <canvas
              ref={canvasRef}
              width={340}
              height={340}
              className="rounded-full shadow-2xl transition-transform"
            />
          </div>

          {/* Spin Trigger Button */}
          <div className="mt-4">
            <button
              type="button"
              disabled={spinning}
              onClick={handleSpin}
              className={`px-8 py-3.5 rounded-2xl font-black text-base sm:text-lg shadow-xl tracking-wide transition-all cursor-pointer ${
                spinning
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed scale-95'
                  : 'bg-gradient-to-r from-amber-400 via-pink-500 to-indigo-600 hover:from-amber-300 hover:to-indigo-500 text-white shadow-amber-500/30 hover:scale-105 active:scale-95 animate-pulse'
              }`}
            >
              {spinning ? '🌀 Spinning Wheel...' : '🎲 SPIN THE WHEEL!'}
            </button>
          </div>
        </div>

        {/* Landed / Spun Problem Bounty Card */}
        {spunProblem && !spinning && (
          <div className="p-5 rounded-2xl border-2 border-indigo-500/50 bg-indigo-950/40 backdrop-blur-md space-y-4 text-left animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>{landedSegment?.icon || '🎯'}</span>
                <span>{landedSegment?.label || 'Mystery Challenge'}</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500 text-white font-black text-xs">
                Rating {spunProblem.rating}
              </span>
            </div>

            <div className="space-y-1">
              <h4 className="text-lg font-black text-white">
                {spunProblem.contestId}{spunProblem.index}. {spunProblem.name}
              </h4>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {spunProblem.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-semibold"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            {/* Bounty Prize Showcase */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-amber-400/30 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-black text-slate-400">Completion Bounty Reward</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-sm font-black text-amber-400">
                    <span>🪙</span>
                    <span>+{Math.round(spunProblem.rating * 0.35 * (landedSegment?.multiplier || 1.2))} Coins</span>
                  </span>
                  <span className="flex items-center gap-1 text-xs font-bold text-cyan-300">
                    <span>🎁</span>
                    <span>{landedSegment?.multiplier && landedSegment.multiplier >= 2 ? 'Mythic Chest' : 'Algorithm Chest'}</span>
                  </span>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-black">
                {landedSegment?.multiplier || 1.2}x Bounty
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleAcceptBounty}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-500/25 active:scale-95 transition-all text-center cursor-pointer"
              >
                ⚔️ Accept Bounty & Solve Now →
              </button>

              <button
                type="button"
                onClick={handleSpin}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Re-spin
              </button>
            </div>
          </div>
        )}

        {/* In-Progress Bounty Tracker if already active */}
        {activeBounty && !spunProblem && (
          <div className="p-4 rounded-2xl border border-amber-400/40 bg-amber-500/10 text-left space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-400">
                ⭐ ACTIVE SPUN BOUNTY IN PROGRESS
              </span>
              <span className="text-xs font-mono font-bold text-slate-400">
                Reward: +{activeBounty.rewardCoins} Coins
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-extrabold text-white text-sm">
                  {activeBounty.problem.contestId}{activeBounty.problem.index}. {activeBounty.problem.name}
                </h5>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Rating {activeBounty.problem.rating} • {activeBounty.giftChest.title}
                </p>
              </div>

              {bountySolved || solvedProblemIds.has(`${activeBounty.problem.contestId}${activeBounty.problem.index}`) ? (
                <button
                  type="button"
                  onClick={handleClaimReward}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs shadow-lg animate-bounce-subtle cursor-pointer"
                >
                  🎉 Claim Reward!
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onSelectProblem(activeBounty.problem);
                    onClose();
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer transition-colors"
                >
                  Continue Code →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
