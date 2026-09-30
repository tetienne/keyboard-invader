import type { LevelDef } from '../content/campaign'
import { clamp } from '../core/math'
import { pick, randRange, weightedPick, type Rng } from '../core/rng'

export type EnemyKind = 'normal' | 'golden' | 'powerup' | 'boss'
export type Power = 'freeze' | 'bomb' | 'heal'
export type SessionStatus = 'playing' | 'won' | 'lost'

export interface Enemy {
  id: number
  kind: EnemyKind
  power: Power | null
  text: string
  typed: number
  x: number
  y: number
  baseX: number
  /** Share of the fall covered per second, at pace 1. */
  vy: number
  wobbleAmp: number
  wobbleFreq: number
  wobblePhase: number
  species: number
  palette: number
  born: number
  /** Final shot is in flight: cannot be targeted nor breach any more. */
  doomed: boolean
  hp: number
  maxHp: number
  lastHit: number
}

export interface Projectile {
  id: number
  targetId: number
  born: number
  duration: number
  final: boolean
}

export type GameEvent =
  | { type: 'spawn'; enemy: Enemy }
  | { type: 'lock'; enemy: Enemy }
  | { type: 'shot'; enemy: Enemy; projectile: Projectile }
  | { type: 'hit'; enemy: Enemy }
  | { type: 'kill'; enemy: Enemy; points: number; byBomb: boolean }
  | { type: 'mistake'; key: string; expected: string | null }
  | { type: 'combo'; multiplier: number }
  | { type: 'comboBreak'; combo: number }
  | { type: 'breach'; enemy: Enemy }
  | { type: 'escape'; enemy: Enemy }
  | { type: 'powerup'; power: Power; enemy: Enemy }
  | { type: 'bossHit'; enemy: Enemy }
  | { type: 'bossSpawn'; enemy: Enemy }
  | { type: 'wave'; wave: number; boss: boolean }
  | { type: 'victory' }
  | { type: 'defeat' }

export interface EndlessOptions {
  /** Letters the pilot already knows. */
  pool: readonly string[]
  /** Readers also get words, more and longer as waves go by. */
  reader: boolean
}

export interface SessionConfig {
  rng: Rng
  /** Vocabulary in the player's language. */
  words: readonly string[]
  level?: LevelDef
  endless?: EndlessOptions
  /** Extra weight for letters the child struggles with (1 = neutral). */
  keyWeight?: (ch: string) => number
  hearts?: number
}

export interface KeyStat {
  ok: number
  ko: number
}

export interface SessionResult {
  mode: 'campaign' | 'endless'
  levelId: string | null
  won: boolean
  score: number
  accuracy: number
  correct: number
  mistakes: number
  kills: number
  breaches: number
  bestCombo: number
  goldenKills: number
  powerups: number
  bossDefeated: boolean
  coins: number
  wave: number
  duration: number
  heartsLeft: number
  keyStats: Record<string, KeyStat>
}

interface Tuning {
  pool: readonly string[]
  focus: readonly string[]
  /** Probability that a spawned invader carries a word instead of a letter. */
  wordChance: number
  wordLen: readonly [number, number]
  fallTime: number
  fallPerChar: number
  spawnEvery: number
  maxOnScreen: number
  powerups: boolean
}

/** Combo needed to reach each multiplier (index + 1). */
export const MULTIPLIER_STEPS: readonly number[] = [0, 8, 20, 35, 55]

export function multiplierFor(combo: number): number {
  let m = 1
  for (let i = 0; i < MULTIPLIER_STEPS.length; i++)
    if (combo >= (MULTIPLIER_STEPS[i] ?? 0)) m = i + 1
  return m
}

export const SHOT_DURATION = 0.12
export const BOSS_Y = 0.3
const FIRST_SPAWN_DELAY = 1.2
const VICTORY_DELAY = 1.1
const DEFEAT_DELAY = 1.2
const FREEZE_SECONDS = 6
const FREEZE_FACTOR = 0.25
const SPECIES = 6
const PALETTES = 8
const POWERS: readonly Power[] = ['freeze', 'bomb', 'heal']

export function endlessWaveTarget(wave: number): number {
  return 8 + wave * 2
}

export const isBossWave = (wave: number): boolean => wave % 5 === 0

export class Session {
  readonly mode: 'campaign' | 'endless'
  readonly level: LevelDef | null
  readonly maxHearts: number

  time = 0
  status: SessionStatus = 'playing'
  enemies: Enemy[] = []
  projectiles: Projectile[] = []
  lockId: number | null = null

  score = 0
  combo = 0
  bestCombo = 0
  hearts: number
  correct = 0
  mistakes = 0
  kills = 0
  breaches = 0
  goldenKills = 0
  powerupsUsed = 0
  coins = 0
  bossDefeated = false
  /** Adaptive speed factor: rises when the child is comfortable, drops after misses. */
  pace = 1
  freezeUntil = 0
  wave = 1
  waveKills = 0
  /** Quota invaders spawned / resolved (killed or breached) in a campaign level. */
  quotaSpawned = 0
  quotaResolved = 0

  private readonly rng: Rng
  private readonly words: readonly string[]
  private readonly endless: EndlessOptions | null
  private readonly keyWeight: (ch: string) => number
  private readonly keyStats: Record<string, KeyStat> = {}
  private events: GameEvent[] = []
  private nextId = 1
  private spawnTimer = FIRST_SPAWN_DELAY
  private bossPending: number | null = null
  private endAt: number | null = null
  private recentWords: string[] = []

  constructor(config: SessionConfig) {
    this.rng = config.rng
    this.words = config.words
    this.level = config.level ?? null
    this.endless = config.endless ?? null
    this.mode = this.level ? 'campaign' : 'endless'
    this.keyWeight = config.keyWeight ?? (() => 1)
    this.maxHearts = config.hearts ?? 5
    this.hearts = this.maxHearts
    if (this.level?.boss) this.bossPending = 1.6
  }

  get multiplier(): number {
    return multiplierFor(this.combo)
  }

  get accuracy(): number {
    const total = this.correct + this.mistakes
    return total === 0 ? 1 : this.correct / total
  }

  get frozen(): boolean {
    return this.time < this.freezeUntil
  }

  get ending(): boolean {
    return this.endAt !== null
  }

  /** Level progress in [0, 1] (campaign) or wave progress (endless). */
  get progress(): number {
    if (this.level) {
      if (this.level.boss) {
        const boss = this.boss
        if (this.bossDefeated) return 1
        return boss ? 1 - boss.hp / boss.maxHp : 0
      }
      return clamp(this.quotaResolved / this.level.enemies, 0, 1)
    }
    if (isBossWave(this.wave)) {
      const boss = this.boss
      return boss ? 1 - boss.hp / boss.maxHp : 0
    }
    return clamp(this.waveKills / endlessWaveTarget(this.wave), 0, 1)
  }

  get boss(): Enemy | undefined {
    return this.enemies.find((e) => e.kind === 'boss')
  }

  get locked(): Enemy | undefined {
    return this.lockId === null ? undefined : this.enemies.find((e) => e.id === this.lockId)
  }

  drainEvents(): GameEvent[] {
    const out = this.events
    this.events = []
    return out
  }

  /** The key the child should press next, for the on-screen keyboard hint. */
  nextKeyHint(): string | null {
    const locked = this.locked
    if (locked && !locked.doomed) return locked.text[locked.typed] ?? null
    const target = this.lowestTarget()
    return target ? (target.text[target.typed] ?? null) : null
  }

  releaseLock(): void {
    this.lockId = null
  }

  press(rawKey: string): void {
    if (this.status !== 'playing' || this.endAt !== null) return
    const ch = rawKey.toLowerCase()
    if (!/^[a-z]$/.test(ch)) return

    let target = this.locked
    if (target?.doomed) {
      this.lockId = null
      target = undefined
    }
    if (target) {
      const expected = target.text[target.typed] ?? null
      if (expected === ch) this.hitChar(target)
      else this.mistake(ch, expected)
      return
    }

    let best: Enemy | undefined
    for (const e of this.enemies) {
      if (e.doomed || e.text[e.typed] !== ch) continue
      if (!best || e.y > best.y) best = e
    }
    if (!best) {
      const hint = this.lowestTarget()
      this.mistake(ch, hint ? (hint.text[hint.typed] ?? null) : null)
      return
    }
    this.hitChar(best)
  }

  update(dt: number): void {
    if (this.status !== 'playing') return
    this.time += dt

    if (this.endAt !== null) {
      this.advanceProjectiles()
      this.moveEnemies(dt)
      if (this.time >= this.endAt) {
        this.status = this.hearts > 0 ? 'won' : 'lost'
      }
      return
    }

    if (this.bossPending !== null) {
      this.bossPending -= dt
      if (this.bossPending <= 0) {
        this.bossPending = null
        this.spawnBoss()
      }
    }

    this.spawnTimer -= dt * this.pace
    const tuning = this.tuning()
    const active = this.enemies.filter((e) => !e.doomed && e.kind !== 'boss').length
    if (active === 0 && this.spawnTimer > 0.5 && this.time > FIRST_SPAWN_DELAY)
      this.spawnTimer = 0.5
    if (this.spawnTimer <= 0 && active < tuning.maxOnScreen && this.canSpawn()) {
      this.spawn(tuning)
      this.spawnTimer = tuning.spawnEvery * randRange(this.rng, 0.8, 1.2)
    }

    this.moveEnemies(dt)
    this.advanceProjectiles()
    this.checkBreaches()
    this.checkCompletion()
  }

  result(): SessionResult {
    return {
      mode: this.mode,
      levelId: this.level?.id ?? null,
      won: this.status === 'won',
      score: this.score,
      accuracy: this.accuracy,
      correct: this.correct,
      mistakes: this.mistakes,
      kills: this.kills,
      breaches: this.breaches,
      bestCombo: this.bestCombo,
      goldenKills: this.goldenKills,
      powerups: this.powerupsUsed,
      bossDefeated: this.bossDefeated,
      coins: this.coins,
      wave: this.wave,
      duration: this.time,
      heartsLeft: this.hearts,
      keyStats: { ...this.keyStats },
    }
  }

  // --- internals -----------------------------------------------------------

  private emit(event: GameEvent): void {
    this.events.push(event)
  }

  private lowestTarget(): Enemy | undefined {
    let best: Enemy | undefined
    for (const e of this.enemies) {
      if (e.doomed) continue
      if (!best || e.y > best.y) best = e
    }
    return best
  }

  private stat(ch: string): KeyStat {
    let s = this.keyStats[ch]
    if (!s) {
      s = { ok: 0, ko: 0 }
      this.keyStats[ch] = s
    }
    return s
  }

  private hitChar(enemy: Enemy): void {
    const ch = enemy.text[enemy.typed] ?? ''
    this.stat(ch).ok++
    const before = this.multiplier
    enemy.typed++
    this.correct++
    this.combo++
    this.bestCombo = Math.max(this.bestCombo, this.combo)
    const after = this.multiplier
    if (after > before) this.emit({ type: 'combo', multiplier: after })
    this.score += 10 * after

    const final = enemy.typed >= enemy.text.length
    if (final) {
      enemy.doomed = true
      if (this.lockId === enemy.id) this.lockId = null
    } else if (this.lockId !== enemy.id) {
      this.lockId = enemy.id
      this.emit({ type: 'lock', enemy })
    }
    const projectile: Projectile = {
      id: this.nextId++,
      targetId: enemy.id,
      born: this.time,
      duration: SHOT_DURATION,
      final,
    }
    this.projectiles.push(projectile)
    this.emit({ type: 'shot', enemy, projectile })
  }

  private mistake(key: string, expected: string | null): void {
    this.mistakes++
    if (expected) this.stat(expected).ko++
    if (this.combo >= 5) this.emit({ type: 'comboBreak', combo: this.combo })
    this.combo = 0
    this.pace = clamp(this.pace - 0.004, ...this.paceRange())
    this.emit({ type: 'mistake', key, expected })
  }

  private paceRange(): [number, number] {
    return this.mode === 'endless' ? [0.6, 1.8] : [0.55, 1.5]
  }

  private advanceProjectiles(): void {
    if (this.projectiles.length === 0) return
    const remaining: Projectile[] = []
    for (const p of this.projectiles) {
      if (this.time < p.born + p.duration) {
        remaining.push(p)
        continue
      }
      const enemy = this.enemies.find((e) => e.id === p.targetId)
      if (!enemy) continue
      enemy.lastHit = this.time
      if (!p.final) {
        this.emit({ type: 'hit', enemy })
      } else if (enemy.kind === 'boss') {
        this.damageBoss(enemy)
      } else {
        this.kill(enemy, false)
      }
    }
    this.projectiles = remaining
  }

  private damageBoss(boss: Enemy): void {
    boss.hp--
    this.score += 100 * this.multiplier
    if (boss.hp <= 0) {
      this.kill(boss, false)
      return
    }
    boss.text = this.bossText()
    boss.typed = 0
    boss.doomed = false
    this.emit({ type: 'bossHit', enemy: boss })
  }

  private kill(enemy: Enemy, byBomb: boolean): void {
    const m = this.multiplier
    let points: number
    if (enemy.kind === 'boss') {
      points = 1000 * m
      this.bossDefeated = true
    } else if (byBomb) {
      points = 25 * m
    } else {
      points = (50 + 25 * (enemy.text.length - 1)) * m + Math.round(40 * (1 - clamp(enemy.y, 0, 1)))
      if (enemy.kind === 'golden') points *= 3
    }
    this.score += points
    this.kills++
    if (enemy.kind === 'golden') {
      this.goldenKills++
      this.coins += 3
    }
    if (enemy.kind === 'normal' || enemy.kind === 'golden') {
      this.quotaResolved++
      this.waveKills++
      // Killed high on screen: the child is comfortable, speed up a notch.
      const [lo, hi] = this.paceRange()
      if (enemy.y < 0.45) this.pace = clamp(this.pace + 0.03, lo, hi)
      else if (enemy.y > 0.8) this.pace = clamp(this.pace - 0.02, lo, hi)
    }
    this.enemies = this.enemies.filter((e) => e.id !== enemy.id)
    if (this.lockId === enemy.id) this.lockId = null
    this.emit({ type: 'kill', enemy, points, byBomb })

    if (enemy.kind === 'powerup' && enemy.power) this.applyPower(enemy.power, enemy)
    if (enemy.kind === 'boss') this.onBossDown()
  }

  private applyPower(power: Power, source: Enemy): void {
    this.powerupsUsed++
    this.emit({ type: 'powerup', power, enemy: source })
    if (power === 'freeze') this.freezeUntil = this.time + FREEZE_SECONDS
    else if (power === 'heal') this.hearts = Math.min(this.maxHearts, this.hearts + 1)
    else {
      const victims = this.enemies.filter((e) => e.kind !== 'boss' && !e.doomed)
      for (const v of victims) this.kill(v, true)
    }
  }

  private onBossDown(): void {
    if (this.mode === 'campaign') {
      for (const v of this.enemies.filter((e) => !e.doomed)) this.kill(v, true)
      this.endAt = this.time + VICTORY_DELAY
      this.emit({ type: 'victory' })
    } else {
      this.startWave(this.wave + 1)
    }
  }

  private startWave(wave: number): void {
    this.wave = wave
    this.waveKills = 0
    const boss = isBossWave(wave)
    if (boss) this.bossPending = 2
    this.emit({ type: 'wave', wave, boss })
  }

  private checkBreaches(): void {
    for (const e of [...this.enemies]) {
      if (e.doomed || e.kind === 'boss' || e.y < 1) continue
      this.enemies = this.enemies.filter((o) => o.id !== e.id)
      if (this.lockId === e.id) this.lockId = null
      if (e.kind === 'powerup') {
        this.emit({ type: 'escape', enemy: e })
        continue
      }
      this.quotaResolved++
      this.breaches++
      this.hearts = Math.max(0, this.hearts - 1)
      if (this.combo >= 5) this.emit({ type: 'comboBreak', combo: this.combo })
      this.combo = 0
      this.pace = clamp(this.pace - 0.12, ...this.paceRange())
      this.emit({ type: 'breach', enemy: e })
      if (this.hearts === 0) {
        this.endAt = this.time + DEFEAT_DELAY
        this.projectiles = []
        this.emit({ type: 'defeat' })
        return
      }
    }
  }

  private checkCompletion(): void {
    if (this.endAt !== null) return
    if (this.mode === 'endless') {
      if (!isBossWave(this.wave) && this.waveKills >= endlessWaveTarget(this.wave))
        this.startWave(this.wave + 1)
      return
    }
    const level = this.level
    if (!level || level.boss) return
    if (
      this.quotaSpawned >= level.enemies &&
      this.enemies.length === 0 &&
      this.projectiles.length === 0
    ) {
      this.endAt = this.time + VICTORY_DELAY
      this.emit({ type: 'victory' })
    }
  }

  private canSpawn(): boolean {
    if (this.level && !this.level.boss) return this.quotaSpawned < this.level.enemies
    if (this.level?.boss) return !this.bossDefeated
    // Endless boss wave: let the boss arrive before minions pour in.
    return this.bossPending === null
  }

  private moveEnemies(dt: number): void {
    const speed = this.pace * (this.frozen ? FREEZE_FACTOR : 1)
    for (const e of this.enemies) {
      if (e.kind === 'boss') {
        e.y += (BOSS_Y - e.y) * Math.min(1, dt * 1.5)
        e.x = 0.5 + 0.28 * Math.sin((this.time - e.born) * 0.35)
        continue
      }
      e.y += e.vy * speed * dt
      e.x = e.baseX + e.wobbleAmp * Math.sin((this.time - e.born) * e.wobbleFreq + e.wobblePhase)
    }
  }

  private tuning(): Tuning {
    const level = this.level
    if (level) {
      return {
        pool: level.pool,
        focus: level.newKeys,
        wordChance: level.kind === 'words' ? 1 : 0,
        wordLen: level.wordLen,
        fallTime: level.fallTime,
        fallPerChar: level.fallPerChar,
        spawnEvery: level.boss ? level.spawnEvery * 1.4 : level.spawnEvery,
        maxOnScreen: level.maxOnScreen,
        powerups: level.powerups,
      }
    }
    const w = this.wave
    const reader = this.endless?.reader ?? false
    const pool = this.endless?.pool.length ? this.endless.pool : ['f', 'j']
    return {
      pool,
      focus: [],
      wordChance: reader ? Math.min(0.85, 0.25 + 0.08 * (w - 1)) : 0,
      wordLen: [Math.min(5, 2 + Math.floor(w / 4)), Math.min(10, 3 + Math.floor(w / 2))],
      fallTime: Math.max(4, 12 - 0.6 * (w - 1)),
      fallPerChar: Math.max(0.5, 1.3 - 0.06 * (w - 1)),
      spawnEvery: Math.max(0.6, 2.4 - 0.15 * (w - 1)) * (isBossWave(w) ? 1.4 : 1),
      maxOnScreen: Math.min(9, 2 + Math.floor((w - 1) / 1.5)),
      powerups: true,
    }
  }

  private firstLettersOnScreen(): Set<string> {
    const set = new Set<string>()
    for (const e of this.enemies) if (!e.doomed) set.add(e.text[e.typed] ?? '')
    return set
  }

  private pickLetter(pool: readonly string[], focus: readonly string[]): string {
    const taken = this.firstLettersOnScreen()
    const free = pool.filter((k) => !taken.has(k))
    const candidates = free.length > 0 ? free : pool
    return weightedPick(
      this.rng,
      candidates,
      (k) => (focus.includes(k) ? 3 : 1) * this.keyWeight(k),
    )
  }

  private pickWord(minLen: number, maxLen: number): string {
    const taken = this.firstLettersOnScreen()
    let candidates = this.words.filter((w) => w.length >= minLen && w.length <= maxLen)
    if (candidates.length === 0) candidates = [...this.words]
    if (candidates.length === 0) return pick(this.rng, ['a', 'b', 'c'])
    const fresh = candidates.filter((w) => !taken.has(w[0] ?? '') && !this.recentWords.includes(w))
    const word = pick(this.rng, fresh.length > 0 ? fresh : candidates)
    this.recentWords.push(word)
    if (this.recentWords.length > 12) this.recentWords.shift()
    return word
  }

  private bossText(): string {
    const t = this.tuning()
    const useWords = this.level ? this.level.kind === 'words' : t.wordChance > 0.5
    if (useWords) return this.pickWord(Math.max(3, t.wordLen[0]), Math.max(4, t.wordLen[1]))
    let s = ''
    for (let i = 0; i < 3; i++) {
      s += weightedPick(this.rng, t.pool, (k) => this.keyWeight(k) * (s.endsWith(k) ? 0.2 : 1))
    }
    return s
  }

  private spawnBoss(): void {
    const hp = this.level ? this.level.bossHp : 4 + Math.floor(this.wave / 5) * 2
    const boss: Enemy = {
      id: this.nextId++,
      kind: 'boss',
      power: null,
      text: this.bossText(),
      typed: 0,
      x: 0.5,
      y: -0.25,
      baseX: 0.5,
      vy: 0,
      wobbleAmp: 0,
      wobbleFreq: 0,
      wobblePhase: 0,
      species: Math.floor(this.rng() * SPECIES),
      palette: Math.floor(this.rng() * PALETTES),
      born: this.time,
      doomed: false,
      hp,
      maxHp: hp,
      lastHit: -1,
    }
    this.enemies.push(boss)
    this.emit({ type: 'bossSpawn', enemy: boss })
  }

  private spawn(t: Tuning): void {
    let kind: EnemyKind = 'normal'
    const hasPowerup = this.enemies.some((e) => e.kind === 'powerup')
    const roll = this.rng()
    if (t.powerups && !hasPowerup && this.time > 8 && roll < 0.06) kind = 'powerup'
    else if (roll > 0.93) kind = 'golden'

    const useWord = kind !== 'powerup' && this.rng() < t.wordChance
    const text = useWord
      ? this.pickWord(t.wordLen[0], t.wordLen[1])
      : this.pickLetter(t.pool, t.focus)
    const margin = useWord ? 0.12 + Math.min(0.06, text.length * 0.008) : 0.07
    const x = this.pickX(margin)
    let power: Power | null = null
    if (kind === 'powerup') {
      const options = POWERS.filter((p) => p !== 'heal' || this.hearts < this.maxHearts)
      power = pick(this.rng, options)
    }
    const fall = t.fallTime + t.fallPerChar * text.length
    const enemy: Enemy = {
      id: this.nextId++,
      kind,
      power,
      text,
      typed: 0,
      x,
      y: -0.06,
      baseX: x,
      vy: (1 / fall) * (kind === 'golden' ? 1.15 : kind === 'powerup' ? 1.25 : 1),
      wobbleAmp: randRange(this.rng, 0.005, useWord ? 0.015 : 0.03),
      wobbleFreq: randRange(this.rng, 0.6, 1.4),
      wobblePhase: randRange(this.rng, 0, Math.PI * 2),
      species: Math.floor(this.rng() * SPECIES),
      palette: Math.floor(this.rng() * PALETTES),
      born: this.time,
      doomed: false,
      hp: 1,
      maxHp: 1,
      lastHit: -1,
    }
    this.enemies.push(enemy)
    if (kind !== 'powerup') this.quotaSpawned++
    this.emit({ type: 'spawn', enemy })
  }

  /** Choose a column far from the invaders that are still near the top. */
  private pickX(margin: number): number {
    const near = this.enemies.filter((e) => e.y < 0.35 && e.kind !== 'boss')
    let bestX = 0.5
    let bestScore = -1
    for (let i = 0; i < 7; i++) {
      const x = randRange(this.rng, margin, 1 - margin)
      let score = 1
      for (const e of near) score = Math.min(score, Math.abs(e.x - x))
      if (score > bestScore) {
        bestScore = score
        bestX = x
      }
    }
    return bestX
  }
}
