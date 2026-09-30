import { midi, playNoise, playTone, type AudioEngine } from './engine'

export type TrackId = 'menu' | 'game' | 'boss'

type Step = number | null

interface Track {
  bpm: number
  /** One chord (MIDI notes) per bar. */
  chords: readonly (readonly number[])[]
  bassRoots: readonly number[]
  /** Bass pattern: semitone offset from the root per 16th, null = rest. */
  bass: readonly Step[]
  melody: readonly Step[]
  drums: 'none' | 'soft' | 'full'
  pad: boolean
}

const _ = null

const TRACKS: Record<TrackId, Track> = {
  menu: {
    bpm: 92,
    chords: [
      [60, 64, 67],
      [57, 60, 64],
      [53, 57, 60],
      [55, 59, 62],
    ],
    bassRoots: [36, 33, 29, 31],
    bass: [0, _, _, _, _, _, 7, _, 12, _, _, _, 7, _, _, _],
    // prettier-ignore
    melody: [
      79, _, _, _, 76, _, _, _, 72, _, 74, _, 76, _, _, _,
      72, _, _, _, 69, _, _, _, 72, _, 76, _, 74, _, _, _,
      72, _, _, _, 69, _, 72, _, 77, _, _, _, 76, _, 74, _,
      74, _, _, _, 71, _, _, _, 74, _, 79, _, 76, _, _, _,
    ],
    drums: 'soft',
    pad: true,
  },
  game: {
    bpm: 118,
    chords: [
      [57, 60, 64],
      [53, 57, 60],
      [48, 52, 55],
      [55, 59, 62],
    ],
    bassRoots: [33, 29, 36, 31],
    bass: [0, _, 12, _, 0, _, 12, _, 0, _, 12, _, 0, _, 12, 7],
    // prettier-ignore
    melody: [
      76, _, 74, _, 72, _, 69, _, 72, _, 74, _, 76, _, _, _,
      72, _, 69, _, 72, _, 77, _, 76, _, 72, _, 69, _, _, _,
      76, _, 79, _, 76, _, 72, _, 74, _, 76, _, 79, _, _, _,
      79, _, 76, _, 74, _, 71, _, 74, _, _, _, 74, 76, _, _,
    ],
    drums: 'full',
    pad: false,
  },
  boss: {
    bpm: 138,
    chords: [
      [57, 60, 64],
      [58, 62, 65],
      [57, 60, 64],
      [55, 59, 62],
    ],
    bassRoots: [33, 34, 33, 31],
    bass: [0, 0, 12, 0, 0, 12, 0, 0, 0, 0, 12, 0, 0, 12, 7, 12],
    // prettier-ignore
    melody: [
      81, _, _, 81, _, _, 79, _, 76, _, _, 76, _, 74, 76, _,
      82, _, _, 82, _, _, 81, _, 77, _, _, 77, _, 76, 77, _,
      81, _, _, 81, _, _, 84, _, 81, _, _, 79, _, 76, _, _,
      79, _, _, 79, _, _, 78, _, 74, _, _, 71, _, 74, 76, _,
    ],
    drums: 'full',
    pad: false,
  },
}

/** Lookahead step sequencer playing chiptune loops that react to the combo. */
export class Music {
  /** 0..3: extra layers (hats, arpeggio, lead) come in as the combo grows. */
  intensity = 0
  private trackId: TrackId | null = null
  private step = 0
  private nextTime = 0
  private timer: number | null = null

  constructor(private readonly engine: AudioEngine) {}

  play(id: TrackId): void {
    if (this.trackId === id) return
    this.trackId = id
    const ctx = this.engine.ctx
    if (!ctx) return
    this.step = 0
    this.nextTime = ctx.currentTime + 0.08
    this.timer ??= window.setInterval(() => this.tick(), 25)
  }

  stop(): void {
    this.trackId = null
    if (this.timer !== null) window.clearInterval(this.timer)
    this.timer = null
  }

  get current(): TrackId | null {
    return this.trackId
  }

  private tick(): void {
    const ctx = this.engine.ctx
    if (!ctx || !this.trackId) return
    const track = TRACKS[this.trackId]
    const stepDur = 60 / track.bpm / 4
    if (this.nextTime < ctx.currentTime - 0.5) this.nextTime = ctx.currentTime + 0.05
    while (this.nextTime < ctx.currentTime + 0.15) {
      this.schedule(track, this.step, this.nextTime, stepDur)
      this.nextTime += stepDur
      this.step = (this.step + 1) % 64
    }
  }

  private schedule(track: Track, step: number, when: number, stepDur: number): void {
    const out = this.engine.music
    const bar = Math.floor(step / 16) % track.chords.length
    const s = step % 16
    const chord = track.chords[bar] ?? [60, 64, 67]
    const root = track.bassRoots[bar] ?? 36
    const level = this.trackId === 'menu' ? 1 : this.intensity

    const b = track.bass[s]
    if (b !== null && b !== undefined) {
      playTone(this.engine, out, {
        type: 'triangle',
        freq: midi(root + b),
        duration: stepDur * 1.8,
        volume: 0.32,
        when,
      })
      playTone(this.engine, out, {
        type: 'square',
        freq: midi(root + b),
        duration: stepDur * 0.9,
        volume: 0.04,
        when,
        filter: { type: 'lowpass', freq: 700 },
      })
    }

    if (track.pad && s === 0) {
      for (const n of chord) {
        playTone(this.engine, out, {
          type: 'sawtooth',
          freq: midi(n),
          duration: stepDur * 16,
          volume: 0.025,
          attack: 0.6,
          when,
          detune: Math.random() * 12 - 6,
          filter: { type: 'lowpass', freq: 1100 },
        })
      }
    }

    if (level >= 1 && s % 2 === 0) {
      const arp = [0, 1, 2, 1]
      const note = chord[arp[(s / 2) % 4] ?? 0] ?? 60
      playTone(this.engine, out, {
        type: this.trackId === 'menu' ? 'triangle' : 'square',
        freq: midi(note + 12),
        duration: stepDur * 1.2,
        volume: this.trackId === 'menu' ? 0.06 : 0.035,
        when,
        filter: { type: 'lowpass', freq: 2600 },
      })
    }

    const m = track.melody[step]
    if ((level >= 2 || this.trackId === 'menu') && m !== null && m !== undefined) {
      playTone(this.engine, out, {
        type: this.trackId === 'menu' ? 'sine' : 'square',
        freq: midi(m),
        duration: stepDur * 2.2,
        volume: this.trackId === 'menu' ? 0.07 : 0.045,
        when,
        filter: { type: 'lowpass', freq: 3200 },
      })
    }

    if (track.drums === 'none') return
    const kick =
      track.drums === 'soft' ? s === 0 || s === 8 : s % 4 === 0 || (level >= 3 && s === 14)
    if (kick) {
      playTone(this.engine, out, {
        type: 'sine',
        freq: 150,
        freqEnd: 45,
        duration: 0.22,
        volume: track.drums === 'soft' ? 0.18 : 0.45,
        when,
      })
    }
    if (track.drums === 'full') {
      if (s === 4 || s === 12) {
        playNoise(this.engine, out, {
          duration: 0.16,
          volume: 0.18,
          filter: 'bandpass',
          freq: 1800,
          when,
          q: 0.7,
        })
        playTone(this.engine, out, {
          type: 'triangle',
          freq: 220,
          freqEnd: 140,
          duration: 0.08,
          volume: 0.1,
          when,
        })
      }
      const hats = level >= 3 ? true : level >= 1 ? s % 2 === 0 : s % 4 === 2
      if (hats) {
        playNoise(this.engine, out, {
          duration: 0.04,
          volume: s % 4 === 2 ? 0.07 : 0.035,
          filter: 'highpass',
          freq: 7000,
          when,
        })
      }
    }
  }
}
