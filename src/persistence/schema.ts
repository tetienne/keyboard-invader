import type { StorageEnvelope, ProfileData } from './types.js'
import { CURRENT_SCHEMA_VERSION, DEFAULT_UNLOCKED_AVATARS } from './types.js'

export function migrateIfNeeded(envelope: StorageEnvelope): ProfileData[] {
  if (envelope.schemaVersion === CURRENT_SCHEMA_VERSION) {
    return envelope.profiles
  }

  return envelope.profiles.map((profile) => {
    const partial = profile as Partial<ProfileData>

    return {
      id: profile.id,
      name: profile.name,
      avatarId: profile.avatarId,
      cumulativeStats: profile.cumulativeStats,
      // v0 -> v1 defaults
      lastDifficultyParams: partial.lastDifficultyParams ?? null,
      preferredGameMode: partial.preferredGameMode ?? null,
      sessionHistory: partial.sessionHistory ?? [],
      createdAt: profile.createdAt,
      // v1 -> v2 defaults
      xp: partial.xp ?? 0,
      level: partial.level ?? 1,
      unlockedAvatarIds:
        partial.unlockedAvatarIds ?? [...DEFAULT_UNLOCKED_AVATARS],
    }
  })
}
