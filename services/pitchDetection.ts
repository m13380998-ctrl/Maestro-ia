
export class PitchDetector {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private stream: MediaStream | null = null;
  private buffer: Float32Array = new Float32Array(2048);

  async start(callback: (frequency: number) => void) {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = this.audioCtx.createMediaStreamSource(this.stream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 2048;
      source.connect(this.analyser);

      const detect = () => {
        if (!this.analyser) return;
        this.analyser.getFloatTimeDomainData(this.buffer);
        const pitch = this.autoCorrelate(this.buffer, this.audioCtx!.sampleRate);
        if (pitch !== -1) callback(pitch);
        requestAnimationFrame(detect);
      };
      detect();
    } catch (e) {
      console.error("Microphone access denied or error", e);
    }
  }

  stop() {
    this.stream?.getTracks().forEach(t => t.stop());
    this.audioCtx?.close();
  }

  // Algoritmo básico de autocorrelação para detecção de frequência
  private autoCorrelate(buffer: Float32Array, sampleRate: number) {
    let SIZE = buffer.length;
    let rms = 0;
    for (let i = 0; i < SIZE; i++) {
      rms += buffer[i] * buffer[i];
    }
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.01) return -1; // Muito silencioso

    let r1 = 0, r2 = SIZE - 1, thres = 0.2;
    for (let i = 0; i < SIZE / 2; i++) if (Math.abs(buffer[i]) < thres) { r1 = i; break; }
    for (let i = 1; i < SIZE / 2; i++) if (Math.abs(buffer[SIZE - i]) < thres) { r2 = SIZE - i; break; }

    buffer = buffer.slice(r1, r2);
    SIZE = buffer.length;

    let c = new Float32Array(SIZE).fill(0);
    for (let i = 0; i < SIZE; i++)
      for (let j = 0; j < SIZE - i; j++)
        c[i] = c[i] + buffer[j] * buffer[j + i];

    let d = 0; while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    for (let i = d; i < SIZE; i++) {
      if (c[i] > maxval) {
        maxval = c[i];
        maxpos = i;
      }
    }
    let T0 = maxpos;
    return sampleRate / T0;
  }
}

export const getNoteFromFreq = (freq: number): string => {
  const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const h = Math.round(12 * Math.log2(freq / 440));
  const noteIdx = (h + 69) % 12;
  const octave = Math.floor((h + 69) / 12) - 1;
  return notes[noteIdx] + octave;
};
