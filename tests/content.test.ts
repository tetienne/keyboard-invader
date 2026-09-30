import { describe, expect, it } from 'vitest'
import {
  campaign,
  findLevel,
  FIRST_WORD_WORLD,
  nextLevel,
  WORLD_COUNT,
} from '../src/content/campaign'
import { allLetters, fingerFor, LAYOUT_ROWS, type LayoutId } from '../src/content/keyboard'
import { LASERS, SHIPS } from '../src/content/ships'
import { wordList, wordsBetween, type Lang } from '../src/content/words'
import { dictionaries } from '../src/core/i18n'

const LAYOUTS: LayoutId[] = ['azerty', 'qwerty']
const LANGS: Lang[] = ['fr', 'en']

describe('keyboard layouts', () => {
  it.each(LAYOUTS)('%s has the 26 letters on 3 rows of 10 keys', (layout) => {
    for (const row of Object.values(LAYOUT_ROWS[layout])) expect(row).toHaveLength(10)
    expect(new Set(allLetters(layout)).size).toBe(26)
  })

  it('maps home keys to the right fingers', () => {
    expect(fingerFor('azerty', 'q')).toBe('lp')
    expect(fingerFor('azerty', 'f')).toBe('li')
    expect(fingerFor('azerty', 'j')).toBe('ri')
    expect(fingerFor('azerty', 'm')).toBe('rp')
    expect(fingerFor('qwerty', 'a')).toBe('lp')
    expect(fingerFor('qwerty', 'n')).toBe('ri')
  })
})

describe('campaign', () => {
  it.each(LAYOUTS)('%s: worlds end with a boss and ids are unique', (layout) => {
    const worlds = campaign(layout)
    expect(worlds).toHaveLength(WORLD_COUNT)
    const ids = worlds.flatMap((w) => w.levels.map((l) => l.id))
    expect(new Set(ids).size).toBe(ids.length)
    for (const w of worlds) {
      expect(w.levels.at(-1)?.boss).toBe(true)
      expect(w.levels.filter((l) => l.boss)).toHaveLength(1)
    }
  })

  it.each(LAYOUTS)('%s: letter lessons teach every letter, starting with F and J', (layout) => {
    const worlds = campaign(layout)
    expect(worlds[0]?.levels[0]?.newKeys).toEqual(['f', 'j'])
    const taught = new Set(
      worlds.slice(0, FIRST_WORD_WORLD).flatMap((w) => w.levels.flatMap((l) => l.newKeys)),
    )
    expect(taught.size).toBe(26)
    for (const w of worlds.slice(0, FIRST_WORD_WORLD)) {
      for (const l of w.levels) {
        expect(l.kind).toBe('letters')
        expect(l.pool.length).toBeGreaterThan(0)
        for (const k of l.newKeys) expect(l.pool).toContain(k)
        for (const k of l.pool) expect(k).toMatch(/^[a-z]$/)
      }
    }
  })

  it('gets harder along a world', () => {
    const w = campaign('azerty')[0]
    const first = w?.levels[0]
    const last = w?.levels.at(-2)
    expect(first && last && last.fallTime < first.fallTime).toBe(true)
  })

  it('chains levels across worlds', () => {
    const boss = findLevel('azerty', '1-8')
    expect(boss?.boss).toBe(true)
    expect(boss && nextLevel('azerty', boss)?.id).toBe('2-1')
  })
})

describe('words', () => {
  it.each(LANGS)('%s words only use plain a-z letters', (lang) => {
    for (const w of wordList(lang)) expect(w).toMatch(/^[a-z]+$/)
  })

  it.each(LANGS)('%s has enough words for every word world', (lang) => {
    for (const world of campaign('azerty').slice(FIRST_WORD_WORLD)) {
      const [min, max] = world.levels[0]?.wordLen ?? [0, 0]
      expect(wordsBetween(lang, min, max).length).toBeGreaterThanOrEqual(15)
    }
  })
})

describe('catalogues', () => {
  it('has a free starter ship and laser, and unique ids', () => {
    expect(SHIPS[0]?.price).toBe(0)
    expect(LASERS[0]?.price).toBe(0)
    expect(new Set(SHIPS.map((s) => s.id)).size).toBe(SHIPS.length)
    expect(new Set(LASERS.map((l) => l.id)).size).toBe(LASERS.length)
  })

  it('translates every string in both languages', () => {
    const fr = Object.keys(dictionaries.fr).sort()
    const en = Object.keys(dictionaries.en).sort()
    expect(en).toEqual(fr)
    for (const v of [...Object.values(dictionaries.fr), ...Object.values(dictionaries.en)])
      expect(v.length).toBeGreaterThan(0)
  })
})
