import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LocalStorageProfileRepository } from '../../src/persistence/local-storage.js'
import {
  CURRENT_SCHEMA_VERSION,
  MAX_PROFILES,
  generateProfileId,
  createDefaultStats,
} from '../../src/persistence/types.js'
import type { ProfileData, StorageEnvelope } from '../../src/persistence/types.js'

function createMockLocalStorage() {
  const store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    _store: store,
  }
}

function makeProfile(overrides: Partial<ProfileData> = {}): ProfileData {
  return {
    id: generateProfileId(),
    name: 'Test',
    avatarId: 'avatar-red',
    cumulativeStats: createDefaultStats(),
    lastDifficultyParams: null,
    preferredGameMode: null,
    sessionHistory: [],
    createdAt: new Date().toISOString(),
    xp: 0,
    level: 1,
    unlockedAvatarIds: ['avatar-red', 'avatar-blue', 'avatar-green'],
    ...overrides,
  }
}

describe('LocalStorageProfileRepository', () => {
  let mockStorage: ReturnType<typeof createMockLocalStorage>
  let repo: LocalStorageProfileRepository

  beforeEach(() => {
    mockStorage = createMockLocalStorage()
    vi.stubGlobal('localStorage', mockStorage)
    repo = new LocalStorageProfileRepository()
  })

  describe('loadAll', () => {
    it('returns empty array when localStorage is empty', () => {
      const result = repo.loadAll()
      expect(result).toEqual([])
    })

    it('returns parsed profiles when valid data exists', () => {
      const profile = makeProfile({ name: 'Lea' })
      const envelope: StorageEnvelope = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        profiles: [profile],
      }
      mockStorage._store['keyboard-invader-profiles'] =
        JSON.stringify(envelope)

      const result = repo.loadAll()
      expect(result).toHaveLength(1)
      expect(result[0]!.name).toBe('Lea')
    })

    it('returns empty array and removes key when JSON is corrupted', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      mockStorage._store['keyboard-invader-profiles'] = '{invalid json!!!'

      const result = repo.loadAll()
      expect(result).toEqual([])
      expect(mockStorage.removeItem).toHaveBeenCalledWith(
        'keyboard-invader-profiles',
      )
      warnSpy.mockRestore()
    })
  })

  describe('saveAll', () => {
    it('writes JSON under key keyboard-invader-profiles with schemaVersion envelope', () => {
      const profile = makeProfile()
      repo.saveAll([profile])

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'keyboard-invader-profiles',
        expect.any(String),
      )
      const written = JSON.parse(
        mockStorage.setItem.mock.calls[0]![1] as string,
      ) as StorageEnvelope
      expect(written.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
      expect(written.profiles).toHaveLength(1)
    })

    it('catches QuotaExceededError and does not throw', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      mockStorage.setItem.mockImplementation(() => {
        const err = new DOMException('quota exceeded', 'QuotaExceededError')
        throw err
      })

      expect(() => repo.saveAll([makeProfile()])).not.toThrow()
      expect(warnSpy).toHaveBeenCalled()
      warnSpy.mockRestore()
    })

    it('rejects when profiles array length > MAX_PROFILES', () => {
      const profiles = Array.from({ length: MAX_PROFILES + 1 }, () =>
        makeProfile(),
      )
      expect(() => repo.saveAll(profiles)).toThrow()
      expect(mockStorage.setItem).not.toHaveBeenCalled()
    })
  })

  describe('roundtrip', () => {
    it('loadAll + saveAll roundtrip preserves all profile fields', () => {
      const profile = makeProfile({
        name: 'Raphael',
        avatarId: 'avatar-blue',
        cumulativeStats: {
          totalSessions: 5,
          totalHits: 100,
          totalMisses: 20,
          bestAccuracy: 83,
        },
        lastDifficultyParams: {
          fallSpeed: 1.5,
          spawnInterval: 2000,
          complexityLevel: 2,
        },
        preferredGameMode: 'letters',
        sessionHistory: [
          {
            hits: 10,
            misses: 2,
            accuracy: 83,
            mode: 'letters',
            date: '2026-04-01T00:00:00.000Z',
          },
        ],
      })

      repo.saveAll([profile])
      const loaded = repo.loadAll()
      expect(loaded).toHaveLength(1)
      expect(loaded[0]).toEqual(profile)
    })
  })
})

describe('generateProfileId', () => {
  it('produces unique strings', () => {
    const ids = new Set<string>()
    for (let i = 0; i < 100; i++) {
      ids.add(generateProfileId())
    }
    expect(ids.size).toBe(100)
  })
})
