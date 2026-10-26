import { describe, expect, it } from 'vitest'
import { campaign, WORLD_COUNT, WORLD_THEMES } from '../src/content/campaign'
import { dictionaries } from '../src/core/i18n'
import { createRng } from '../src/core/rng'
import type { GameEvent } from '../src/game/session'
import { ALIEN_PALETTES } from '../src/render/art'
import { level, makeSession, run } from './helpers'

describe('world identity', () => {
  it('gives every world an alien family, a style, a boss name and a travel callout', () => {
    expect(WORLD_THEMES).toHaveLength(WORLD_COUNT)
    const styles = new Set(WORLD_THEMES.map((th) => th.style))
    expect(styles.size).toBe(WORLD_COUNT)
    for (const [i, theme] of WORLD_THEMES.entries()) {
      expect(theme.species.length).toBeGreaterThanOrEqual(1)
      expect(theme.species.length).toBeLessThanOrEqual(2)
      for (const sp of theme.species) expect(sp).toBeGreaterThanOrEqual(0)
      for (const sp of theme.species) expect(sp).toBeLessThan(6)
      expect(theme.palettes.length).toBeGreaterThan(0)
      for (const p of theme.palettes) expect(p).toBeLessThan(ALIEN_PALETTES.length)
      for (const dict of Object.values(dictionaries)) {
        expect(dict[`boss.${i}` as 'boss.0']).toBeTruthy()
        expect(dict[`travel.${i}` as 'travel.0']).toBeTruthy()
      }
    }
  })

  it('spawns campaign invaders from their world family only', () => {
    for (const world of campaign('azerty')) {
      const first = world.levels[1] ?? world.levels[0]
      if (!first) throw new Error('empty world')
      const s = makeSession({ level: level(first.id) })
      const spawned = run(s, 40).filter((e) => e.type === 'spawn')
      expect(spawned.length).toBeGreaterThan(2)
      for (const e of spawned) {
        expect(world.theme.species).toContain(e.enemy.species)
        expect(world.theme.palettes).toContain(e.enemy.palette)
      }
    }
  })

  it('stays deterministic for a given seed', () => {
    const looks = run(makeSession({ level: level('3-2'), rng: createRng(7) }), 30)
      .filter((e) => e.type === 'spawn')
      .map((e) => `${e.enemy.species}/${e.enemy.palette}`)
      .join(',')
    expect(looks).toBe('4/8,4/2,5/2,4/2')
  })

  it('announces the boss of the level world', () => {
    const boss = campaign('azerty')[2]?.levels.at(-1)
    if (!boss) throw new Error('no boss')
    const intro = run(makeSession({ level: level(boss.id) }), 0.1)
    const incoming = intro.find(
      (e): e is Extract<GameEvent, { type: 'bossIncoming' }> => e.type === 'bossIncoming',
    )
    expect(incoming?.world).toBe(2)
  })
})
