import { describe, expect, it } from 'vitest'
import { createRng } from '../src/core/rng'
import {
  BOSS_INTRO,
  endlessWaveTarget,
  multiplierFor,
  Session,
  SHOT_DURATION,
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
    expect(boss.text).toHaveLength(3)
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
