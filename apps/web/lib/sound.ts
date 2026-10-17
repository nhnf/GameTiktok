"use client";

/**
 * PRD section 27 / Design System v1.0 section 41 — Sound Design. No binary
 * audio assets are bundled; effects are synthesized with the Web Audio API
 * (short oscillator tones) so the game has real, toggleable audio without
 * shipping placeholder files. Muting must never affect the LIVE's own
 * audio — this only ever touches a private `AudioContext` created here.
 */
let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  // Safari-only legacy prefix; not expressible without an assertion.
  const w = window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };
  const Ctor = w.AudioContext ?? w.webkitAudioContext;
  if (!Ctor) return null;
  ctx ??= new Ctor();
  return ctx;
}

function tone(freq: number, startOffset: number, duration: number, type: OscillatorType, gainPeak: number): void {
  const audio = getContext();
  if (!audio) return;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const start = audio.currentTime + startOffset;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(gainPeak, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(audio.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

export const sfx = {
  /** Design System 41 — "Soft click" on each revealed letter. */
  letterReveal: () => tone(660, 0, 0.08, "sine", 0.15),
  /** "Magic/reveal sound" for hint. */
  hint: () => {
    tone(520, 0, 0.09, "triangle", 0.18);
    tone(780, 0.07, 0.12, "triangle", 0.15);
  },
  /** "Short premium chime" for gifts. */
  gift: () => {
    tone(880, 0, 0.1, "sine", 0.15);
    tone(1174, 0.06, 0.14, "sine", 0.12);
  },
  /** "Success jingle" for a winner. */
  winner: () => {
    [523, 659, 784, 1047].forEach((freq, i) => tone(freq, i * 0.09, 0.22, "triangle", 0.2));
  },
  /** "Dramatic transition" for a boss. */
  boss: () => {
    [220, 196, 174, 130].forEach((freq, i) => tone(freq, i * 0.12, 0.3, "sawtooth", 0.12));
  },
};

export type SfxName = keyof typeof sfx;

export function playSfx(name: SfxName, enabled: boolean): void {
  if (!enabled) return;
  try {
    sfx[name]();
  } catch {
    // Autoplay-blocked or unsupported browser — sound is best-effort only.
  }
}
