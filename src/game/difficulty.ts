export interface DifficultyParams {
  readonly fallSpeed: number
  readonly spawnInterval: number
  readonly complexityLevel: number
}

export interface DifficultyConfig {
  readonly mode: 'letters' | 'words'
  readonly minFallSpeed: number
  readonly maxFallSpeed: number
  readonly baseFallSpeed: number
  readonly minSpawnInterval: number
  readonly maxSpawnInterval: number
  readonly baseSpawnInterval: number
  readonly speedStep: number
  readonly spawnStep: number
  readonly deadZoneLow: number
  readonly deadZoneHigh: number
  readonly windowSize: number
  readonly complexityUpThreshold: number
  readonly complexityDownThreshold: number
  readonly complexityUpCount: number
  readonly maxComplexityLevel: number
}

export class DifficultyManager {
  constructor(_config: DifficultyConfig) {
    // stub
  }

  recordResult(_hit: boolean): void {
    // stub
  }

  get params(): DifficultyParams {
    return { fallSpeed: 0, spawnInterval: 0, complexityLevel: 0 }
  }

  get rollingAccuracy(): number {
    return 0
  }

  get windowFull(): boolean {
    return false
  }
}

export const LETTER_DIFFICULTY_CONFIG: DifficultyConfig = {
  mode: 'letters',
  minFallSpeed: 0,
  maxFallSpeed: 0,
  baseFallSpeed: 0,
  minSpawnInterval: 0,
  maxSpawnInterval: 0,
  baseSpawnInterval: 0,
  speedStep: 0,
  spawnStep: 0,
  deadZoneLow: 0,
  deadZoneHigh: 0,
  windowSize: 0,
  complexityUpThreshold: 0,
  complexityDownThreshold: 0,
  complexityUpCount: 0,
  maxComplexityLevel: 0,
}

export const WORD_DIFFICULTY_CONFIG: DifficultyConfig = {
  mode: 'words',
  minFallSpeed: 0,
  maxFallSpeed: 0,
  baseFallSpeed: 0,
  minSpawnInterval: 0,
  maxSpawnInterval: 0,
  baseSpawnInterval: 0,
  speedStep: 0,
  spawnStep: 0,
  deadZoneLow: 0,
  deadZoneHigh: 0,
  windowSize: 0,
  complexityUpThreshold: 0,
  complexityDownThreshold: 0,
  complexityUpCount: 0,
  maxComplexityLevel: 0,
}
