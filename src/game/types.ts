import type { Application, Container } from 'pixi.js'

// Canvas constants (D-15)
export const BASE_WIDTH = 1280
export const BASE_HEIGHT = 720

// State machine types (D-04, D-05)
export type StateName = 'boot' | 'menu' | 'playing' | 'paused'

export const TRANSITIONS: Record<StateName, readonly StateName[]> = {
  boot: ['menu'],
  menu: ['playing'],
  playing: ['paused', 'menu'],
  paused: ['playing', 'menu'],
} as const

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
}
