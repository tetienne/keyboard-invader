export const TICK_MS = 1000 / 60 // ~16.667ms
const DEFAULT_MAX_CATCH_UP = 3

export class GameLoop {
  private accumulator = 0
  private readonly tickMs: number
  private readonly maxCatchUp: number
  private _onUpdate: ((dt: number) => void) | null = null
  private _onRender: (() => void) | null = null

  constructor(tickMs = TICK_MS, maxCatchUp = DEFAULT_MAX_CATCH_UP) {
    this.tickMs = tickMs
    this.maxCatchUp = maxCatchUp
  }

  set onUpdate(fn: (dt: number) => void) {
    this._onUpdate = fn
  }

  set onRender(fn: () => void) {
    this._onRender = fn
  }

  /** Called by PixiJS ticker callback with ticker.elapsedMS */
  accumulate(elapsedMS: number): void {
    this.accumulator += elapsedMS
  }

  /** Process accumulated time in fixed steps. Returns number of ticks executed. */
  tick(): number {
    let ticks = 0
    while (this.accumulator >= this.tickMs && ticks < this.maxCatchUp) {
      this._onUpdate?.(this.tickMs)
      this.accumulator -= this.tickMs
      ticks++
    }
    // Drop excess (D-03: prevent spiral of death)
    if (this.accumulator >= this.tickMs) {
      this.accumulator = 0
    }
    this._onRender?.()
    return ticks
  }

  /** Reset accumulator to 0 (D-16: call on tab return) */
  resetAccumulator(): void {
    this.accumulator = 0
  }
}
