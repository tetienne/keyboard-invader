import type { ProfileRepository } from './repository.js'
import type { ProfileData, StorageEnvelope } from './types.js'
import { CURRENT_SCHEMA_VERSION, MAX_PROFILES } from './types.js'
import { migrateIfNeeded } from './schema.js'

const STORAGE_KEY = 'keyboard-invader-profiles'

export class LocalStorageProfileRepository implements ProfileRepository {
  loadAll(): ProfileData[] {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []

    try {
      const parsed = JSON.parse(raw) as StorageEnvelope
      return migrateIfNeeded(parsed)
    } catch {
      console.warn(
        'Corrupted profile data in localStorage, resetting to empty',
      )
      localStorage.removeItem(STORAGE_KEY)
      return []
    }
  }

  saveAll(profiles: ProfileData[]): void {
    if (profiles.length > MAX_PROFILES) {
      throw new Error(
        `Cannot save more than ${MAX_PROFILES} profiles (got ${profiles.length})`,
      )
    }

    const envelope: StorageEnvelope = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      profiles,
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope))
    } catch {
      console.warn('Failed to save profiles: storage quota exceeded')
    }
  }
}
