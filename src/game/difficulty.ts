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
  private readonly window: boolean[] = []
  private _fallSpeed: number
  private _spawnInterval: number
  private _complexityLevel = 0
  private consecutiveHighAccuracy = 0

  constructor(
    private readonly config: DifficultyConfig,
    initialParams?: DifficultyParams,
  ) {
    this._fallSpeed = initialParams?.fallSpeed ?? config.baseFallSpeed
    this._spawnInterval = initialParams?.spawnInterval ?? config.baseSpawnInterval
    this._complexityLevel = initialParams?.complexityLevel ?? 0
  }

  recordResult(hit: boolean): void {
    this.window.push(hit)
    if (this.window.length > this.config.windowSize) {
      this.window.shift()
    }

    if (this.window.length < this.config.windowSize) return

    const accuracy =
      this.window.filter(Boolean).length / this.window.length
    this.adjust(accuracy)
  }

  private adjust(accuracy: number): void {
    if (accuracy > this.config.deadZoneHigh) {
      // Ramp: make harder (small step)
      this._fallSpeed = Math.min(
        this.config.maxFallSpeed,
        this._fallSpeed + this.config.speedStep,
      )
      this._spawnInterval = Math.max(
        this.config.minSpawnInterval,
        this._spawnInterval - this.config.spawnStep,
      )
    } else if (accuracy < this.config.deadZoneLow) {
      // Ease: make easier (2x step)
      this._fallSpeed = Math.max(
        this.config.minFallSpeed,
        this._fallSpeed - this.config.speedStep * 2,
      )
      this._spawnInterval = Math.min(
        this.config.maxSpawnInterval,
        this._spawnInterval + this.config.spawnStep * 2,
      )
    }
    // Dead zone (60-80%): no speed/spawn change

    this.updateComplexity(accuracy)
  }

  private updateComplexity(accuracy: number): void {
    if (accuracy > this.config.complexityUpThreshold) {
      this.consecutiveHighAccuracy++
      if (
        this.consecutiveHighAccuracy >= this.config.complexityUpCount &&
        this._complexityLevel < this.config.maxComplexityLevel
      ) {
        this._complexityLevel++
        this.consecutiveHighAccuracy = 0
      }
    } else {
      this.consecutiveHighAccuracy = 0
    }

    if (
      accuracy < this.config.complexityDownThreshold &&
      this._complexityLevel > 0
    ) {
      this._complexityLevel--
    }
  }

  get params(): DifficultyParams {
    return Object.freeze({
      fallSpeed: this._fallSpeed,
      spawnInterval: this._spawnInterval,
      complexityLevel: this._complexityLevel,
    })
  }

  get rollingAccuracy(): number {
    if (this.window.length === 0) return 0
    return this.window.filter(Boolean).length / this.window.length
  }

  get windowFull(): boolean {
    return this.window.length >= this.config.windowSize
  }
}

export const LETTER_DIFFICULTY_CONFIG: DifficultyConfig = {
  mode: 'letters',
  minFallSpeed: 40,
  maxFallSpeed: 150,
  baseFallSpeed: 80,
  minSpawnInterval: 800,
  maxSpawnInterval: 3000,
  baseSpawnInterval: 1500,
  speedStep: 5,
  spawnStep: 150,
  deadZoneLow: 0.6,
  deadZoneHigh: 0.8,
  windowSize: 10,
  complexityUpThreshold: 0.8,
  complexityDownThreshold: 0.5,
  complexityUpCount: 5,
  maxComplexityLevel: 2,
}

export const WORD_DIFFICULTY_CONFIG: DifficultyConfig = {
  mode: 'words',
  minFallSpeed: 25,
  maxFallSpeed: 100,
  baseFallSpeed: 50,
  minSpawnInterval: 1500,
  maxSpawnInterval: 4000,
  baseSpawnInterval: 2500,
  speedStep: 5,
  spawnStep: 150,
  deadZoneLow: 0.6,
  deadZoneHigh: 0.8,
  windowSize: 10,
  complexityUpThreshold: 0.8,
  complexityDownThreshold: 0.5,
  complexityUpCount: 5,
  maxComplexityLevel: 1,
}
