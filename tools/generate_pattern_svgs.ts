import fs from 'fs';
import path from 'path';

const files: Record<string, string> = {
  'pattern-tech-grid.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120" fill="none">
  <path d="M 40 0 L 0 0 0 40 M 80 0 L 0 0 0 80 M 120 0 L 0 0 0 120" stroke="#6366f1" stroke-width="1" stroke-dasharray="2 4" opacity="0.3" />
  <circle cx="40" cy="40" r="2" fill="#06b6d4" />
  <circle cx="80" cy="80" r="2" fill="#ec4899" />
  <circle cx="120" cy="120" r="2" fill="#facc15" />
</svg>`,

  'pattern-waves.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 300" fill="none">
  <defs>
    <linearGradient id="waveG" x1="0" y1="0" x2="1000" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#06b6d4" /><stop offset="50%" stop-color="#6366f1" /><stop offset="100%" stop-color="#ec4899" />
    </linearGradient>
  </defs>
  <path d="M0 120C200 40 400 200 600 100C800 0 900 160 1000 80V300H0V120Z" fill="url(#waveG)" opacity="0.3" />
</svg>`,

  'pattern-stars.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120" fill="none">
  <circle cx="20" cy="30" r="1.2" fill="#ffffff" />
  <circle cx="85" cy="15" r="1.5" fill="#38bdf8" />
  <circle cx="110" cy="70" r="1" fill="#f472b6" />
  <circle cx="45" cy="95" r="1.4" fill="#ffffff" />
  <circle cx="70" cy="65" r="2" fill="#facc15" opacity="0.8" />
  <circle cx="15" cy="80" r="0.8" fill="#a5f3fc" />
</svg>`,
};

const dir = path.resolve(process.cwd(), 'public/assets/patterns');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

for (const [name, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(dir, name), content.trim() + '\n');
  console.log(`Generated public/assets/patterns/${name}`);
}
