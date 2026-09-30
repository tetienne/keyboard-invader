/**
 * Tiny Web Audio engine: every sound is synthesised at runtime, so the game
 * ships zero audio files and works offline.
 */
export class AudioEngine {
  ctx: AudioContext | null = null
  master: GainNode | null = null
  music: GainNode | null = null
  sfx: GainNode | null = null
  private noise: AudioBuffer | null = null
  private musicVolume = 0.5
  private sfxVolume = 0.8

  /** Must be called from a user gesture (browsers block audio before that). */
  unlock(): void {
    if (!this.ctx) {
      const audioContext = window.AudioContext as typeof AudioContext | undefined
      if (!audioContext) return
      const ctx = new audioContext()
      const compressor = ctx.createDynamicsCompressor()
      compressor.threshold.value = -14
      compressor.ratio.value = 4
      compressor.connect(ctx.destination)
      const master = ctx.createGain()
      master.gain.value = 0.9
      master.connect(compressor)
      const music = ctx.createGain()
      const sfx = ctx.createGain()
      music.connect(master)
      sfx.connect(master)
      this.ctx = ctx
      this.master = master
      this.music = music
      this.sfx = sfx
      this.noise = makeNoise(ctx)
      this.applyVolumes()
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
  }

  get ready(): boolean {
    return this.ctx !== null && this.ctx.state === 'running'
  }

  setVolumes(music: number, sfx: number): void {
    this.musicVolume = music
    this.sfxVolume = sfx
    this.applyVolumes()
  }

  private applyVolumes(): void {
    if (!this.ctx || !this.music || !this.sfx) return
    const now = this.ctx.currentTime
    // Squared curve feels more natural for loudness sliders.
    this.music.gain.setTargetAtTime(0.55 * this.musicVolume ** 2, now, 0.05)
    this.sfx.gain.setTargetAtTime(this.sfxVolume ** 2, now, 0.05)
  }

  get noiseBuffer(): AudioBuffer | null {
    return this.noise
  }
}

function makeNoise(ctx: AudioContext): AudioBuffer {
  const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  return buffer
}

export interface ToneOptions {
  type?: OscillatorType
  freq: number
  freqEnd?: number
  duration: number
  volume?: number
  attack?: number
  when?: number
  detune?: number
  filter?: { type: BiquadFilterType; freq: number; freqEnd?: number; q?: number }
}

export function playTone(engine: AudioEngine, dest: AudioNode | null, o: ToneOptions): void {
  const ctx = engine.ctx
  if (!ctx || !dest) return
  const t0 = o.when ?? ctx.currentTime
  const osc = ctx.createOscillator()
  osc.type = o.type ?? 'sine'
  osc.frequency.setValueAtTime(o.freq, t0)
  if (o.freqEnd !== undefined)
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.freqEnd), t0 + o.duration)
  if (o.detune) osc.detune.value = o.detune
  const gain = ctx.createGain()
  const vol = o.volume ?? 0.3
  const attack = o.attack ?? 0.005
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(vol, t0 + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + o.duration)
  let node: AudioNode = osc
  if (o.filter) {
    const f = ctx.createBiquadFilter()
    f.type = o.filter.type
    f.frequency.setValueAtTime(o.filter.freq, t0)
    if (o.filter.freqEnd !== undefined)
      f.frequency.exponentialRampToValueAtTime(o.filter.freqEnd, t0 + o.duration)
    f.Q.value = o.filter.q ?? 1
    osc.connect(f)
    node = f
  }
  node.connect(gain)
  gain.connect(dest)
  osc.start(t0)
  osc.stop(t0 + o.duration + 0.02)
}

export interface NoiseOptions {
  duration: number
  volume?: number
  when?: number
  filter: BiquadFilterType
  freq: number
  freqEnd?: number
  q?: number
}

export function playNoise(engine: AudioEngine, dest: AudioNode | null, o: NoiseOptions): void {
  const ctx = engine.ctx
  const buffer = engine.noiseBuffer
  if (!ctx || !dest || !buffer) return
  const t0 = o.when ?? ctx.currentTime
  const src = ctx.createBufferSource()
  src.buffer = buffer
  const f = ctx.createBiquadFilter()
  f.type = o.filter
  f.frequency.setValueAtTime(o.freq, t0)
  if (o.freqEnd !== undefined) f.frequency.exponentialRampToValueAtTime(o.freqEnd, t0 + o.duration)
  f.Q.value = o.q ?? 0.8
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(o.volume ?? 0.3, t0)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + o.duration)
  src.connect(f)
  f.connect(gain)
  gain.connect(dest)
  src.start(t0, Math.random() * 0.5)
  src.stop(t0 + o.duration + 0.02)
}

/** Frequency of a MIDI note number. */
export const midi = (n: number): number => 440 * 2 ** ((n - 69) / 12)
