import fs from 'fs';
import path from 'path';

const files: Record<string, string> = {
  'empty-problems.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
  <circle cx="45" cy="45" r="28" stroke="#38bdf8" stroke-width="4" opacity="0.6" />
  <circle cx="45" cy="45" r="20" fill="#0f172a" />
  <path d="M66 66L86 86" stroke="#818cf8" stroke-width="6" stroke-linecap="round" />
  <text x="45" y="52" text-anchor="middle" fill="#38bdf8" font-family="sans-serif" font-size="22" font-weight="bold">?</text>
  <circle cx="28" cy="28" r="2.5" fill="#fef08a" />
</svg>`,

  'empty-contests.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
  <defs>
    <linearGradient id="empTrophy" x1="30" y1="20" x2="70" y2="70" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#fef08a" /><stop offset="60%" stop-color="#f59e0b" /><stop offset="100%" stop-color="#b45309" />
    </linearGradient>
  </defs>
  <path d="M35 24H65V46C65 56 50 62 50 62C50 62 35 56 35 46V24Z" fill="url(#empTrophy)" />
  <path d="M35 30H24C20 30 20 42 32 42H35" stroke="#facc15" stroke-width="2.5" fill="none" />
  <path d="M65 30H76C80 30 80 42 68 42H65" stroke="#facc15" stroke-width="2.5" fill="none" />
  <rect x="46" y="62" width="8" height="12" fill="#ca8a04" />
  <rect x="36" y="74" width="28" height="6" rx="2" fill="#854d0e" />
  <circle cx="50" cy="38" r="4" fill="#fef08a" />
</svg>`,

  'empty-saved.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
  <rect x="25" y="20" width="50" height="65" rx="6" fill="#1e293b" stroke="#38bdf8" stroke-width="2" />
  <rect x="36" y="14" width="28" height="10" rx="3" fill="#06b6d4" />
  <line x1="34" y1="38" x2="66" y2="38" stroke="#64748b" stroke-width="2" stroke-linecap="round" />
  <line x1="34" y1="48" x2="56" y2="48" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" />
  <line x1="34" y1="58" x2="62" y2="58" stroke="#ec4899" stroke-width="2" stroke-linecap="round" />
  <polygon points="56,20 66,20 66,36 61,32 56,36" fill="#facc15" />
</svg>`,

  'empty-offline.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
  <path d="M22 36C40 22 60 22 78 36" stroke="#94a3b8" stroke-width="3.5" stroke-linecap="round" opacity="0.4" />
  <path d="M32 48C44 38 56 38 68 48" stroke="#94a3b8" stroke-width="3.5" stroke-linecap="round" opacity="0.4" />
  <path d="M42 60C47 55 53 55 58 60" stroke="#f43f5e" stroke-width="4" stroke-linecap="round" />
  <circle cx="50" cy="74" r="5" fill="#f43f5e" />
  <line x1="20" y1="20" x2="80" y2="80" stroke="#ef4444" stroke-width="4" stroke-linecap="round" />
</svg>`,
};

const dir = path.resolve(process.cwd(), 'public/assets/empty-states');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

for (const [name, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(dir, name), content.trim() + '\n');
  console.log(`Generated public/assets/empty-states/${name}`);
}
