import { describe, it, expect } from 'vitest'
import { migrateIfNeeded } from '../../src/persistence/schema.js'
import { CURRENT_SCHEMA_VERSION, DEFAULT_UNLOCKED_AVATARS } from '../../src/persistence/types.js'
import type { StorageEnvelope, ProfileData } from '../../src/persistence/types.js'
import { AVATARS } from '../../src/avatars/definitions.js'

describe('migrateIfNeeded', () => {
  it('returns profiles unchanged when schemaVersion matches CURRENT_SCHEMA_VERSION', () => {
    const profiles = [
      {
        id: 'test-1',
        name: 'Lea',
        avatarId: 'avatar-red',
        cumulativeStats: {
          totalSessions: 1,
          totalHits: 10,
          totalMisses: 2,
          bestAccuracy: 83,
        },
        lastDifficultyParams: null,
        preferredGameMode: null,
        sessionHistory: [],
        createdAt: '2026-04-01T00:00:00.000Z',
        xp: 50,
        level: 2,
        unlockedAvatarIds: ['avatar-red', 'avatar-blue', 'avatar-green'],
      },
    ]
    const envelope: StorageEnvelope = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      profiles: profiles as unknown as ProfileData[],
    }

    const result = migrateIfNeeded(envelope)
    expect(result).toEqual(profiles)
  })

  it('applies v0->v1 defaults for missing fields in older schema versions', () => {
    const oldProfile = {
      id: 'test-1',
      name: 'Lea',
      avatarId: 'avatar-red',
      cumulativeStats: {
        totalSessions: 1,
        totalHits: 10,
        totalMisses: 2,
        bestAccuracy: 83,
      },
      createdAt: '2026-04-01T00:00:00.000Z',
    }
    const envelope: StorageEnvelope = {
      schemaVersion: 0,
      profiles: [oldProfile] as unknown as ProfileData[],
    }

    const result = migrateIfNeeded(envelope)
    expect(result).toHaveLength(1)
    const first = result[0]
    expect(first).toBeDefined()
    expect(first?.lastDifficultyParams).toBeNull()
    expect(first?.preferredGameMode).toBeNull()
    expect(first?.sessionHistory).toEqual([])
  })

  it('preserves existing fields while adding defaults for missing ones', () => {
    const oldProfile = {
      id: 'test-2',
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
      createdAt: '2026-04-01T00:00:00.000Z',
    }
    const envelope: StorageEnvelope = {
      schemaVersion: 0,
      profiles: [oldProfile] as unknown as ProfileData[],
    }

    const result = migrateIfNeeded(envelope)
    const first = result[0]
    expect(first).toBeDefined()
    expect(first?.lastDifficultyParams).toEqual({
      fallSpeed: 1.5,
      spawnInterval: 2000,
      complexityLevel: 2,
    })
    expect(first?.preferredGameMode).toBeNull()
    expect(first?.sessionHistory).toEqual([])
    expect(first?.name).toBe('Raphael')
  })

  it('migrates v1 profiles to v2 with xp, level, and unlockedAvatarIds defaults', () => {
    const v1Profile = {
      id: 'test-3',
      name: 'Alice',
      avatarId: 'avatar-green',
      cumulativeStats: {
        totalSessions: 3,
        totalHits: 50,
        totalMisses: 10,
        bestAccuracy: 90,
      },
      lastDifficultyParams: null,
      preferredGameMode: 'letters',
      sessionHistory: [{ hits: 10, misses: 2, accuracy: 83, mode: 'letters', date: '2026-04-01' }],
      createdAt: '2026-04-01T00:00:00.000Z',
    }
    const envelope: StorageEnvelope = {
      schemaVersion: 1,
      profiles: [v1Profile] as unknown as ProfileData[],
    }

    const result = migrateIfNeeded(envelope)
    expect(result).toHaveLength(1)
    const first = result[0]
    expect(first).toBeDefined()
    expect(first?.xp).toBe(0)
    expect(first?.level).toBe(1)
    expect(first?.unlockedAvatarIds).toEqual([...DEFAULT_UNLOCKED_AVATARS])
  })

  it('applies both v1 and v2 defaults for v0 profiles', () => {
    const v0Profile = {
      id: 'test-4',
      name: 'Bob',
      avatarId: 'avatar-red',
      cumulativeStats: {
        totalSessions: 0,
        totalHits: 0,
        totalMisses: 0,
        bestAccuracy: 0,
      },
      createdAt: '2026-04-01T00:00:00.000Z',
    }
    const envelope: StorageEnvelope = {
      schemaVersion: 0,
      profiles: [v0Profile] as unknown as ProfileData[],
    }

    const result = migrateIfNeeded(envelope)
    const first = result[0]
    expect(first).toBeDefined()
    // v1 defaults
    expect(first?.lastDifficultyParams).toBeNull()
    expect(first?.preferredGameMode).toBeNull()
    expect(first?.sessionHistory).toEqual([])
    // v2 defaults
    expect(first?.xp).toBe(0)
    expect(first?.level).toBe(1)
    expect(first?.unlockedAvatarIds).toEqual([...DEFAULT_UNLOCKED_AVATARS])
  })

  it('preserves existing v1 fields during v1->v2 migration', () => {
    const v1Profile = {
      id: 'test-5',
      name: 'Charlie',
      avatarId: 'avatar-blue',
      cumulativeStats: {
        totalSessions: 10,
        totalHits: 200,
        totalMisses: 30,
        bestAccuracy: 95,
      },
      lastDifficultyParams: { fallSpeed: 100, spawnInterval: 1000, complexityLevel: 2 },
      preferredGameMode: 'words',
      sessionHistory: [{ hits: 20, misses: 5, accuracy: 80, mode: 'words', date: '2026-04-01' }],
      createdAt: '2026-03-15T00:00:00.000Z',
    }
    const envelope: StorageEnvelope = {
      schemaVersion: 1,
      profiles: [v1Profile] as unknown as ProfileData[],
    }

    const result = migrateIfNeeded(envelope)
    const first = result[0]
    expect(first).toBeDefined()
    expect(first?.cumulativeStats.totalSessions).toBe(10)
    expect(first?.cumulativeStats.totalHits).toBe(200)
    expect(first?.sessionHistory).toHaveLength(1)
    expect(first?.preferredGameMode).toBe('words')
    expect(first?.lastDifficultyParams).toEqual({
      fallSpeed: 100,
      spawnInterval: 1000,
      complexityLevel: 2,
    })
  })

  it('returns v2 profiles unchanged', () => {
    const v2Profile = {
      id: 'test-6',
      name: 'Diana',
      avatarId: 'avatar-purple',
      cumulativeStats: {
        totalSessions: 5,
        totalHits: 100,
        totalMisses: 20,
        bestAccuracy: 90,
      },
      lastDifficultyParams: null,
      preferredGameMode: 'letters',
      sessionHistory: [],
      createdAt: '2026-04-01T00:00:00.000Z',
      xp: 300,
      level: 4,
      unlockedAvatarIds: ['avatar-red', 'avatar-blue', 'avatar-green', 'avatar-yellow'],
    }
    const envelope: StorageEnvelope = {
      schemaVersion: 2,
      profiles: [v2Profile] as unknown as ProfileData[],
    }

    const result = migrateIfNeeded(envelope)
    expect(result[0]).toEqual(v2Profile)
  })
})

describe('DEFAULT_UNLOCKED_AVATARS cross-validation', () => {
  it('contains exactly 3 avatar IDs', () => {
    expect(DEFAULT_UNLOCKED_AVATARS).toHaveLength(3)
  })

  it('contains the correct current avatar IDs', () => {
    expect(DEFAULT_UNLOCKED_AVATARS).toEqual(['avatar-kid-01', 'avatar-kid-02', 'avatar-alien-01'])
  })

  it('every ID exists in the AVATARS definitions array', () => {
    const validIds = AVATARS.map((a) => a.id)
    for (const id of DEFAULT_UNLOCKED_AVATARS) {
      expect(validIds).toContain(id)
    }
  })
})
