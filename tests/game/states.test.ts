import { describe, it, expect, vi } from 'vitest'
import type { Graphics } from 'pixi.js'
import type { GameState, GameContext, StateName } from '@/game/types.js'
import {
  StateMachine,
  BootState,
  PlayingState,
  PausedState,
} from '@/game/states.js'

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
    expect(() => {
      sm.transition('paused', ctx)
    }).toThrow(/Invalid transition/)
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
    expect(() => {
      sm.transition('menu', ctx)
    }).toThrow(/not started/)
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

// --- Concrete State Tests ---

function createMockGameContext(): GameContext & {
  transitions: StateName[]
  inputBuffer: string[]
} {
  const transitions: StateName[] = []
  const inputBuffer: string[] = []
  const addChildFn = vi.fn()
  const removeChildFn = vi.fn()
  return {
    app: {} as GameContext['app'],
    gameRoot: {
      addChild: addChildFn,
      removeChild: removeChildFn,
    } as unknown as GameContext['gameRoot'],
    transitionTo: (state: StateName) => {
      transitions.push(state)
    },
    getInputBuffer: () => {
      const buf = [...inputBuffer]
      inputBuffer.length = 0
      return buf
    },
    acquirePoolItem: vi.fn(() => ({
      item: { visible: true, x: 0, y: 0 } as unknown as Graphics,
      index: 0,
    })),
    releasePoolItem: vi.fn(),
    poolActiveCount: 0,
    poolTotalCount: 20,
    currentStateName: 'boot' as StateName,
    transitions,
    inputBuffer,
  }
}

describe('BootState', () => {
  it('enter calls transitionTo menu', () => {
    const ctx = createMockGameContext()
    const state = new BootState()
    state.enter(ctx)
    expect(ctx.transitions).toContain('menu')
  })
})

describe('PlayingState', () => {
  it('spawns item after 1000ms', () => {
    const ctx = createMockGameContext()
    const state = new PlayingState()
    state.enter()
    state.update(ctx, 1000)
    expect(ctx.acquirePoolItem).toHaveBeenCalled()
  })

  it('moves active items down', () => {
    const ctx = createMockGameContext()
    let itemCount = 0
    const items: { visible: boolean; x: number; y: number }[] = []
    vi.mocked(ctx.acquirePoolItem).mockImplementation(() => {
      const item = { visible: true, x: 100, y: -40 }
      items.push(item)
      return { item: item as unknown as Graphics, index: itemCount++ }
    })

    const state = new PlayingState()
    state.enter()
    state.update(ctx, 1000) // Spawn first item
    const firstItem = items[0]
    expect(firstItem).toBeDefined()
    const initialY = firstItem?.y ?? 0
    state.update(ctx, 500) // Move items for 500ms (no new spawn yet)
    expect(firstItem?.y).toBeGreaterThan(initialY)
  })

  it('exit clears all active items', () => {
    const ctx = createMockGameContext()
    let itemCount = 0
    vi.mocked(ctx.acquirePoolItem).mockImplementation(() => {
      return {
        item: { visible: true, x: 100, y: 0 } as unknown as Graphics,
        index: itemCount++,
      }
    })

    const state = new PlayingState()
    state.enter()
    state.update(ctx, 1000) // Spawn one
    state.exit(ctx)
    expect(ctx.releasePoolItem).toHaveBeenCalled()
  })
})

// PausedState and other states create PixiJS objects (BitmapText, Container, Graphics)
// which require a DOM canvas context. We mock the entire pixi.js module for unit tests.
vi.mock('pixi.js', () => {
  class MockContainer {
    children: unknown[] = []
    x = 0
    y = 0
    scale = { set: vi.fn() }
    addChild = vi.fn((child: unknown) => {
      this.children.push(child)
      return child
    })
    removeChild = vi.fn()
    destroy = vi.fn()
    emit = vi.fn()
  }

  class MockBitmapText {
    x = 0
    y = 0
    width = 100
    height = 40
    eventMode = 'auto'
    cursor = 'default'
    scale = { set: vi.fn() }
    on = vi.fn()
    destroy = vi.fn()
    emit = vi.fn()
  }

  class MockGraphics {
    x = 0
    y = 0
    visible = true
    emit = vi.fn()
    destroy = vi.fn()
    rect = vi.fn().mockReturnThis()
    fill = vi.fn().mockReturnThis()
  }

  return {
    Container: MockContainer,
    BitmapText: MockBitmapText,
    BitmapFont: { install: vi.fn() },
    Graphics: MockGraphics,
  }
})

describe('PausedState', () => {
  it('enter adds overlay to gameRoot', () => {
    const ctx = createMockGameContext()
    const state = new PausedState()
    state.enter(ctx)
    expect(ctx.gameRoot.addChild).toHaveBeenCalled()
  })

  it('exit removes overlay from gameRoot', () => {
    const ctx = createMockGameContext()
    const state = new PausedState()
    state.enter(ctx)
    state.exit(ctx)
    expect(ctx.gameRoot.removeChild).toHaveBeenCalled()
  })
})
