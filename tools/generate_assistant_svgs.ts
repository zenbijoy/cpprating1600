import fs from 'fs';
import path from 'path';

function getAssistantSvg(state: 'idle' | 'thinking' | 'celebrating' | 'teaching') {
  let eyesSvg = `
    <ellipse cx="98" cy="82" rx="9" ry="11" fill="#38bdf8" />
    <circle cx="96" cy="78" r="3.5" fill="#ffffff" />
    <ellipse cx="142" cy="82" rx="9" ry="11" fill="#38bdf8" />
    <circle cx="140" cy="78" r="3.5" fill="#ffffff" />
    <ellipse cx="86" cy="94" rx="5" ry="2.5" fill="#f43f5e" opacity="0.6" />
    <ellipse cx="154" cy="94" rx="5" ry="2.5" fill="#f43f5e" opacity="0.6" />
    <path d="M110 95Q120 102 130 95" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" fill="none" />
  `;

  if (state === 'thinking') {
    eyesSvg = `
      <circle cx="98" cy="82" r="9" stroke="#38bdf8" stroke-width="2.5" fill="none" />
      <circle cx="98" cy="82" r="4" fill="#38bdf8" />
      <circle cx="142" cy="82" r="9" stroke="#38bdf8" stroke-width="2.5" fill="none" />
      <circle cx="142" cy="82" r="4" fill="#38bdf8" />
      <path d="M110 96Q120 92 130 96" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" />
    `;
  } else if (state === 'celebrating') {
    eyesSvg = `
      <polygon points="98,72 101,79 108,79 103,84 105,91 98,87 91,91 93,84 88,79 95,79" fill="#facc15" />
      <polygon points="142,72 145,79 152,79 147,84 149,91 142,87 135,91 137,84 132,79 139,79" fill="#facc15" />
      <path d="M106 94Q120 106 134 94" stroke="#38bdf8" stroke-width="3" stroke-linecap="round" fill="none" />
    `;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" fill="none">
  <defs>
    <linearGradient id="roboBody" x1="60" y1="40" x2="180" y2="200" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#c084fc" /><stop offset="50%" stop-color="#9333ea" /><stop offset="100%" stop-color="#4c1d95" />
    </linearGradient>
    <linearGradient id="neonRim" x1="40" y1="30" x2="200" y2="210" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#ec4899" /><stop offset="50%" stop-color="#a855f7" /><stop offset="100%" stop-color="#06b6d4" />
    </linearGradient>
    <linearGradient id="faceScreen" x1="70" y1="50" x2="170" y2="120" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0f172a" /><stop offset="50%" stop-color="#1e1b4b" /><stop offset="100%" stop-color="#0b0f19" />
    </linearGradient>
    <linearGradient id="holoCard" x1="10" y1="110" x2="70" y2="160" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.8" /><stop offset="100%" stop-color="#3b82f6" stop-opacity="0.4" />
    </linearGradient>
    <filter id="aiGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <circle cx="120" cy="120" r="105" stroke="url(#neonRim)" stroke-width="1.5" stroke-dasharray="6 8" opacity="0.4" />
  <circle cx="215" cy="90" r="2" fill="#38bdf8" />
  <circle cx="35" cy="150" r="2.5" fill="#ec4899" />
  <circle cx="190" cy="180" r="1.5" fill="#c084fc" />

  <path d="M85 55L65 30" stroke="#ec4899" stroke-width="3" stroke-linecap="round" />
  <circle cx="65" cy="30" r="6" fill="#f472b6" filter="url(#aiGlow)" />
  <path d="M155 55L175 30" stroke="#06b6d4" stroke-width="3" stroke-linecap="round" />
  <circle cx="175" cy="30" r="6" fill="#38bdf8" filter="url(#aiGlow)" />

  <ellipse cx="62" cy="85" rx="8" ry="16" fill="url(#neonRim)" />
  <circle cx="62" cy="85" r="4" fill="#38bdf8" />
  <ellipse cx="178" cy="85" rx="8" ry="16" fill="url(#neonRim)" />
  <circle cx="178" cy="85" r="4" fill="#ec4899" />

  <rect x="66" y="42" width="108" height="86" rx="43" fill="url(#roboBody)" stroke="url(#neonRim)" stroke-width="3.5" filter="url(#aiGlow)" />
  <rect x="76" y="52" width="88" height="66" rx="33" fill="url(#faceScreen)" stroke="#c084fc" stroke-width="1.5" />

  ${eyesSvg}

  <rect x="110" y="128" width="20" height="8" rx="4" fill="#a855f7" />
  <path d="M90 136C100 134 140 134 150 136L158 184C158 196 142 204 120 204C98 204 82 196 82 184L90 136Z" fill="url(#roboBody)" stroke="url(#neonRim)" stroke-width="3" />
  <circle cx="120" cy="158" r="14" fill="#1e1b4b" stroke="#38bdf8" stroke-width="1.5" />
  <text x="120" y="163" text-anchor="middle" fill="#ffffff" font-family="system-ui, sans-serif" font-size="11" font-weight="900">AI</text>

  <path d="M96 150H104V168" stroke="#38bdf8" stroke-width="1.5" stroke-linecap="round" opacity="0.7" />
  <path d="M144 150H136V168" stroke="#ec4899" stroke-width="1.5" stroke-linecap="round" opacity="0.7" />

  <path d="M96 200L90 220C88 224 94 228 98 224L104 204" fill="url(#neonRim)" />
  <path d="M144 200L150 220C152 224 146 228 142 224L136 204" fill="url(#neonRim)" />
  <ellipse cx="94" cy="225" rx="5" ry="2" fill="#38bdf8" />
  <ellipse cx="146" cy="225" rx="5" ry="2" fill="#ec4899" />

  <path d="M86 145L60 162L52 152" stroke="url(#neonRim)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
  <circle cx="52" cy="152" r="5" fill="#38bdf8" />

  <g id="holoProjector" transform="translate(10, 115)">
    <rect x="0" y="0" width="48" height="34" rx="6" fill="url(#holoCard)" stroke="#38bdf8" stroke-width="1.2" />
    <circle cx="12" cy="12" r="3.5" fill="#fef08a" />
    <path d="M12 16V18" stroke="#fef08a" stroke-width="1" />
    <path d="M22 14L25 11L28 14" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" />
    <circle cx="38" cy="12" r="2.5" fill="#a5f3fc" />
    <line x1="8" y1="24" x2="24" y2="24" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" />
    <line x1="8" y1="28" x2="18" y2="28" stroke="#38bdf8" stroke-width="1.5" stroke-linecap="round" />
  </g>

  <path d="M154 145L180 165L194 158" stroke="url(#neonRim)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
  <circle cx="194" cy="158" r="5" fill="#ec4899" />
</svg>`;
}

const dir = path.resolve(process.cwd(), 'public/assets/ai-assistant');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

for (const state of ['idle', 'thinking', 'celebrating', 'teaching'] as const) {
  fs.writeFileSync(path.join(dir, `assistant-${state}.svg`), getAssistantSvg(state).trim() + '\n');
  console.log(`Generated public/assets/ai-assistant/assistant-${state}.svg`);
}
