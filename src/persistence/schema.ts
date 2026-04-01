import type { StorageEnvelope, ProfileData } from './types.js'
import { CURRENT_SCHEMA_VERSION } from './types.js'

export function migrateIfNeeded(envelope: StorageEnvelope): ProfileData[] {
  if (envelope.schemaVersion === CURRENT_SCHEMA_VERSION) {
    return envelope.profiles
  }

  return envelope.profiles.map((profile) => ({
    id: profile.id,
    name: profile.name,
    avatarId: profile.avatarId,
    cumulativeStats: profile.cumulativeStats,
    lastDifficultyParams:
      (profile as Partial<ProfileData>).lastDifficultyParams ?? null,
    preferredGameMode:
      (profile as Partial<ProfileData>).preferredGameMode ?? null,
    sessionHistory:
      (profile as Partial<ProfileData>).sessionHistory ?? [],
    createdAt: profile.createdAt,
  }))
}
