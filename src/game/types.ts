import type { Application, Container } from 'pixi.js'
import type { DifficultyParams } from './difficulty.js'
import type { ProfileData } from '../persistence/types.js'
import type { ProfileRepository } from '../persistence/repository.js'

// Canvas constants (D-15)
export const BASE_WIDTH = 1280
export const BASE_HEIGHT = 720

// State machine types (D-04, D-05)
export type StateName =
  | 'boot'
  | 'profiles'
  | 'menu'
  | 'playing'
  | 'paused'
  | 'gameover'
export type GameMode = 'letters' | 'words'

export const TRANSITIONS: Record<StateName, readonly StateName[]> = {
  boot: ['profiles'],
  profiles: ['menu'],
  menu: ['playing', 'profiles'],
  playing: ['paused', 'menu', 'gameover'],
  paused: ['playing', 'menu'],
  gameover: ['menu', 'playing'],
} as const

export interface SessionResult {
  readonly hits: number
  readonly misses: number
  readonly total: number
  readonly timePlayed: number
  readonly mode: GameMode
}

export interface GameState {
  enter(ctx: GameContext): void
  exit(ctx: GameContext): void
  update(ctx: GameContext, dt: number): void
  render(ctx: GameContext): void
}

// Canvas scaling types (D-14)
export interface ScaleResult {
  readonly scale: number
  readonly offsetX: number
  readonly offsetY: number
  readonly screenWidth: number
  readonly screenHeight: number
}

// Game context interface -- implemented by Game class in Plan 02
export interface GameContext {
  readonly app: Application
  readonly gameRoot: Container
  transitionTo(state: StateName): void
  getInputBuffer(): string[]
  acquirePoolItem(): { item: unknown; index: number }
  releasePoolItem(index: number): void
  readonly poolActiveCount: number
  readonly poolTotalCount: number
  readonly currentStateName: StateName
  setSessionResult(result: SessionResult): void
  getSessionResult(): SessionResult | null
  setGameMode(mode: GameMode): void
  getGameMode(): GameMode
  acquireWordPoolItem(): { item: unknown; index: number }
  releaseWordPoolItem(index: number): void
  getDifficulty(): DifficultyParams | null
  setDifficulty(params: DifficultyParams | null): void
  setActiveProfile(profile: ProfileData | null): void
  getActiveProfile(): ProfileData | null
  getProfileRepository(): ProfileRepository
}
