import { midi, playNoise, playTone, type AudioEngine } from './engine'

export type TrackId = 'menu' | 'w0' | 'w1' | 'w2' | 'w3' | 'w4' | 'w5' | 'bossIntro' | 'boss'

type Scale = 'major' | 'minor' | 'dorian' | 'mixolydian'
type Lead = 'square' | 'triangle' | 'bell' | 'pluck' | 'saw' | 'sine'
type Drums = 'none' | 'soft' | 'half' | 'full' | 'shuffle' | 'tribal'
type Step = number | null

interface Track {
  bpm: number
  scale: Scale
  /** MIDI note of the key's tonic, in the melody octave. */
  root: number
  /** Scale degree of the chord for each bar. */
  chords: readonly number[]
  bass: readonly Step[]
  /** One token per 8th note: a scale degree, or "." for a rest. */
  melody: string
  lead: Lead
  arp: readonly number[] | null
  /** 1 = 16th-note arpeggio, 2 = 8th notes. */
  arpRate: 1 | 2
  drums: Drums
  pad: boolean
  /** 0..0.3: delays every other 16th for a bouncy feel. */
  swing: number
  /** Echo send for the lead, 0..1. */
  echo: number
  /** Plays once, then hands over to `next`. */
  next?: TrackId
}

const SCALES: Record<Scale, readonly number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
}

const _ = null
const BASS = {
  bounce: [0, _, 12, _, 0, _, 12, _, 0, _, 12, _, 0, _, 12, 7],
  soft: [0, _, _, _, _, _, 7, _, 12, _, _, _, 7, _, _, _],
  walk: [0, _, _, _, 7, _, _, _, 12, _, _, _, 7, _, 5, _],
  drive: [0, 0, 12, 0, 0, 12, 0, 0, 0, 0, 12, 0, 0, 12, 7, 12],
  pulse: [0, _, 0, _, 0, _, 0, _, 0, _, 0, _, 0, _, 0, _],
  shuffle: [0, _, _, 7, _, _, 12, _, _, 7, _, _, 0, _, 5, _],
  tribal: [0, _, _, 0, _, _, 7, _, 0, _, _, 0, _, 10, 7, _],
} as const

const TRACKS: Record<TrackId, Track> = {
  menu: {
    bpm: 92,
    scale: 'major',
    root: 72,
    chords: [1, 6, 4, 5],
    bass: BASS.soft,
    melody: '5 . . . 3 . 2 . | 3 . . . 1 . . . | 1 . 2 . 4 . 3 . | 2 . . . 5 . . .',
    lead: 'sine',
    arp: [0, 1, 2, 1],
    arpRate: 2,
    drums: 'soft',
    pad: true,
    swing: 0,
    echo: 0.35,
  },
  // Cosy Planet: bouncy and sunny
  w0: {
    bpm: 112,
    scale: 'major',
    root: 72,
    chords: [1, 5, 6, 4, 1, 5, 4, 5],
    bass: BASS.bounce,
    melody:
      '1 . 3 . 5 . 3 . | 2 . 5 . 7 . 5 . | 3 . 6 . 8 . 6 5 | 4 . 6 . 4 3 2 . | ' +
      '5 . 5 6 5 . 3 . | 5 . 5 6 5 . 2 . | 4 . 6 . 8 . 6 . | 7 . 5 . 2 . . .',
    lead: 'square',
    arp: [0, 1, 2, 1],
    arpRate: 2,
    drums: 'full',
    pad: false,
    swing: 0,
    echo: 0.15,
  },
  // Blue Nebula: dreamy, floating echoes
  w1: {
    bpm: 100,
    scale: 'dorian',
    root: 74,
    chords: [1, 4, 1, 7, 3, 4, 1, 5],
    bass: BASS.soft,
    melody:
      '5 . . 3 . . 1 . | 4 . . 6 . . 8 . | 7 . . 5 . . 3 . | 2 . . 3 . . 4 5 | ' +
      '6 . . 5 . . 3 . | 4 . . 3 . . 2 . | 1 . . 3 . . 5 . | 5 . 4 . 2 . . .',
    lead: 'triangle',
    arp: [0, 2, 1, 2, 0, 1, 2, 1],
    arpRate: 1,
    drums: 'half',
    pad: true,
    swing: 0,
    echo: 0.5,
  },
  // Ice Moon: sparkling bells
  w2: {
    bpm: 96,
    scale: 'minor',
    root: 76,
    chords: [1, 6, 3, 7, 4, 1, 6, 5],
    bass: BASS.walk,
    melody:
      '8 . 7 . 5 . . . | 6 . 5 . 3 . . . | 5 . 3 . 5 . 8 . | 7 . . . 5 . . . | ' +
      '4 . 6 . 8 . 6 . | 5 . 3 . 1 . 3 . | 6 . 5 . 3 . 5 . | 5 . . . . . . .',
    lead: 'bell',
    arp: [0, 1, 2, 3, 2, 1],
    arpRate: 1,
    drums: 'soft',
    pad: true,
    swing: 0,
    echo: 0.45,
  },
  // Word Desert: swinging plucks
  w3: {
    bpm: 118,
    scale: 'major',
    root: 77,
    chords: [1, 4, 1, 5, 6, 4, 5, 1],
    bass: BASS.shuffle,
    melody:
      '1 1 3 . 5 . 3 . | 4 4 6 . 8 . 6 . | 5 . 3 . 1 . 3 5 | 2 . . . 5 . . . | ' +
      '6 6 8 . 6 . 5 . | 4 . 6 . 4 . 3 . | 2 . 5 . 7 . 5 . | 8 . . . 1 . . .',
    lead: 'pluck',
    arp: null,
    arpRate: 2,
    drums: 'shuffle',
    pad: false,
    swing: 0.22,
    echo: 0.25,
  },
  // Cosmic Jungle: bongos and marimba
  w4: {
    bpm: 124,
    scale: 'mixolydian',
    root: 67,
    chords: [1, 7, 4, 1, 1, 7, 4, 5],
    bass: BASS.tribal,
    melody:
      '5 . 5 . 6 5 3 . | 4 . 4 . 5 4 2 . | 1 . 3 . 4 . 6 . | 5 . . . 3 . . . | ' +
      '8 . 7 . 5 . 7 . | 8 . 7 . 5 . 4 . | 6 . 4 . 1 . 4 . | 5 . 6 . 7 . . .',
    lead: 'bell',
    arp: [0, 2, 1, 2],
    arpRate: 2,
    drums: 'tribal',
    pad: false,
    swing: 0.1,
    echo: 0.2,
  },
  // Black Hole: synthwave
  w5: {
    bpm: 116,
    scale: 'minor',
    root: 72,
    chords: [1, 6, 3, 7, 1, 6, 4, 5],
    bass: BASS.pulse,
    melody:
      '1 . . 3 . . 5 . | 6 . . 5 . . 3 . | 5 . . 3 . . 7 . | 7 . 8 . 9 . 7 . | ' +
      '8 . . 7 . . 5 . | 6 . . 5 . . 3 . | 4 . . 5 . . 6 . | 5 . . . . . . .',
    lead: 'saw',
    arp: [0, 1, 2, 3, 2, 1, 0, 1],
    arpRate: 1,
    drums: 'full',
    pad: true,
    swing: 0,
    echo: 0.35,
  },
  // Build-up before a boss: heartbeat, rising bass, drum roll. Exciting, not scary.
  bossIntro: {
    bpm: 120,
    scale: 'minor',
    root: 69,
    chords: [1, 1],
    bass: BASS.pulse,
    melody: '. . . . . . . . | . . . . . . . .',
    lead: 'square',
    arp: null,
    arpRate: 2,
    drums: 'none',
    pad: false,
    swing: 0,
    echo: 0,
    next: 'boss',
  },
  boss: {
    bpm: 136,
    scale: 'minor',
    root: 69,
    chords: [1, 6, 7, 1, 1, 6, 4, 5],
    bass: BASS.drive,
    melody:
      '5 . 5 . 8 . 7 5 | 6 . 6 . 5 . 3 . | 7 . 7 . 9 . 8 7 | 8 . . . 5 . . . | ' +
      '5 . 5 . 8 . 7 5 | 6 . 8 . 10 . 8 . | 4 . 6 . 8 . 6 4 | 5 . 7 . 9 . . .',
    lead: 'square',
    arp: [0, 1, 2, 1],
    arpRate: 2,
    drums: 'full',
    pad: false,
    swing: 0,
    echo: 0.2,
  },
}

/** Adventure worlds each get their own tune; endless mode rotates through them. */
export const worldTrack = (world: number): TrackId => `w${((world % 6) + 6) % 6}` as TrackId

function degreeToMidi(scale: Scale, root: number, degree: number): number {
  const steps = SCALES[scale]
  const i = degree - 1
  const octave = Math.floor(i / 7)
  return root + octave * 12 + (steps[((i % 7) + 7) % 7] ?? 0)
}

function parseMelody(track: Track): Step[] {
  const tokens = track.melody.split(/\s+/).filter((tk) => tk !== '|' && tk.length > 0)
  return tokens.map((tk) => (tk === '.' ? null : degreeToMidi(track.scale, track.root, Number(tk))))
}

const melodies = new Map<TrackId, Step[]>()
function melodyOf(id: TrackId): Step[] {
  let m = melodies.get(id)
  if (!m) {
    m = parseMelody(TRACKS[id])
    melodies.set(id, m)
  }
  return m
}

/** Lookahead step sequencer playing chiptune loops that react to the game. */
export class Music {
  /** 0..3: extra layers (hats, arpeggio, lead) come in as the combo grows. */
  intensity = 0
  /** Boss almost beaten: faster tempo and busier drums. */
  finale = false
  private trackId: TrackId | null = null
  private step = 0
  private nextTime = 0
  private timer: number | null = null
  private leadBus: GainNode | null = null
  private echoSend: GainNode | null = null

  constructor(private readonly engine: AudioEngine) {}

  play(id: TrackId): void {
    if (this.trackId === id) return
    const from = this.trackId
    this.trackId = id
    this.finale = false
    const ctx = this.engine.ctx
    if (!ctx) return
    this.step = 0
    this.nextTime = Math.max(this.nextTime, ctx.currentTime + 0.05)
    if (from === 'bossIntro' && id === 'boss') this.crash(this.nextTime)
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

  /** Lead goes through a feedback delay for a spacey echo. */
  private buses(): { lead: GainNode; echo: GainNode } | null {
    const ctx = this.engine.ctx
    const out = this.engine.music
    if (!ctx || !out) return null
    if (!this.leadBus || !this.echoSend) {
      const lead = ctx.createGain()
      lead.connect(out)
      const send = ctx.createGain()
      send.gain.value = 0
      const delay = ctx.createDelay(1)
      delay.delayTime.value = 0.33
      const feedback = ctx.createGain()
      feedback.gain.value = 0.38
      const tone = ctx.createBiquadFilter()
      tone.type = 'lowpass'
      tone.frequency.value = 2400
      lead.connect(send)
      send.connect(delay)
      delay.connect(tone)
      tone.connect(feedback)
      feedback.connect(delay)
      tone.connect(out)
      this.leadBus = lead
      this.echoSend = send
    }
    return { lead: this.leadBus, echo: this.echoSend }
  }

  /** Re-reads the track: `play()` may have switched it while scheduling. */
  private readTrack(): TrackId | null {
    return this.trackId
  }

  private tick(): void {
    const ctx = this.engine.ctx
    if (!ctx || !this.trackId) return
    if (this.nextTime < ctx.currentTime - 0.5) this.nextTime = ctx.currentTime + 0.05
    let id: TrackId | null = this.trackId
    while (id && this.nextTime < ctx.currentTime + 0.15) {
      const track = TRACKS[id]
      const bpm = track.bpm * (this.finale && id === 'boss' ? 1.1 : 1)
      const stepDur = 60 / bpm / 4
      const swing = this.step % 2 === 1 ? track.swing * stepDur : 0
      this.schedule(id, track, this.step, this.nextTime + swing, stepDur)
      this.nextTime += stepDur
      this.step++
      const length = track.chords.length * 16
      if (this.step >= length) {
        this.step = 0
        if (track.next) this.play(track.next)
      }
      id = this.readTrack()
    }
  }

  private schedule(id: TrackId, track: Track, step: number, when: number, stepDur: number): void {
    const out = this.engine.music
    const buses = this.buses()
    if (!out || !buses) return
    const bar = Math.floor(step / 16)
    const s = step % 16
    const degree = track.chords[bar] ?? 1
    const chord = [0, 2, 4, 7].map((d) => degreeToMidi(track.scale, track.root - 12, degree + d))
    const root = degreeToMidi(track.scale, track.root - 36, degree)
    const calm = id === 'menu'
    const level = calm ? 2 : this.intensity
    buses.echo.gain.setTargetAtTime(track.echo, when, 0.1)

    if (id === 'bossIntro') {
      this.scheduleIntro(step, when, stepDur)
      return
    }

    // bass
    const b = track.bass[s]
    if (b !== null && b !== undefined) {
      playTone(this.engine, out, {
        type: 'triangle',
        freq: midi(root + b),
        duration: stepDur * 1.8,
        volume: 0.3,
        when,
      })
      playTone(this.engine, out, {
        type: id === 'w5' || id === 'boss' ? 'sawtooth' : 'square',
        freq: midi(root + b),
        duration: stepDur * 0.9,
        volume: 0.04,
        when,
        filter: { type: 'lowpass', freq: 700 },
      })
    }

    // pad
    if (track.pad && s === 0) {
      for (const n of chord.slice(0, 3)) {
        playTone(this.engine, out, {
          type: 'sawtooth',
          freq: midi(n),
          duration: stepDur * 16,
          volume: 0.022,
          attack: 0.6,
          when,
          detune: Math.random() * 12 - 6,
          filter: { type: 'lowpass', freq: 1100 },
        })
      }
    }

    // arpeggio
    if (track.arp && level >= 1 && s % track.arpRate === 0) {
      const idx = track.arp[(s / track.arpRate) % track.arp.length] ?? 0
      const note = (chord[idx] ?? 60) + 12
      this.voice(
        buses.lead,
        track.lead === 'saw' ? 'saw' : track.lead === 'bell' ? 'bell' : 'triangle',
        note,
        stepDur * 1.2,
        calm ? 0.05 : 0.03,
        when,
      )
    }

    // melody (8th-note grid)
    if (s % 2 === 0 && (level >= 2 || calm)) {
      const m = melodyOf(id)[bar * 8 + s / 2]
      if (m !== null && m !== undefined)
        this.voice(buses.lead, track.lead, m, stepDur * 2.2, calm ? 0.065 : 0.05, when)
    }

    this.drums(track.drums, s, level, when)
  }

  private voice(
    dest: AudioNode,
    lead: Lead,
    note: number,
    duration: number,
    volume: number,
    when: number,
  ): void {
    const f = midi(note)
    switch (lead) {
      case 'bell':
        playTone(this.engine, dest, {
          type: 'sine',
          freq: f,
          duration: duration * 1.6,
          volume: volume * 1.2,
          when,
        })
        playTone(this.engine, dest, {
          type: 'sine',
          freq: f * 2.76,
          duration: duration * 0.5,
          volume: volume * 0.35,
          when,
        })
        break
      case 'pluck':
        playTone(this.engine, dest, {
          type: 'sawtooth',
          freq: f,
          duration: duration * 0.8,
          volume,
          when,
          filter: { type: 'lowpass', freq: 4000, freqEnd: 400, q: 4 },
        })
        break
      case 'saw':
        playTone(this.engine, dest, {
          type: 'sawtooth',
          freq: f,
          duration,
          volume: volume * 0.8,
          when,
          detune: 7,
          filter: { type: 'lowpass', freq: 2200 },
        })
        break
      default:
        playTone(this.engine, dest, {
          type: lead,
          freq: f,
          duration,
          volume,
          when,
          filter: { type: 'lowpass', freq: 3200 },
        })
    }
  }

  private kick(when: number, volume: number): void {
    playTone(this.engine, this.engine.music, {
      type: 'sine',
      freq: 150,
      freqEnd: 45,
      duration: 0.22,
      volume,
      when,
    })
  }

  private snare(when: number, volume: number): void {
    const out = this.engine.music
    playNoise(this.engine, out, {
      duration: 0.16,
      volume,
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
      volume: volume * 0.55,
      when,
    })
  }

  private hat(when: number, volume: number): void {
    playNoise(this.engine, this.engine.music, {
      duration: 0.04,
      volume,
      filter: 'highpass',
      freq: 7000,
      when,
    })
  }

  private tom(when: number, freq: number, volume: number): void {
    playTone(this.engine, this.engine.music, {
      type: 'triangle',
      freq,
      freqEnd: freq * 0.6,
      duration: 0.18,
      volume,
      when,
    })
  }

  private crash(when: number): void {
    playNoise(this.engine, this.engine.music, {
      duration: 1.4,
      volume: 0.12,
      filter: 'highpass',
      freq: 4000,
      when,
    })
  }

  private drums(style: Drums, s: number, level: number, when: number): void {
    const busy = this.finale || level >= 3
    switch (style) {
      case 'none':
        return
      case 'soft':
        if (s === 0 || s === 8) this.kick(when, 0.16)
        if (s % 4 === 2) this.hat(when, 0.025)
        return
      case 'half':
        if (s === 0 || s === 10) this.kick(when, 0.3)
        if (s === 8) this.snare(when, 0.12)
        if (level >= 1 && s % 2 === 0) this.hat(when, s % 4 === 2 ? 0.05 : 0.025)
        return
      case 'shuffle':
        if (s === 0 || s === 6 || s === 8) this.kick(when, 0.38)
        if (s === 4 || s === 12) this.snare(when, 0.15)
        if (level >= 1 && (s % 4 === 0 || s % 4 === 3)) this.hat(when, 0.05)
        return
      case 'tribal':
        if (s === 0 || s === 8) this.kick(when, 0.35)
        if (s === 3 || s === 11) this.tom(when, 320, 0.16)
        if (s === 6 || s === 14) this.tom(when, 220, 0.18)
        if (level >= 2 && s === 15) this.tom(when, 420, 0.12)
        if (level >= 1 && s % 2 === 0) this.hat(when, 0.03)
        return
      case 'full':
        if (s % 4 === 0 || (busy && s === 14)) this.kick(when, 0.45)
        if (s === 4 || s === 12) this.snare(when, 0.18)
        if (busy || (level >= 1 && s % 2 === 0) || s % 4 === 2)
          this.hat(when, s % 4 === 2 ? 0.07 : 0.035)
    }
  }

  private scheduleIntro(step: number, when: number, stepDur: number): void {
    const out = this.engine.music
    const s = step % 16
    // Friendly heartbeat: lub-dub on every beat pair.
    if (step % 8 === 0) this.kick(when, 0.35)
    if (step % 8 === 2) this.kick(when, 0.22)
    // Bass climbing a semitone every beat.
    if (step % 2 === 0) {
      const n = 33 + Math.floor(step / 4)
      playTone(this.engine, out, {
        type: 'sawtooth',
        freq: midi(n),
        duration: stepDur * 1.6,
        volume: 0.07,
        when,
        filter: { type: 'lowpass', freq: 500 + step * 40 },
      })
    }
    // Whoosh rising over the whole intro.
    if (step === 0) {
      playNoise(this.engine, out, {
        duration: stepDur * 32,
        volume: 0.06,
        filter: 'bandpass',
        freq: 200,
        freqEnd: 4000,
        when,
        q: 2,
      })
    }
    // Drum roll in the second bar, getting louder.
    if (step >= 16 && (step >= 24 || s % 2 === 0)) this.snare(when, 0.03 + (step - 16) * 0.006)
  }
}
