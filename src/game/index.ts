export { Game } from './game.js'
export {
  StateMachine,
  BootState,
  MenuState,
  PlayingState,
  PausedState,
} from './states.js'
export { GameLoop, TICK_MS } from './loop.js'
export { InputManager } from './input.js'
export { ObjectPool } from './pool.js'
export { computeScale, setupCanvas, applyScale } from './canvas.js'
export { DebugOverlay } from './debug.js'
export type { GameState, StateName, ScaleResult, GameContext } from './types.js'
export { BASE_WIDTH, BASE_HEIGHT, TRANSITIONS } from './types.js'
