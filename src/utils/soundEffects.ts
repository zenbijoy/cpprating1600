export interface CuteSoundItem {
  id: string;
  name: string;
  emoji: string;
  description: string;
  play: () => void;
}

/**
 * Zero-dependency Web Audio API sound synthesizer for playful gamified feedback.
 * Synthesizes retro 8-bit arcade tones, victory chimes, and comedy buzzers.
 */

class SoundEffectManager {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  constructor() {
    try {
      const saved = localStorage.getItem('climb1600_sound_muted');
      this.muted = saved === 'true';
    } catch {
      this.muted = false;
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    try {
      localStorage.setItem('climb1600_sound_muted', String(this.muted));
    } catch {}
    if (!this.muted) {
      this.playPop();
    }
    return this.muted;
  }

  /**
   * Accepted (AC) sound: Joyful arcade ascending arpeggio (C5 -> E5 -> G5 -> C6).
   */
  public playAc() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const startTime = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime + idx * 0.08);

      gain.gain.setValueAtTime(0, startTime + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.2, startTime + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + idx * 0.08 + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime + idx * 0.08);
      osc.stop(startTime + idx * 0.08 + 0.3);
    });
  }

  /**
   * Wrong Answer (WA) / Emotional Damage sound: Comical slide trombone wah-wah.
   */
  public playWa() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const startTime = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    // Slide from 220Hz down to 130Hz
    osc.frequency.setValueAtTime(220, startTime);
    osc.frequency.exponentialRampToValueAtTime(130, startTime + 0.35);

    gain.gain.setValueAtTime(0.18, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.38);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.4);
  }

  /**
   * Time Limit Exceeded (TLE) sound: Warning double blip.
   */
  public playTle() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const startTime = this.ctx.currentTime;
    [0, 0.12].forEach((offset) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(320, startTime + offset);

      gain.gain.setValueAtTime(0.12, startTime + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + offset + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime + offset);
      osc.stop(startTime + offset + 0.09);
    });
  }

  /**
   * Roulette Spinning Wheel Click.
   */
  public playRouletteTick(pitchMultiplier = 1) {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600 * pitchMultiplier, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.045);
  }

  /**
   * Fanfare / Jackpot sound when Roulette locks or contest finishes with high rating.
   */
  public playFanfare() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const chords = [
      [523.25, 659.25], // C, E
      [587.33, 698.46], // D, F
      [659.25, 783.99], // E, G
      [783.99, 1046.5], // G, C
    ];

    const startTime = this.ctx.currentTime;
    chords.forEach(([f1, f2], idx) => {
      if (!this.ctx) return;
      const t = startTime + idx * 0.12;

      [f1, f2].forEach((f) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, t);

        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.28);
      });
    });
  }

  /**
   * Pleasant subtle pop on button clicks / chip toggles.
   */
  public playPop() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.03);

    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.045);
  }

  public playVictory() {
    this.playFanfare();
  }

  public playLevelUp() {
    this.playVictory();
  }

  public playDiceRoll() {
    this.playRouletteTick(1.2);
  }

  public playThemeJingle(theme?: string) {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Distinct melodic variations based on theme flavor
    if (theme?.includes('cyber') || theme?.includes('scifi') || theme?.includes('matrix')) {
      // Fast cyber synth blip (8-bit square arpeggio)
      const freqs = [440, 880, 1320, 1760];
      freqs.forEach((f, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(f, t + i * 0.05);
        gain.gain.setValueAtTime(0.08, t + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + i * 0.05);
        osc.stop(t + i * 0.05 + 0.12);
      });
    } else if (theme?.includes('fighting') || theme?.includes('dragon') || theme?.includes('volcano')) {
      // Heavy battle power chord
      const chords = [220, 330, 440];
      chords.forEach((f) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, t);
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.38);
      });
    } else if (theme?.includes('anime') || theme?.includes('kawaii') || theme?.includes('sakura') || theme?.includes('beach')) {
      // Gentle cheerful anime chime
      const freqs = [659.25, 783.99, 1046.5]; // E5, G5, C6
      freqs.forEach((f, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t + i * 0.07);
        gain.gain.setValueAtTime(0.15, t + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.07 + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + i * 0.07);
        osc.stop(t + i * 0.07 + 0.32);
      });
    } else {
      this.playAc();
    }
  }

  /**
   * 🐱 playNekoNya: High-pitched sweet anime cat "Nya~"
   */
  public playNekoNya() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(680, t);
    osc.frequency.exponentialRampToValueAtTime(1180, t + 0.1);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.28);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1360, t);
    osc2.frequency.exponentialRampToValueAtTime(2360, t + 0.1);
    osc2.frequency.exponentialRampToValueAtTime(1760, t + 0.28);

    gain2.gain.setValueAtTime(0.001, t);
    gain2.gain.linearRampToValueAtTime(0.06, t + 0.04);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);

    osc.start(t);
    osc2.start(t);
    osc.stop(t + 0.34);
    osc2.stop(t + 0.32);
  }

  /**
   * ✨ playSparkle: Magical glittering fairy dust glockenspiel
   */
  public playSparkle() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [1318.5, 1661.2, 1975.5, 2637.0, 3322.4, 3951.0];
    const startTime = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const t = startTime + idx * 0.038;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.2);
    });
  }

  /**
   * 🫧 playBubblePop: Plinky, bubbly, satisfying water drop pop
   */
  public playBubblePop() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, t);
    osc.frequency.exponentialRampToValueAtTime(1400, t + 0.035);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.07);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  /**
   * 🚀 playBoing: Cartoon spring jump with wobbly pitch vibrato
   */
  public playBoing() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.exponentialRampToValueAtTime(620, t + 0.15);
    osc.frequency.exponentialRampToValueAtTime(380, t + 0.32);

    const vibrato = this.ctx.createOscillator();
    const vibratoGain = this.ctx.createGain();
    vibrato.frequency.setValueAtTime(22, t);
    vibratoGain.gain.setValueAtTime(40, t);
    vibrato.connect(osc.frequency);
    vibrato.start(t);
    vibrato.stop(t + 0.34);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.36);
  }

  /**
   * ⭐ playStarCollect: Dual crystalline star chime (Mario/Zelda item pickup)
   */
  public playStarCollect() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [
      { f: 987.77, delay: 0, dur: 0.15, vol: 0.16 },
      { f: 1318.51, delay: 0.08, dur: 0.38, vol: 0.22 },
      { f: 2637.02, delay: 0.08, dur: 0.32, vol: 0.08 },
    ];

    notes.forEach(({ f, delay, dur, vol }) => {
      if (!this.ctx) return;
      const start = t + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(vol, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(start);
      osc.stop(start + dur + 0.02);
    });
  }

  /**
   * 🐾 playYetiChirp: Adorable double chirp from mascot Climby
   */
  public playYetiChirp() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const chirps = [
      { startFreq: 1100, endFreq: 1650, time: t, dur: 0.06 },
      { startFreq: 1450, endFreq: 2200, time: t + 0.08, dur: 0.09 },
    ];

    chirps.forEach((c) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(c.startFreq, c.time);
      osc.frequency.exponentialRampToValueAtTime(c.endFreq, c.time + c.dur);

      gain.gain.setValueAtTime(0.001, c.time);
      gain.gain.linearRampToValueAtTime(0.18, c.time + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, c.time + c.dur);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(c.time);
      osc.stop(c.time + c.dur + 0.01);
    });
  }

  /**
   * 🌸 playLevelUpCute: Japanese arcade kawaii pentatonic level-up fanfare
   */
  public playLevelUpCute() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const freqs = [783.99, 880.0, 1046.5, 1174.66, 1567.98];
    const t = this.ctx.currentTime;

    freqs.forEach((f, idx) => {
      if (!this.ctx) return;
      const start = t + idx * 0.075;
      const isLast = idx === freqs.length - 1;
      const dur = isLast ? 0.45 : 0.18;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(isLast ? 0.22 : 0.16, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(start);
      osc.stop(start + dur + 0.02);
    });
  }

  /**
   * 🧋 playBobaSip: Cozy, peaceful lofi music box chord
   */
  public playBobaSip() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const freqs = [523.25, 659.25, 880.0, 1046.5];
    freqs.forEach((f, idx) => {
      if (!this.ctx) return;
      const start = t + idx * 0.04;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.12, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.55);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(start);
      osc.stop(start + 0.58);
    });
  }

  /**
   * 🤖 playPicoBeep: Nostalgic Tamagotchi pocket-pet beep
   */
  public playPicoBeep() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const beeps = [
      { f: 1760, time: t, dur: 0.045 },
      { f: 2349.32, time: t + 0.06, dur: 0.07 },
    ];

    beeps.forEach((b) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(b.f, b.time);

      gain.gain.setValueAtTime(0.001, b.time);
      gain.gain.linearRampToValueAtTime(0.09, b.time + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, b.time + b.dur);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(b.time);
      osc.stop(b.time + b.dur + 0.01);
    });
  }

  /**
   * 🥺 playSadPout: Soft, gentle anime pout "aww" sigh
   */
  public playSadPout() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(540, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.28);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.16, t + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.35);
  }

  /**
   * 🎊 playConfettiPop: Party popper pop with ascending twinkle
   */
  public playConfettiPop() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    try {
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.04);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1200, t);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.2, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      whiteNoise.start(t);
    } catch {}

    const freqs = [1046.5, 1318.5, 1567.98, 2093.0];
    freqs.forEach((f, i) => {
      if (!this.ctx) return;
      const start = t + 0.02 + i * 0.035;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.14, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(start);
      osc.stop(start + 0.2);
    });
  }

  /**
   * 🎉 playUwUHooray: Cheerful kawaii cheer fanfare
   */
  public playUwUHooray() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [
      { f: 523.25, time: t, dur: 0.1 },
      { f: 659.25, time: t + 0.07, dur: 0.1 },
      { f: 783.99, time: t + 0.14, dur: 0.12 },
      { f: 1046.5, time: t + 0.22, dur: 0.35 },
    ];

    notes.forEach((n) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, n.time);

      gain.gain.setValueAtTime(0.001, n.time);
      gain.gain.linearRampToValueAtTime(0.18, n.time + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, n.time + n.dur);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(n.time);
      osc.stop(n.time + n.dur + 0.02);
    });
  }

  /**
   * Full list of cute audio effects for interactive soundboards and previewers
   */
  public getCuteSoundLibrary(): CuteSoundItem[] {
    return [
      { id: 'neko', name: 'Neko Nya~', emoji: '🐱', description: 'Sweet anime cat chirp', play: () => this.playNekoNya() },
      { id: 'sparkle', name: 'Fairy Sparkle', emoji: '✨', description: 'Glittering stardust chime', play: () => this.playSparkle() },
      { id: 'bubble', name: 'Bubble Pop', emoji: '🫧', description: 'Satisfying water droplet', play: () => this.playBubblePop() },
      { id: 'boing', name: 'Spring Boing', emoji: '🚀', description: 'Cartoon bouncy spring', play: () => this.playBoing() },
      { id: 'star', name: 'Star Collect', emoji: '⭐', description: 'Crystalline item pickup', play: () => this.playStarCollect() },
      { id: 'yeti', name: 'Yeti Chirp', emoji: '🐾', description: 'Climby mascot happy chirp', play: () => this.playYetiChirp() },
      { id: 'levelup', name: 'Kawaii Level Up', emoji: '🌸', description: 'Arcade victory tune', play: () => this.playLevelUpCute() },
      { id: 'boba', name: 'Boba Zen Sip', emoji: '🧋', description: 'Warm lofi music box', play: () => this.playBobaSip() },
      { id: 'pico', name: 'Tamagotchi Beep', emoji: '🤖', description: 'Retro virtual pet chirp', play: () => this.playPicoBeep() },
      { id: 'pout', name: 'Sad Pout "Aww"', emoji: '🥺', description: 'Gentle anime pout sigh', play: () => this.playSadPout() },
      { id: 'confetti', name: 'Confetti Pop', emoji: '🎊', description: 'Party popper shimmer', play: () => this.playConfettiPop() },
      { id: 'hooray', name: 'UwU Hooray!', emoji: '🎉', description: 'Joyful major triad fanfare', play: () => this.playUwUHooray() },
    ];
  }
}

export const soundEffects = new SoundEffectManager();
