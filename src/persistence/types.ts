import type { DifficultyParams } from '../game/difficulty.js'
import type { GameMode } from '../game/types.js'

export const CURRENT_SCHEMA_VERSION = 1
export const MAX_PROFILES = 4
export const MAX_SESSION_HISTORY = 10

export interface StorageEnvelope {
  schemaVersion: number
  profiles: ProfileData[]
}

export interface ProfileData {
  id: string
  name: string // max 12 chars
  avatarId: string // references AVATARS[].id
  cumulativeStats: CumulativeStats
  lastDifficultyParams: DifficultyParams | null
  preferredGameMode: GameMode | null
  sessionHistory: SessionSummary[] // max 10, FIFO
  createdAt: string // ISO date string
}

export interface CumulativeStats {
  totalSessions: number
  totalHits: number
  totalMisses: number
  bestAccuracy: number // 0-100
}

export interface SessionSummary {
  hits: number
  misses: number
  accuracy: number // 0-100
  mode: GameMode
  date: string // ISO date string
}

export function createDefaultStats(): CumulativeStats {
  return { totalSessions: 0, totalHits: 0, totalMisses: 0, bestAccuracy: 0 }
}

export function generateProfileId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}
