import { describe, expect, it } from 'vitest'
import { createProfile } from '../src/state/profile'
import { openStore, parseSave, STORAGE_KEY } from '../src/state/storage'

class MemoryStorage implements Storage {
  private map = new Map<string, string>()
  get length(): number {
    return this.map.size
  }
  clear(): void {
    this.map.clear()
  }
  getItem(key: string): string | null {
    return this.map.get(key) ?? null
  }
  key(i: number): string | null {
    return [...this.map.keys()][i] ?? null
  }
  removeItem(key: string): void {
    this.map.delete(key)
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value)
  }
}

describe('save data', () => {
  it('falls back to defaults on missing or broken data', () => {
    expect(parseSave(null, 'fr-FR').settings).toMatchObject({ lang: 'fr', layout: 'azerty' })
    expect(parseSave('{not json', 'en-US').settings).toMatchObject({ lang: 'en', layout: 'qwerty' })
    expect(parseSave('[1,2]').profiles).toEqual([])
  })

  it('round-trips through storage', () => {
    const storage = new MemoryStorage()
    const store = openStore(storage, 'fr')
    const p = createProfile('Lina', '🦊', false)
    p.coins = 42
    p.levels['1-1'] = { stars: 2, best: 900 }
    store.data.profiles.push(p)
    store.data.lastProfileId = p.id
    store.save()
    const again = openStore(storage, 'fr')
    expect(again.data.profiles[0]).toEqual(p)
    expect(again.data.lastProfileId).toBe(p.id)
  })

  it('sanitises tampered values', () => {
    const raw = JSON.stringify({
      settings: { lang: 'de', music: 7, voice: 'yes' },
      profiles: [
        {
          id: 'a',
          name: 'X',
          coins: -5,
          levels: { '1-1': { stars: 9, best: 'lots' } },
          ships: ['ufo'],
          ship: 'ufo',
          keyStats: { '!': { ok: 1 } },
        },
        { name: 'no id' },
      ],
      lastProfileId: 'ghost',
    })
    const data = parseSave(raw, 'fr')
    expect(data.settings.lang).toBe('fr')
    expect(data.settings.music).toBe(1)
    expect(data.settings.voice).toBe(true)
    expect(data.profiles).toHaveLength(1)
    const p = data.profiles[0]
    expect(p?.coins).toBe(0)
    expect(p?.levels['1-1']).toEqual({ stars: 3, best: 0 })
    expect(p?.ships).toEqual(['comet'])
    expect(p?.ship).toBe('comet')
    expect(p?.keyStats).toEqual({})
    expect(data.lastProfileId).toBeNull()
  })

  it('survives a storage that throws', () => {
    const broken = new MemoryStorage()
    broken.setItem = () => {
      throw new Error('quota')
    }
    const store = openStore(broken)
    expect(() => store.save()).not.toThrow()
    expect(STORAGE_KEY).toContain('v2')
  })
})
