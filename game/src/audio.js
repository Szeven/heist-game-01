// The Velvet Vault — audio.js: sounds made, not shipped.
// Every sound is a few oscillators through one WebAudio context, created on
// the first user gesture (browsers block audio before one). No audio files,
// no network. M toggles it off.
export function createAudio() {
  return { context: null, enabled: true };
}

function ensureContext(audio) {
  if (audio.context) return audio.context;
  try {
    const Context = window.AudioContext ?? window.webkitAudioContext;
    if (!Context) return null;
    audio.context = new Context();
    return audio.context;
  } catch {
    return null;
  }
}

function tone(audio, frequency, seconds, type, volume, when = 0) {
  if (!audio.enabled) return;
  const context = ensureContext(audio);
  if (!context) return;
  try {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    const start = context.currentTime + when;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + seconds + 0.05);
  } catch {
    // Audio is decoration: a failure here must never stop the game.
  }
}

/** A soft chime when loot is lifted. */
export function playPickup(audio) {
  tone(audio, 880, 0.12, 'sine', 0.12);
  tone(audio, 1318, 0.18, 'sine', 0.1, 0.08);
}

/** A coin's bright ping as it lands. */
export function playCoin(audio) {
  tone(audio, 1568, 0.1, 'triangle', 0.1);
}

/** A rising two-note sting when a guard sounds off. */
export function playAlert(audio) {
  tone(audio, 392, 0.16, 'square', 0.07);
  tone(audio, 523, 0.22, 'square', 0.07, 0.12);
}

/** The lockdown klaxon: three low blasts. */
export function playLockdown(audio) {
  tone(audio, 220, 0.22, 'sawtooth', 0.09);
  tone(audio, 220, 0.22, 'sawtooth', 0.09, 0.26);
  tone(audio, 220, 0.3, 'sawtooth', 0.09, 0.52);
}

/** A low thud when the thief is caught. */
export function playCaught(audio) {
  tone(audio, 110, 0.4, 'sawtooth', 0.12);
  tone(audio, 82, 0.5, 'sine', 0.12, 0.05);
}

/** A short fanfare for the getaway. */
export function playWin(audio) {
  [523, 659, 784, 1046].forEach((frequency, index) => {
    tone(audio, frequency, 0.22, 'triangle', 0.11, index * 0.11);
  });
}
