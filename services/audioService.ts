
import { InstrumentConfig } from '../types';

class AudioService {
  private ctx: AudioContext | null = null;
  private activeOscillators: Map<string, { osc: OscillatorNode; gain: GainNode }> = new Map();

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playNote(frequency: number, instrument: InstrumentConfig, key: string) {
    this.init();
    if (!this.ctx) return;

    // Stop if already playing this key
    this.stopNote(key, instrument);

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = instrument.oscillatorType;
    osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);

    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(instrument.sustain, now + instrument.attack);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    this.activeOscillators.set(key, { osc, gain });
  }

  stopNote(key: string, instrument: InstrumentConfig) {
    const entry = this.activeOscillators.get(key);
    if (!entry || !this.ctx) return;

    const { osc, gain } = entry;
    const now = this.ctx.currentTime;

    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + instrument.release);

    setTimeout(() => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {}
    }, instrument.release * 1000 + 100);

    this.activeOscillators.delete(key);
  }
}

export const audioService = new AudioService();
