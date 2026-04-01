import type { ProfileData } from './types.js'

export interface ProfileRepository {
  loadAll(): ProfileData[]
  saveAll(profiles: ProfileData[]): void
}
