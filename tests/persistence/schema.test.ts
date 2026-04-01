import { describe, it, expect } from 'vitest'
import { migrateIfNeeded } from '../../src/persistence/schema.js'
import { CURRENT_SCHEMA_VERSION } from '../../src/persistence/types.js'
import type { StorageEnvelope } from '../../src/persistence/types.js'

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
      },
    ]
    const envelope: StorageEnvelope = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      profiles: profiles as any,
    }

    const result = migrateIfNeeded(envelope)
    expect(result).toEqual(profiles)
  })

  it('applies defaults for missing fields in older schema versions', () => {
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
      // Missing: lastDifficultyParams, preferredGameMode, sessionHistory
    }
    const envelope: StorageEnvelope = {
      schemaVersion: 0,
      profiles: [oldProfile] as any,
    }

    const result = migrateIfNeeded(envelope)
    expect(result).toHaveLength(1)
    expect(result[0].lastDifficultyParams).toBeNull()
    expect(result[0].preferredGameMode).toBeNull()
    expect(result[0].sessionHistory).toEqual([])
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
      // Missing: preferredGameMode, sessionHistory
    }
    const envelope: StorageEnvelope = {
      schemaVersion: 0,
      profiles: [oldProfile] as any,
    }

    const result = migrateIfNeeded(envelope)
    expect(result[0].lastDifficultyParams).toEqual({
      fallSpeed: 1.5,
      spawnInterval: 2000,
      complexityLevel: 2,
    })
    expect(result[0].preferredGameMode).toBeNull()
    expect(result[0].sessionHistory).toEqual([])
    expect(result[0].name).toBe('Raphael')
  })
})
