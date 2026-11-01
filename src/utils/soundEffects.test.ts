import { describe, it } from 'node:test';
import assert from 'node:assert';
import { soundEffects } from './soundEffects';

describe('SoundEffects Engine & Cute Audio Library', () => {
  it('initializes sound manager properly', () => {
    assert.strictEqual(typeof soundEffects.isMuted(), 'boolean');
  });

  it('provides comprehensive cute sound library with 12 items', () => {
    const library = soundEffects.getCuteSoundLibrary();
    assert.strictEqual(library.length, 12);

    const ids = library.map((s) => s.id);
    assert.ok(ids.includes('neko'));
    assert.ok(ids.includes('sparkle'));
    assert.ok(ids.includes('bubble'));
    assert.ok(ids.includes('boing'));
    assert.ok(ids.includes('star'));
    assert.ok(ids.includes('yeti'));
    assert.ok(ids.includes('levelup'));
    assert.ok(ids.includes('boba'));
    assert.ok(ids.includes('pico'));
    assert.ok(ids.includes('pout'));
    assert.ok(ids.includes('confetti'));
    assert.ok(ids.includes('hooray'));

    library.forEach((item) => {
      assert.ok(item.name.length > 0);
      assert.ok(item.emoji.length > 0);
      assert.ok(item.description.length > 0);
      assert.strictEqual(typeof item.play, 'function');
      // Calling play in Node environment safely falls back without crash
      assert.doesNotThrow(() => item.play());
    });
  });

  it('safely handles cute sound methods without crashing in non-browser env', () => {
    assert.doesNotThrow(() => soundEffects.playNekoNya());
    assert.doesNotThrow(() => soundEffects.playSparkle());
    assert.doesNotThrow(() => soundEffects.playBubblePop());
    assert.doesNotThrow(() => soundEffects.playBoing());
    assert.doesNotThrow(() => soundEffects.playStarCollect());
    assert.doesNotThrow(() => soundEffects.playYetiChirp());
    assert.doesNotThrow(() => soundEffects.playLevelUpCute());
    assert.doesNotThrow(() => soundEffects.playBobaSip());
    assert.doesNotThrow(() => soundEffects.playPicoBeep());
    assert.doesNotThrow(() => soundEffects.playSadPout());
    assert.doesNotThrow(() => soundEffects.playConfettiPop());
    assert.doesNotThrow(() => soundEffects.playUwUHooray());
  });

  it('toggles mute status and respects mute flags', () => {
    const initial = soundEffects.isMuted();
    const toggled = soundEffects.toggleMute();
    assert.strictEqual(toggled, !initial);
    // Reset back
    const restored = soundEffects.toggleMute();
    assert.strictEqual(restored, initial);
  });
});
