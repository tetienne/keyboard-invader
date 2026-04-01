import { describe, it, expect } from 'vitest'
import type { GameMode, SessionResult, StateName } from '@/game/types.js'
import { TRANSITIONS } from '@/game/types.js'
import frWords from '@/shared/i18n/fr.words.json'
import enWords from '@/shared/i18n/en.words.json'

describe('GameMode type', () => {
  it('accepts letters and words values', () => {
    const letters: GameMode = 'letters'
    const words: GameMode = 'words'
    expect(letters).toBe('letters')
    expect(words).toBe('words')
  })
})

describe('StateName includes profiles', () => {
  it('profiles is a valid StateName', () => {
    const name: StateName = 'profiles'
    expect(name).toBe('profiles')
  })
})

describe('TRANSITIONS for profiles', () => {
  it('boot transitions to profiles', () => {
    expect(TRANSITIONS.boot).toEqual(['profiles'])
  })

  it('profiles transitions to menu', () => {
    expect(TRANSITIONS.profiles).toEqual(['menu'])
  })

  it('menu includes profiles for back-link', () => {
    expect(TRANSITIONS.menu).toContain('profiles')
    expect(TRANSITIONS.menu).toContain('playing')
  })
})

describe('SessionResult extensions', () => {
  it('includes timePlayed and mode fields', () => {
    const result: SessionResult = {
      hits: 10,
      misses: 2,
      total: 12,
      timePlayed: 30000,
      mode: 'letters',
    }
    expect(result.timePlayed).toBe(30000)
    expect(result.mode).toBe('letters')
  })
})

describe('Word list JSONs', () => {
  it('fr.words.json has short and medium arrays', () => {
    expect(Array.isArray(frWords.short)).toBe(true)
    expect(Array.isArray(frWords.medium)).toBe(true)
    expect(frWords.short.length).toBe(25)
    expect(frWords.medium.length).toBe(20)
  })

  it('en.words.json has short and medium arrays', () => {
    expect(Array.isArray(enWords.short)).toBe(true)
    expect(Array.isArray(enWords.medium)).toBe(true)
    expect(enWords.short.length).toBe(25)
    expect(enWords.medium.length).toBe(20)
  })

  it('all entries are strings', () => {
    for (const w of [...frWords.short, ...frWords.medium]) {
      expect(typeof w).toBe('string')
    }
    for (const w of [...enWords.short, ...enWords.medium]) {
      expect(typeof w).toBe('string')
    }
  })
})
