import fs from 'fs';
import path from 'path';

const files: Record<string, string> = {
  'learning-study.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" fill="none">
  <defs>
    <linearGradient id="learnBg" x1="0" y1="0" x2="400" y2="240" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#1e1b4b" stop-opacity="0.8" /><stop offset="100%" stop-color="#0f172a" stop-opacity="0.9" />
    </linearGradient>
    <linearGradient id="lampGrad" x1="320" y1="40" x2="260" y2="180" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#fef08a" stop-opacity="0.6" /><stop offset="100%" stop-color="#f59e0b" stop-opacity="0" />
    </linearGradient>
  </defs>
  <rect width="400" height="240" rx="16" fill="url(#learnBg)" />
  <path d="M330 30L300 70H340L330 30Z" fill="#f59e0b" />
  <path d="M330 70V170H340" stroke="#94a3b8" stroke-width="2.5" />
  <polygon points="300,70 340,70 380,180 240,180" fill="url(#lampGrad)" />
  <path d="M30 180H370L360 210H40L30 180Z" fill="#1e293b" stroke="#334155" stroke-width="1.5" />
  <rect x="65" y="162" width="45" height="6" rx="2" fill="#ec4899" />
  <rect x="62" y="168" width="50" height="6" rx="2" fill="#06b6d4" />
  <rect x="60" y="174" width="54" height="6" rx="2" fill="#6366f1" />
  <polygon points="175,178 245,178 250,182 170,182" fill="#94a3b8" />
  <rect x="180" y="132" width="60" height="42" rx="3" fill="#0f172a" stroke="#38bdf8" stroke-width="1.5" />
  <rect x="184" y="136" width="52" height="34" rx="2" fill="#0284c7" opacity="0.8" />
  <line x1="188" y1="144" x2="210" y2="144" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" />
  <line x1="194" y1="150" x2="226" y2="150" stroke="#fef08a" stroke-width="1.5" stroke-linecap="round" />
  <g transform="translate(130, 95)">
    <circle cx="28" cy="22" r="14" fill="#fcd34d" />
    <path d="M16 16C16 10 24 6 36 10C42 14 40 22 40 22L16 16Z" fill="#1e1b4b" />
    <path d="M14 18C14 8 42 8 42 18" stroke="#06b6d4" stroke-width="3" fill="none" />
    <rect x="12" y="16" width="5" height="12" rx="2" fill="#06b6d4" />
    <rect x="39" y="16" width="5" height="12" rx="2" fill="#06b6d4" />
    <path d="M10 40C10 32 46 32 46 40L48 85H8L10 40Z" fill="#4f46e5" />
    <path d="M38 52L58 72H72" stroke="#6366f1" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" />
  </g>
</svg>`,

  'coding-practice.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" fill="none">
  <defs>
    <linearGradient id="codeBg" x1="0" y1="0" x2="400" y2="240" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0b0f19" /><stop offset="50%" stop-color="#0d1b33" /><stop offset="100%" stop-color="#081426" />
    </linearGradient>
    <linearGradient id="neonCyanPurple" x1="50" y1="50" x2="350" y2="200" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#06b6d4" /><stop offset="50%" stop-color="#6366f1" /><stop offset="100%" stop-color="#ec4899" />
    </linearGradient>
  </defs>
  <rect width="400" height="240" rx="16" fill="url(#codeBg)" />
  <g transform="translate(45, 30)">
    <rect width="310" height="175" rx="10" fill="#111827" stroke="url(#neonCyanPurple)" stroke-width="1.5" />
    <path d="M0 10C0 4.477 4.477 0 10 0H300C305.523 0 310 4.477 310 10V28H0V10Z" fill="#1e293b" />
    <circle cx="16" cy="14" r="4" fill="#ef4444" />
    <circle cx="28" cy="14" r="4" fill="#f59e0b" />
    <circle cx="40" cy="14" r="4" fill="#10b981" />
    <text x="60" y="18" fill="#94a3b8" font-family="monospace" font-size="10">main.cpp — CLIMB 1600 IDE</text>
    <g transform="translate(18, 44)" font-family="monospace" font-size="10">
      <text x="0" y="0" fill="#ec4899">#include &lt;iostream&gt;</text>
      <text x="0" y="16" fill="#38bdf8">using namespace std;</text>
      <text x="0" y="36" fill="#f59e0b">int solve() {</text>
      <text x="16" y="52" fill="#a7f3d0">int n, k; cin &gt;&gt; n &gt;&gt; k;</text>
      <text x="16" y="68" fill="#c084fc">vector&lt;long long&gt; dp(n + 1);</text>
      <text x="16" y="84" fill="#38bdf8">return ans;</text>
      <text x="0" y="100" fill="#f59e0b">}</text>
    </g>
  </g>
</svg>`,

  'contest-arena.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" fill="none">
  <defs>
    <linearGradient id="arenaBg" x1="0" y1="0" x2="400" y2="240" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#110b24" /><stop offset="50%" stop-color="#1e1035" /><stop offset="100%" stop-color="#080c18" />
    </linearGradient>
    <linearGradient id="trophyGold" x1="170" y1="40" x2="230" y2="120" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#fef08a" /><stop offset="50%" stop-color="#f59e0b" /><stop offset="100%" stop-color="#b45309" />
    </linearGradient>
  </defs>
  <rect width="400" height="240" rx="16" fill="url(#arenaBg)" />
  <g transform="translate(130, 20)">
    <rect width="140" height="34" rx="17" fill="#0f172a" stroke="#06b6d4" stroke-width="2" />
    <circle cx="20" cy="17" r="5" fill="#ef4444" />
    <text x="78" y="23" text-anchor="middle" fill="#f8fafc" font-family="monospace" font-size="14" font-weight="bold">01:45:28</text>
  </g>
  <g transform="translate(165, 75)">
    <path d="M20 10H50V35C50 48 35 55 35 55C35 55 20 48 20 35V10Z" fill="url(#trophyGold)" />
    <path d="M20 18H10C6 18 6 32 18 32H20" stroke="#facc15" stroke-width="2.5" fill="none" />
    <path d="M50 18H60C64 18 64 32 52 32H50" stroke="#facc15" stroke-width="2.5" fill="none" />
    <rect x="31" y="55" width="8" height="15" fill="#ca8a04" />
    <rect x="22" y="70" width="26" height="8" rx="2" fill="#854d0e" />
    <circle cx="35" cy="30" r="6" fill="#fef08a" />
  </g>
  <g transform="translate(50, 110)">
    <rect width="80" height="60" rx="6" fill="#1e293b" stroke="#06b6d4" stroke-width="2" />
    <rect x="6" y="6" width="68" height="42" rx="3" fill="#0f172a" />
  </g>
  <g transform="translate(270, 110)">
    <rect width="80" height="60" rx="6" fill="#1e293b" stroke="#ec4899" stroke-width="2" />
    <rect x="6" y="6" width="68" height="42" rx="3" fill="#0f172a" />
  </g>
</svg>`,

  'focus-discipline.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" fill="none">
  <defs>
    <linearGradient id="focusBg" x1="0" y1="0" x2="400" y2="240" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#07191e" /><stop offset="50%" stop-color="#0b292e" /><stop offset="100%" stop-color="#07131b" />
    </linearGradient>
    <linearGradient id="zenRings" x1="120" y1="40" x2="280" y2="200" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#06b6d4" /><stop offset="50%" stop-color="#10b981" /><stop offset="100%" stop-color="#6366f1" />
    </linearGradient>
  </defs>
  <rect width="400" height="240" rx="16" fill="url(#focusBg)" />
  <circle cx="200" cy="120" r="90" stroke="url(#zenRings)" stroke-width="1.5" stroke-dasharray="4 6" opacity="0.3" />
  <circle cx="200" cy="120" r="65" stroke="url(#zenRings)" stroke-width="2" stroke-dasharray="8 4" opacity="0.5" />
  <circle cx="200" cy="120" r="40" stroke="url(#zenRings)" stroke-width="2" opacity="0.7" />
  <g transform="translate(180, 85)">
    <circle cx="20" cy="20" r="14" fill="#14b8a6" />
    <circle cx="20" cy="20" r="8" fill="#ffffff" />
    <path d="M5 44C5 34 35 34 35 44L40 75H0L5 44Z" fill="#0f766e" />
    <ellipse cx="20" cy="78" rx="35" ry="10" fill="#064e3b" />
  </g>
</svg>`,

  'progress-growth.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" fill="none">
  <defs>
    <linearGradient id="growBg" x1="0" y1="0" x2="400" y2="240" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0b0f19" /><stop offset="60%" stop-color="#141738" /><stop offset="100%" stop-color="#091829" />
    </linearGradient>
    <linearGradient id="arrowGrad" x1="60" y1="180" x2="340" y2="50" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#06b6d4" /><stop offset="50%" stop-color="#6366f1" /><stop offset="100%" stop-color="#ec4899" />
    </linearGradient>
  </defs>
  <rect width="400" height="240" rx="16" fill="url(#growBg)" />
  <rect x="70" y="150" width="45" height="50" rx="6" fill="#64748b" />
  <text x="92" y="142" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="10" font-weight="bold">800</text>
  <rect x="140" y="120" width="45" height="80" rx="6" fill="#10b981" />
  <text x="162" y="112" text-anchor="middle" fill="#34d399" font-family="sans-serif" font-size="10" font-weight="bold">1200</text>
  <rect x="210" y="90" width="45" height="110" rx="6" fill="#06b6d4" />
  <text x="232" y="82" text-anchor="middle" fill="#38bdf8" font-family="sans-serif" font-size="10" font-weight="bold">1400</text>
  <rect x="280" y="55" width="45" height="145" rx="6" fill="#8b5cf6" stroke="#ec4899" stroke-width="1.5" />
  <text x="302" y="47" text-anchor="middle" fill="#f472b6" font-family="sans-serif" font-size="11" font-weight="bold">1600</text>
  <path d="M92 135L162 105L232 75L302 40" stroke="url(#arrowGrad)" stroke-width="4" stroke-linecap="round" fill="none" />
  <circle cx="302" cy="40" r="6" fill="#facc15" stroke="#ffffff" stroke-width="2" />
</svg>`,
};

const dir = path.resolve(process.cwd(), 'public/assets/illustrations');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

for (const [name, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(dir, name), content.trim() + '\n');
  console.log(`Generated public/assets/illustrations/${name}`);
}
