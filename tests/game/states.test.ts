import { describe, it, expect, vi } from 'vitest'
import type { GameState, GameContext, StateName } from '@/game/types.js'
import { StateMachine } from '@/game/states.js'

function createMockState(): GameState {
  return {
    enter: vi.fn(),
    exit: vi.fn(),
    update: vi.fn(),
    render: vi.fn(),
  }
}

function createMockContext(): GameContext {
  return {} as GameContext
}

describe('StateMachine', () => {
  function makeStates() {
    return {
      boot: createMockState(),
      menu: createMockState(),
      playing: createMockState(),
      paused: createMockState(),
    }
  }

  it('starts in initial state and calls enter', () => {
    const states = makeStates()
    const sm = new StateMachine(states)
    const ctx = createMockContext()
    sm.start('boot', ctx)
    expect(sm.current).toBe('boot')
    expect(states.boot.enter).toHaveBeenCalledWith(ctx)
  })

  it('transitions between valid states', () => {
    const states = makeStates()
    const sm = new StateMachine(states)
    const ctx = createMockContext()
    sm.start('boot', ctx)
    sm.transition('menu', ctx)
    expect(sm.current).toBe('menu')
  })

  it('throws on invalid transition', () => {
    const states = makeStates()
    const sm = new StateMachine(states)
    const ctx = createMockContext()
    sm.start('boot', ctx)
    expect(() => sm.transition('paused', ctx)).toThrowError(/Invalid transition/)
  })

  it('calls exit on old state and enter on new state', () => {
    const states = makeStates()
    const sm = new StateMachine(states)
    const ctx = createMockContext()
    sm.start('boot', ctx)
    sm.transition('menu', ctx)
    expect(states.boot.exit).toHaveBeenCalledWith(ctx)
    expect(states.menu.enter).toHaveBeenCalledWith(ctx)
  })

  it('throws when not started', () => {
    const states = makeStates()
    const sm = new StateMachine(states)
    const ctx = createMockContext()
    expect(() => sm.transition('menu', ctx)).toThrowError(/not started/)
  })

  it('update delegates to current state', () => {
    const states = makeStates()
    const sm = new StateMachine(states)
    const ctx = createMockContext()
    sm.start('boot', ctx)
    sm.update(ctx, 16.67)
    expect(states.boot.update).toHaveBeenCalledWith(ctx, 16.67)
  })
})
