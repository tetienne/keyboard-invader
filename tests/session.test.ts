import { describe, expect, it } from 'vitest'
import { wordsBetween } from '../src/content/words'
import { createRng } from '../src/core/rng'
import {
  BOSS_INTRO,
  BOSS_LOW,
  BOSS_Y,
  endlessWaveTarget,
  multiplierFor,
  Session,
  SHOT_DURATION,
  type GameEvent,
} from '../src/game/session'
import { autoplay, level, makeSession, run, waitForEnemy } from './helpers'

describe('multiplier', () => {
  it('grows with the combo', () => {
    expect(multiplierFor(0)).toBe(1)
    expect(multiplierFor(7)).toBe(1)
    expect(multiplierFor(8)).toBe(2)
    expect(multiplierFor(20)).toBe(3)
    expect(multiplierFor(35)).toBe(4)
    expect(multiplierFor(1000)).toBe(5)
  })
})

describe('Session – letters', () => {
  it('spawns invaders carrying letters from the lesson pool', () => {
    const s = makeSession()
    run(s, 20)
    expect(s.quotaSpawned).toBeGreaterThan(0)
    for (const e of s.enemies) expect(['f', 'j']).toContain(e.text)
  })

  it('destroys the invader once the shot lands', () => {
    const s = makeSession()
    waitForEnemy(s)
    const target = s.enemies[0]
    expect(target).toBeDefined()
    if (!target) return
    s.press(target.text.toUpperCase())
    expect(target.doomed).toBe(true)
    const events = run(s, SHOT_DURATION + 0.05)
    expect(events.some((e) => e.type === 'kill' && e.enemy.id === target.id)).toBe(true)
    expect(s.kills).toBe(1)
    expect(s.score).toBeGreaterThan(50)
    expect(s.combo).toBe(1)
  })

  it('counts a wrong key as a gentle mistake that resets the combo', () => {
    const s = makeSession()
    waitForEnemy(s)
    const target = s.enemies[0]
    if (!target) throw new Error('no enemy')
    s.press(target.text)
    s.press('z')
    const events = s.drainEvents()
    expect(events.some((e) => e.type === 'mistake')).toBe(true)
    expect(s.combo).toBe(0)
    expect(s.mistakes).toBe(1)
    expect(s.hearts).toBe(s.maxHearts)
  })

  it('ignores non-letter keys', () => {
    const s = makeSession()
    waitForEnemy(s)
    s.press('1')
    s.press('Shift')
    expect(s.mistakes).toBe(0)
  })

  it('targets the lowest invader when several share a letter', () => {
    const s = makeSession({ level: level('1-1', { pool: ['f'], maxOnScreen: 3, spawnEvery: 0.5 }) })
    run(s, 4)
    expect(s.enemies.length).toBeGreaterThan(1)
    const lowest = [...s.enemies].sort((a, b) => b.y - a.y)[0]
    s.press('f')
    expect(lowest?.doomed).toBe(true)
  })

  it('loses a heart when an invader reaches the shield and ends at zero', () => {
    const s = makeSession({
      level: level('1-1', { fallTime: 1, spawnEvery: 0.3, maxOnScreen: 5, enemies: 50 }),
      hearts: 2,
    })
    const events = run(s, 10)
    expect(events.filter((e) => e.type === 'breach')).toHaveLength(2)
    expect(events.some((e) => e.type === 'defeat')).toBe(true)
    expect(s.status).toBe('lost')
    expect(s.result().won).toBe(false)
  })

  it('slows down after breaches (adaptive pace)', () => {
    const s = makeSession({ level: level('1-1', { fallTime: 1, spawnEvery: 0.3 }) })
    run(s, 3)
    expect(s.pace).toBeLessThan(1)
  })

  it('caps the campaign pace at 1.2 however fast the child plays', () => {
    const s = makeSession({ level: level('1-1', { enemies: 80, maxOnScreen: 3, spawnEvery: 0.6 }) })
    let max = s.pace
    for (let t = 0; t < 300 && s.status === 'playing'; t += 1 / 30) {
      const key = s.nextKeyHint()
      if (key && !s.ending) s.press(key)
      s.update(1 / 30)
      s.drainEvents()
      max = Math.max(max, s.pace)
    }
    expect(max).toBeCloseTo(1.2)
  })

  it('a mistake slows the campaign pace down noticeably', () => {
    const s = makeSession()
    waitForEnemy(s)
    s.press('z')
    expect(s.pace).toBeCloseTo(0.98)
  })

  it('halves the fall speed close to the shield', () => {
    const s = makeSession()
    waitForEnemy(s)
    const e = s.enemies[0]
    if (!e) throw new Error('no enemy')
    const step = (y: number): number => {
      e.y = y
      s.update(0.05)
      return e.y - y
    }
    expect(step(0.75) / step(0.5)).toBeCloseTo(0.5)
  })

  it('caps the combined focus and struggle weight of a letter', () => {
    const s = makeSession({
      level: level('1-1', { pool: ['f', 'j', 'd'], newKeys: ['f'], maxOnScreen: 1, enemies: 400 }),
      keyWeight: (k) => (k === 'f' ? 3.5 : 1),
    })
    const letters: string[] = []
    for (let t = 0; t < 600 && s.status === 'playing'; t += 1 / 30) {
      const key = s.nextKeyHint()
      if (key && !s.ending) s.press(key)
      s.update(1 / 30)
      for (const ev of s.drainEvents()) if (ev.type === 'spawn') letters.push(ev.enemy.text)
    }
    expect(letters.length).toBeGreaterThan(300)
    // Weights 3:1:1 once capped (uncapped 10.5:1:1 would give ~84%).
    const share = letters.filter((l) => l === 'f').length / letters.length
    expect(share).toBeGreaterThan(0.5)
    expect(share).toBeLessThan(0.7)
  })

  it('is won once the quota is cleared', () => {
    const s = makeSession()
    autoplay(s)
    expect(s.status).toBe('won')
    const r = s.result()
    expect(r.won).toBe(true)
    expect(r.kills).toBeGreaterThanOrEqual(level('1-1').enemies)
    expect(r.accuracy).toBe(1)
    expect(r.breaches).toBe(0)
  })
})

describe('Session – words', () => {
  const words = ['chat', 'lune', 'robot']

  it('locks on the first letter and requires the rest of the word', () => {
    const s = makeSession({ words, level: level('4-1', { wordLen: [4, 5], powerups: false }) })
    waitForEnemy(s)
    const target = s.enemies[0]
    if (!target) throw new Error('no enemy')
    s.press(target.text[0] ?? '')
    expect(s.lockId).toBe(target.id)
    expect(target.typed).toBe(1)
    s.press('q')
    expect(s.lockId).toBe(target.id)
    expect(s.mistakes).toBe(1)
    for (const ch of target.text.slice(1)) s.press(ch)
    expect(target.doomed).toBe(true)
    expect(s.lockId).toBeNull()
  })

  it('releases the lock on demand', () => {
    const s = makeSession({ words, level: level('4-1', { wordLen: [4, 5], powerups: false }) })
    waitForEnemy(s)
    const target = s.enemies[0]
    if (!target) throw new Error('no enemy')
    s.press(target.text[0] ?? '')
    s.releaseLock()
    expect(s.lockId).toBeNull()
  })

  it('awards more points for longer words', () => {
    const s = makeSession({
      words: ['robot'],
      level: level('4-1', { wordLen: [5, 5], powerups: false }),
    })
    waitForEnemy(s)
    const target = s.enemies[0]
    if (!target) throw new Error('no enemy')
    for (const ch of target.text) s.press(ch)
    const kill = run(s, 0.3).find((e) => e.type === 'kill')
    expect(kill?.type === 'kill' && kill.points).toBeGreaterThan(150)
  })
})

/** A child typing the hinted key every `interval` seconds once the boss shows up. */
function duel(s: Session, interval: number, maxSeconds = 300): GameEvent[] {
  const events: GameEvent[] = []
  let next: number | null = null
  for (let t = 0; t < maxSeconds && s.status === 'playing'; t += 1 / 60) {
    if (s.boss && next === null) next = s.time + interval
    if (next !== null && s.time >= next && !s.ending) {
      const key = s.nextKeyHint()
      if (key) s.press(key)
      next += interval
    }
    s.update(1 / 60)
    events.push(...s.drainEvents())
  }
  return events
}

describe('Session – boss', () => {
  it('spawns a boss whose hit points drop with each completed code', () => {
    const s = makeSession({ level: level('1-8') })
    const intro = run(s, BOSS_INTRO - 0.2)
    expect(intro.some((e) => e.type === 'bossIncoming')).toBe(true)
    expect(s.enemies).toHaveLength(0)
    run(s, 0.5)
    const boss = s.boss
    expect(boss).toBeDefined()
    if (!boss) return
    expect(boss.text).toHaveLength(2)
    const hp = boss.hp
    for (const ch of boss.text) {
      s.releaseLock()
      s.lockId = boss.id
      s.press(ch)
    }
    run(s, 0.3)
    expect(boss.hp).toBe(hp - 1)
  })

  it('is won when the boss falls', () => {
    const s = makeSession({ level: level('1-8') })
    autoplay(s)
    expect(s.status).toBe('won')
    expect(s.bossDefeated).toBe(true)
  })

  it('gets gentle hit points and short codes', () => {
    const hp = ['1-8', '2-8', '3-8', '4-6', '5-6', '6-6'].map((id) => level(id).bossHp)
    expect(hp).toEqual([4, 5, 6, 4, 5, 6])
    const s = makeSession({ words: wordsBetween('fr', 5, 10), level: level('6-6') })
    const codes: string[] = []
    for (let t = 0; t < 300 && s.status === 'playing'; t += 1 / 30) {
      const key = s.nextKeyHint()
      if (key && !s.ending) s.press(key)
      s.update(1 / 30)
      for (const e of s.drainEvents())
        if (e.type === 'bossSpawn' || e.type === 'bossHit') codes.push(e.enemy.text)
    }
    expect(codes).toHaveLength(6)
    for (const code of codes) expect(code.length).toBeLessThanOrEqual(6)
  })

  it.each([1, 2, 3, 4, 5])(
    'a slow child (one key every 2.5 s) beats the first boss without a breach (seed %i)',
    (seed) => {
      const s = makeSession({ rng: createRng(seed), level: level('1-8') })
      const events = duel(s, 2.5)
      expect(s.status).toBe('won')
      expect(s.breaches).toBe(0)
      expect(events.some((e) => e.type === 'spawn')).toBe(false)
    },
  )

  it.each([1, 2, 3, 4, 5])(
    'one key every 1.2 s beats the last word boss without a breach (seed %i)',
    (seed) => {
      const s = makeSession({
        rng: createRng(seed),
        words: wordsBetween('fr', 5, 10),
        level: level('6-6'),
      })
      const events = duel(s, 1.2)
      expect(s.status).toBe('won')
      expect(s.breaches).toBe(0)
      expect(events.some((e) => e.type === 'spawn')).toBe(false)
    },
  )

  it('costs an idle child one heart, then climbs smoothly back up', () => {
    const s = makeSession({ level: level('1-8') })
    const events: GameEvent[] = []
    let y = 0
    for (let t = 0; t < 60 && !events.some((e) => e.type === 'breach'); t += 1 / 60) {
      s.update(1 / 60)
      events.push(...s.drainEvents())
      y = s.boss?.y ?? 0
    }
    const breach = events.find((e) => e.type === 'breach')
    expect(breach?.enemy.kind).toBe('boss')
    expect(s.time).toBeGreaterThan(BOSS_INTRO + 8)
    expect(s.hearts).toBe(s.maxHearts - 1)
    expect(y).toBeGreaterThan(BOSS_LOW - 0.05)
    let maxStep = 0
    for (let t = 0; t < 2; t += 1 / 60) {
      s.update(1 / 60)
      events.push(...s.drainEvents())
      const next = s.boss?.y ?? 0
      maxStep = Math.max(maxStep, Math.abs(next - y))
      y = next
    }
    expect(y).toBeLessThan(BOSS_Y + 0.1)
    expect(maxStep).toBeLessThan(0.02)
    expect(s.hearts).toBe(s.maxHearts - 1)
    expect(events.some((e) => e.type === 'spawn')).toBe(false)
  })
})

describe('Session – endless', () => {
  it('advances waves and ends when the shield breaks', () => {
    const s = new Session({
      rng: createRng(3),
      words: ['chat'],
      endless: { pool: ['f', 'j', 'd', 'k'], reader: false },
    })
    for (let t = 0; t < 400 && s.wave < 3; t += 1 / 30) {
      const key = s.nextKeyHint()
      if (key) s.press(key)
      s.update(1 / 30)
      s.drainEvents()
    }
    expect(s.wave).toBeGreaterThanOrEqual(3)
    expect(endlessWaveTarget(1)).toBeLessThan(endlessWaveTarget(5))
    run(s, 600)
    expect(s.status).toBe('lost')
    expect(s.result().mode).toBe('endless')
  })

  it('fights the boss wave one-on-one, then minions come back', () => {
    const s = new Session({
      rng: createRng(3),
      words: ['chat'],
      endless: { pool: ['f', 'j', 'd', 'k'], reader: false },
    })
    let inBoss = false
    let leftovers = 0
    let duringBoss = 0
    let afterBoss = 0
    for (let t = 0; t < 900 && s.wave < 7 && s.status === 'playing'; t += 1 / 30) {
      const key = s.nextKeyHint()
      if (key) s.press(key)
      s.update(1 / 30)
      for (const e of s.drainEvents()) {
        if (e.type === 'bossIncoming') {
          inBoss = true
          leftovers = s.enemies.filter((o) => !o.doomed).length
        } else if (e.type === 'wave' && !e.boss) inBoss = false
        else if (e.type === 'spawn' && inBoss) duringBoss++
        else if (e.type === 'spawn' && s.wave === 6) afterBoss++
      }
    }
    expect(s.wave).toBeGreaterThanOrEqual(6)
    expect(leftovers).toBe(0)
    expect(duringBoss).toBe(0)
    expect(afterBoss).toBeGreaterThan(0)
  })
})

describe('Session – power-ups', () => {
  it('bomb clears the screen', () => {
    const s = makeSession({ level: level('1-3', { maxOnScreen: 6, spawnEvery: 0.4, enemies: 40 }) })
    run(s, 3)
    const count = s.enemies.length
    expect(count).toBeGreaterThan(1)
    const capsule = [...s.enemies].sort((a, b) => b.y - a.y)[0]
    if (!capsule) throw new Error('no enemy')
    capsule.kind = 'powerup'
    capsule.power = 'bomb'
    s.press(capsule.text)
    const events = run(s, 0.3)
    expect(events.some((e) => e.type === 'powerup' && e.power === 'bomb')).toBe(true)
    expect(events.filter((e) => e.type === 'kill').length).toBeGreaterThanOrEqual(count)
  })
})
