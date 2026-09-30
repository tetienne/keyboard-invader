import { midi, playNoise, playTone, type AudioEngine } from './engine'

const PENTA = [0, 2, 4, 7, 9]

/** Rising major-pentatonic note: every step sounds good, whatever the combo. */
function pentaNote(base: number, step: number): number {
  const octave = Math.floor(step / PENTA.length)
  return base + octave * 12 + (PENTA[step % PENTA.length] ?? 0)
}

export class Sfx {
  constructor(private readonly engine: AudioEngine) {}

  private get out(): AudioNode | null {
    return this.engine.sfx
  }

  private get now(): number {
    return this.engine.ctx?.currentTime ?? 0
  }

  shoot(combo: number): void {
    const f = 900 + Math.min(combo, 40) * 12 + Math.random() * 60
    playTone(this.engine, this.out, {
      type: 'square',
      freq: f,
      freqEnd: f * 0.35,
      duration: 0.09,
      volume: 0.07,
    })
    playTone(this.engine, this.out, {
      type: 'sine',
      freq: f * 1.5,
      freqEnd: f * 0.6,
      duration: 0.07,
      volume: 0.06,
    })
  }

  hit(): void {
    playTone(this.engine, this.out, {
      type: 'triangle',
      freq: 520,
      freqEnd: 300,
      duration: 0.07,
      volume: 0.12,
    })
  }

  explode(combo: number, big = false): void {
    const step = Math.min(14, Math.floor(combo / 3))
    playNoise(this.engine, this.out, {
      duration: big ? 0.9 : 0.35,
      volume: big ? 0.5 : 0.28,
      filter: 'lowpass',
      freq: big ? 2400 : 3200,
      freqEnd: 120,
    })
    playTone(this.engine, this.out, {
      type: 'sine',
      freq: big ? 110 : 180,
      freqEnd: 40,
      duration: big ? 0.7 : 0.25,
      volume: big ? 0.5 : 0.3,
    })
    const note = midi(pentaNote(72, step))
    playTone(this.engine, this.out, {
      type: 'triangle',
      freq: note,
      duration: 0.25,
      volume: 0.16,
      when: this.now + 0.01,
    })
    playTone(this.engine, this.out, {
      type: 'sine',
      freq: note * 2,
      duration: 0.18,
      volume: 0.06,
      when: this.now + 0.04,
    })
  }

  mistake(): void {
    playTone(this.engine, this.out, {
      type: 'triangle',
      freq: 180,
      freqEnd: 120,
      duration: 0.16,
      volume: 0.18,
    })
  }

  breach(): void {
    playNoise(this.engine, this.out, {
      duration: 0.5,
      volume: 0.35,
      filter: 'bandpass',
      freq: 900,
      freqEnd: 200,
      q: 2,
    })
    playTone(this.engine, this.out, {
      type: 'sawtooth',
      freq: 220,
      freqEnd: 70,
      duration: 0.45,
      volume: 0.12,
      filter: { type: 'lowpass', freq: 1200 },
    })
  }

  combo(multiplier: number): void {
    const base = 67 + multiplier * 2
    ;[0, 4, 7, 12].forEach((n, i) => {
      playTone(this.engine, this.out, {
        type: 'square',
        freq: midi(base + n),
        duration: 0.14,
        volume: 0.06,
        when: this.now + i * 0.06,
        filter: { type: 'lowpass', freq: 3000 },
      })
    })
  }

  comboBreak(): void {
    playTone(this.engine, this.out, {
      type: 'sine',
      freq: 440,
      freqEnd: 220,
      duration: 0.3,
      volume: 0.1,
    })
  }

  powerup(): void {
    for (let i = 0; i < 6; i++) {
      playTone(this.engine, this.out, {
        type: 'triangle',
        freq: midi(72 + i * 4),
        duration: 0.12,
        volume: 0.1,
        when: this.now + i * 0.04,
      })
    }
  }

  freeze(): void {
    for (let i = 0; i < 8; i++) {
      playTone(this.engine, this.out, {
        type: 'sine',
        freq: midi(96 - i * 2),
        duration: 0.3,
        volume: 0.05,
        when: this.now + i * 0.05,
      })
    }
  }

  golden(): void {
    this.coin()
    playTone(this.engine, this.out, {
      type: 'sine',
      freq: midi(100),
      duration: 0.4,
      volume: 0.05,
      when: this.now + 0.1,
    })
  }

  coin(delay = 0): void {
    const t = this.now + delay
    playTone(this.engine, this.out, {
      type: 'square',
      freq: midi(83),
      duration: 0.08,
      volume: 0.06,
      when: t,
      filter: { type: 'lowpass', freq: 4000 },
    })
    playTone(this.engine, this.out, {
      type: 'square',
      freq: midi(88),
      duration: 0.22,
      volume: 0.06,
      when: t + 0.07,
      filter: { type: 'lowpass', freq: 4000 },
    })
  }

  star(index: number): void {
    const n = 76 + index * 4
    playTone(this.engine, this.out, {
      type: 'triangle',
      freq: midi(n),
      duration: 0.5,
      volume: 0.18,
    })
    playTone(this.engine, this.out, {
      type: 'sine',
      freq: midi(n + 12),
      duration: 0.6,
      volume: 0.08,
      when: this.now + 0.03,
    })
    playNoise(this.engine, this.out, {
      duration: 0.3,
      volume: 0.05,
      filter: 'highpass',
      freq: 6000,
    })
  }

  fanfare(): void {
    const notes = [60, 64, 67, 72, 67, 72, 76]
    const times = [0, 0.1, 0.2, 0.3, 0.5, 0.6, 0.72]
    notes.forEach((n, i) => {
      const when = this.now + (times[i] ?? 0)
      const dur = i === notes.length - 1 ? 0.8 : 0.16
      playTone(this.engine, this.out, {
        type: 'square',
        freq: midi(n),
        duration: dur,
        volume: 0.07,
        when,
        filter: { type: 'lowpass', freq: 3500 },
      })
      playTone(this.engine, this.out, {
        type: 'triangle',
        freq: midi(n - 12),
        duration: dur,
        volume: 0.1,
        when,
      })
    })
  }

  levelUp(): void {
    const notes = [72, 76, 79, 84, 88, 91, 96]
    notes.forEach((n, i) => {
      playTone(this.engine, this.out, {
        type: 'triangle',
        freq: midi(n),
        duration: 0.35,
        volume: 0.1,
        when: this.now + i * 0.07,
      })
    })
  }

  defeat(): void {
    ;[67, 64, 60, 55].forEach((n, i) => {
      playTone(this.engine, this.out, {
        type: 'triangle',
        freq: midi(n),
        duration: 0.35,
        volume: 0.14,
        when: this.now + i * 0.18,
      })
    })
  }

  bossAlarm(): void {
    for (let i = 0; i < 3; i++) {
      playTone(this.engine, this.out, {
        type: 'sawtooth',
        freq: 330,
        freqEnd: 660,
        duration: 0.3,
        volume: 0.07,
        when: this.now + i * 0.38,
        filter: { type: 'lowpass', freq: 2000 },
      })
    }
  }

  wave(): void {
    playNoise(this.engine, this.out, {
      duration: 0.8,
      volume: 0.12,
      filter: 'bandpass',
      freq: 300,
      freqEnd: 4000,
      q: 3,
    })
  }

  warp(): void {
    playNoise(this.engine, this.out, {
      duration: 1.2,
      volume: 0.18,
      filter: 'bandpass',
      freq: 200,
      freqEnd: 5000,
      q: 4,
    })
    playTone(this.engine, this.out, {
      type: 'sawtooth',
      freq: 80,
      freqEnd: 600,
      duration: 1.1,
      volume: 0.06,
      filter: { type: 'lowpass', freq: 1500 },
    })
  }

  click(): void {
    playTone(this.engine, this.out, {
      type: 'triangle',
      freq: 880,
      freqEnd: 660,
      duration: 0.06,
      volume: 0.1,
    })
  }

  hover(): void {
    playTone(this.engine, this.out, { type: 'sine', freq: 1320, duration: 0.04, volume: 0.03 })
  }

  chest(): void {
    playNoise(this.engine, this.out, {
      duration: 0.4,
      volume: 0.15,
      filter: 'highpass',
      freq: 3000,
    })
    this.levelUp()
    for (let i = 0; i < 5; i++) this.coin(0.35 + i * 0.09)
  }

  type(): void {
    playTone(this.engine, this.out, {
      type: 'square',
      freq: 1500 + Math.random() * 300,
      duration: 0.03,
      volume: 0.03,
    })
  }
}
