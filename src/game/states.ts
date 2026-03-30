import type { GameState, StateName, GameContext } from './types.js'
import { TRANSITIONS } from './types.js'

export class StateMachine {
  private states: Map<StateName, GameState>
  private _current: StateName | null = null

  constructor(states: Record<StateName, GameState>) {
    this.states = new Map(Object.entries(states) as [StateName, GameState][])
  }

  get current(): StateName | null {
    return this._current
  }

  get currentState(): GameState | undefined {
    return this._current ? this.states.get(this._current) : undefined
  }

  start(initial: StateName, ctx: GameContext): void {
    this._current = initial
    this.states.get(initial)?.enter(ctx)
  }

  transition(target: StateName, ctx: GameContext): void {
    if (this._current === null) {
      throw new Error('StateMachine not started')
    }

    const allowed = TRANSITIONS[this._current]
    if (!allowed.includes(target)) {
      throw new Error(
        `Invalid transition: ${this._current} -> ${target}. Allowed: ${allowed.join(', ')}`,
      )
    }

    const oldState = this.states.get(this._current)
    oldState?.exit(ctx)

    this._current = target
    const newState = this.states.get(target)
    newState?.enter(ctx)
  }

  update(ctx: GameContext, dt: number): void {
    this.currentState?.update(ctx, dt)
  }

  render(ctx: GameContext): void {
    this.currentState?.render(ctx)
  }
}
