// Wok Rush — all sound is synthesized with WebAudio: short beeps and chimes, no
// audio files, nothing loaded over the network. The game creates the context on
// the first user gesture, as browsers require.

/** One note: a sine or triangle tone that fades out. */
function tone(context, frequency, startAt, duration, type, volume) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(volume, startAt + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.05);
}

export class SoundBank {
  constructor() {
    this.context = null;
    this.muted = false;
  }

  /** Call from a user gesture; browsers refuse audio before one. */
  unlock() {
    if (this.context === null) {
      const AudioContext = window.AudioContext ?? window.webkitAudioContext;
      if (AudioContext) this.context = new AudioContext();
    }
    if (this.context !== null && this.context.state === 'suspended') {
      this.context.resume().catch(() => {});
    }
  }

  play(notes) {
    if (this.muted || this.context === null) return;
    const now = this.context.currentTime;
    for (const note of notes) {
      tone(this.context, note.frequency, now + note.at, note.duration, note.type, note.volume);
    }
  }

  click() {
    this.play([{ frequency: 660, at: 0, duration: 0.06, type: 'sine', volume: 0.12 }]);
  }

  add() {
    this.play([{ frequency: 520, at: 0, duration: 0.07, type: 'triangle', volume: 0.15 }]);
  }

  cookStart() {
    this.play([{ frequency: 300, at: 0, duration: 0.12, type: 'sine', volume: 0.12 }]);
  }

  ding() {
    this.play([
      { frequency: 880, at: 0, duration: 0.12, type: 'sine', volume: 0.18 },
      { frequency: 1318, at: 0.09, duration: 0.18, type: 'sine', volume: 0.15 },
    ]);
  }

  serve() {
    this.play([
      { frequency: 523, at: 0, duration: 0.1, type: 'triangle', volume: 0.18 },
      { frequency: 659, at: 0.08, duration: 0.1, type: 'triangle', volume: 0.18 },
      { frequency: 784, at: 0.16, duration: 0.2, type: 'triangle', volume: 0.2 },
    ]);
  }

  error() {
    this.play([{ frequency: 180, at: 0, duration: 0.18, type: 'sawtooth', volume: 0.08 }]);
  }

  tick() {
    this.play([{ frequency: 980, at: 0, duration: 0.05, type: 'sine', volume: 0.08 }]);
  }

  rush() {
    this.play([
      { frequency: 392, at: 0, duration: 0.12, type: 'triangle', volume: 0.15 },
      { frequency: 523, at: 0.1, duration: 0.12, type: 'triangle', volume: 0.15 },
      { frequency: 659, at: 0.2, duration: 0.2, type: 'triangle', volume: 0.15 },
    ]);
  }

  fanfare() {
    this.play([
      { frequency: 523, at: 0, duration: 0.14, type: 'triangle', volume: 0.18 },
      { frequency: 659, at: 0.12, duration: 0.14, type: 'triangle', volume: 0.18 },
      { frequency: 784, at: 0.24, duration: 0.14, type: 'triangle', volume: 0.18 },
      { frequency: 1046, at: 0.36, duration: 0.3, type: 'triangle', volume: 0.2 },
    ]);
  }
}
