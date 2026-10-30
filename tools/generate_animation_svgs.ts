import fs from 'fs';
import path from 'path';

const files: Record<string, string> = {
  'rocket-launch.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" fill="none">
  <defs>
    <linearGradient id="orbitGrad" x1="0" y1="0" x2="160" y2="160" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#06b6d4" /><stop offset="50%" stop-color="#6366f1" /><stop offset="100%" stop-color="#ec4899" />
    </linearGradient>
    <linearGradient id="flameGrad" x1="60" y1="100" x2="40" y2="135" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#fef08a" /><stop offset="50%" stop-color="#f97316" /><stop offset="100%" stop-color="#ef4444" />
    </linearGradient>
  </defs>
  <ellipse cx="80" cy="80" rx="68" ry="30" transform="rotate(-25 80 80)" stroke="url(#orbitGrad)" stroke-width="2" stroke-dasharray="6 8" opacity="0.6" />
  <path d="M62 96L44 122C42 126 48 130 52 126L70 102Z" fill="url(#flameGrad)" />
  <circle cx="48" cy="126" r="4" fill="#38bdf8" opacity="0.8" />
  <polygon points="56,80 42,98 62,96" fill="#0284c7" />
  <polygon points="84,52 102,66 88,72" fill="#0284c7" />
  <path d="M98 32C86 36 64 62 60 88L78 100C96 90 114 62 110 44L98 32Z" fill="#e2e8f0" stroke="#38bdf8" stroke-width="1.5" />
  <circle cx="85" cy="62" r="7" fill="#0f172a" stroke="#38bdf8" stroke-width="2" />
  <circle cx="83" cy="60" r="2.5" fill="#ffffff" />
</svg>`,

  'processing-spinner.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
  <defs>
    <linearGradient id="spinGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#06b6d4" stop-opacity="0" /><stop offset="50%" stop-color="#6366f1" stop-opacity="0.5" /><stop offset="100%" stop-color="#ec4899" stop-opacity="1" />
    </linearGradient>
  </defs>
  <circle cx="50" cy="50" r="38" stroke="url(#spinGrad)" stroke-width="6" stroke-linecap="round" fill="none" />
  <circle cx="50" cy="12" r="5" fill="#facc15" />
</svg>`,

  'target-goal.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" fill="none">
  <defs>
    <radialGradient id="targetGrad" cx="80" cy="80" r="70" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.3" /><stop offset="100%" stop-color="#0b0f19" stop-opacity="0" />
    </radialGradient>
  </defs>
  <circle cx="80" cy="80" r="70" fill="url(#targetGrad)" />
  <circle cx="80" cy="80" r="60" stroke="#06b6d4" stroke-width="3" opacity="0.4" stroke-dasharray="6 4" />
  <circle cx="80" cy="80" r="42" stroke="#6366f1" stroke-width="4" opacity="0.7" />
  <circle cx="80" cy="80" r="24" stroke="#ec4899" stroke-width="5" />
  <circle cx="80" cy="80" r="10" fill="#facc15" />
  <g transform="translate(80, 80) rotate(-35) translate(-80, -80)">
    <line x1="20" y1="80" x2="80" y2="80" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" />
    <polygon points="76,74 86,80 76,86" fill="#facc15" />
    <path d="M22 72L14 80L22 88" stroke="#38bdf8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
  </g>
</svg>`,

  'achievement-unlocked.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
  <circle cx="60" cy="60" r="50" fill="#1e1b4b" stroke="#ca8a04" stroke-width="2" />
  <polygon points="60,20 68,42 90,42 72,56 78,78 60,64 42,78 48,56 30,42 52,42" fill="#facc15" stroke="#ca8a04" stroke-width="1.5" />
  <circle cx="60" cy="60" r="6" fill="#ffffff" />
  <circle cx="30" cy="30" r="2" fill="#38bdf8" />
  <circle cx="90" cy="30" r="2" fill="#ec4899" />
  <circle cx="60" cy="100" r="2" fill="#fef08a" />
</svg>`,
};

const dir = path.resolve(process.cwd(), 'public/assets/animations');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

for (const [name, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(dir, name), content.trim() + '\n');
  console.log(`Generated public/assets/animations/${name}`);
}
