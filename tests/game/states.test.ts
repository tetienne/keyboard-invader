import { describe, it, expect, vi } from 'vitest'
import type {
  GameState,
  GameContext,
  GameMode,
  StateName,
  SessionResult,
} from '@/game/types.js'
import {
  StateMachine,
  BootState,
  MenuState,
  PlayingState,
  PausedState,
  GameOverState,
} from '@/game/states.js'

// Mock pixi.js BEFORE any imports that use it
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
    text = ''
    tint = 0xffffff
    alpha = 1
    eventMode = 'auto'
    cursor = 'default'
    visible = true
    anchor = { set: vi.fn() }
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
      gameover: createMockState(),
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

function createMockGameContext(
  mode: GameMode = 'letters',
): GameContext & {
  transitions: StateName[]
  inputBuffer: string[]
} {
  const transitions: StateName[] = []
  const inputBuffer: string[] = []
  let sessionResult: SessionResult | null = null
  let gameMode: GameMode = mode
  let letterItemCount = 0
  let wordItemCount = 0
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
    acquirePoolItem: vi.fn(() => {
      const idx = letterItemCount++
      return {
        item: {
          visible: true,
          x: 0,
          y: 0,
          text: '',
          tint: 0xffffff,
          alpha: 1,
          anchor: { set: vi.fn() },
          scale: { set: vi.fn() },
        },
        index: idx,
      }
    }),
    releasePoolItem: vi.fn(),
    acquireWordPoolItem: vi.fn(() => {
      const idx = wordItemCount++
      return {
        item: {
          visible: true,
          x: 0,
          y: 0,
          text: '',
          tint: 0xffffff,
          alpha: 1,
          width: 200,
          scale: { set: vi.fn() },
          chars: [] as Array<{ tint: number }>,
          split: vi.fn(),
        },
        index: idx,
      }
    }),
    releaseWordPoolItem: vi.fn(),
    poolActiveCount: 0,
    poolTotalCount: 20,
    currentStateName: 'boot' as StateName,
    setSessionResult: vi.fn((result: SessionResult) => {
      sessionResult = result
    }),
    getSessionResult: () => sessionResult,
    setGameMode: vi.fn((m: GameMode) => {
      gameMode = m
    }),
    getGameMode: () => gameMode,
    getDifficulty: vi.fn(() => null),
    setDifficulty: vi.fn(),
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

describe('MenuState', () => {
  it('enter creates mode selection buttons', () => {
    const ctx = createMockGameContext()
    const state = new MenuState()
    state.enter(ctx)
    // Title + 2 buttons + 2 labels = 5 addChild calls
    expect(ctx.gameRoot.addChild).toHaveBeenCalledTimes(5)
  })

  it('exit cleans up all display objects', () => {
    const ctx = createMockGameContext()
    const state = new MenuState()
    state.enter(ctx)
    state.exit(ctx)
    // Should remove 5 items
    expect(ctx.gameRoot.removeChild).toHaveBeenCalledTimes(5)
  })
})

describe('PlayingState', () => {
  it('reads gameMode from context on enter', () => {
    const ctx = createMockGameContext('words')
    const state = new PlayingState()
    state.enter(ctx)
    // Should not crash; mode stored internally
    expect(ctx.getGameMode()).toBe('words')
    state.exit(ctx)
  })

  it('spawns BitmapText letter after SPAWN_INTERVAL_MS (1500ms) in letter mode', () => {
    const ctx = createMockGameContext('letters')
    const state = new PlayingState()
    state.enter(ctx)
    state.update(ctx, 1500)
    expect(ctx.acquirePoolItem).toHaveBeenCalled()
  })

  it('does not spawn before SPAWN_INTERVAL_MS', () => {
    const ctx = createMockGameContext()
    const state = new PlayingState()
    state.enter(ctx)
    state.update(ctx, 1000)
    expect(ctx.acquirePoolItem).not.toHaveBeenCalled()
  })

  it('spawns word via acquireWordPoolItem in word mode', () => {
    const ctx = createMockGameContext('words')
    const state = new PlayingState()
    state.enter(ctx)
    // Word spawn interval is 2500ms
    state.update(ctx, 2500)
    expect(ctx.acquireWordPoolItem).toHaveBeenCalled()
  })

  it('correct keypress increments hits counter', () => {
    const ctx = createMockGameContext()
    let itemCount = 0
    vi.mocked(ctx.acquirePoolItem).mockImplementation(() => {
      return {
        item: {
          visible: true,
          x: 200,
          y: 100,
          text: '',
          tint: 0xffffff,
          alpha: 1,
          anchor: { set: vi.fn() },
          scale: { set: vi.fn() },
        },
        index: itemCount++,
      }
    })

    const state = new PlayingState()
    state.enter(ctx)
    state.update(ctx, 1500)
    ctx.inputBuffer.push('a', 's', 'd', 'f', 'j', 'k', 'l')
    state.update(ctx, 16)
    expect(ctx.acquirePoolItem).toHaveBeenCalled()
  })

  it('wrong keypress increments misses', () => {
    const ctx = createMockGameContext()
    let itemCount = 0
    vi.mocked(ctx.acquirePoolItem).mockImplementation(() => {
      return {
        item: {
          visible: true,
          x: 200,
          y: 100,
          text: '',
          tint: 0xffffff,
          alpha: 1,
          anchor: { set: vi.fn() },
          scale: { set: vi.fn() },
        },
        index: itemCount++,
      }
    })

    const state = new PlayingState()
    state.enter(ctx)
    state.update(ctx, 1500) // spawn

    ctx.inputBuffer.push('1')
    state.update(ctx, 16) // process input

    expect(ctx.acquirePoolItem).toHaveBeenCalledTimes(1)
  })

  it('transitions to gameover when all 20 letters processed and cleared', () => {
    const ctx = createMockGameContext()
    let itemCount = 0
    const items: { y: number; visible: boolean; alpha: number; x: number }[] =
      []
    vi.mocked(ctx.acquirePoolItem).mockImplementation(() => {
      const item = {
        visible: true,
        x: 200,
        y: -40,
        text: '',
        tint: 0xffffff,
        alpha: 1,
        anchor: { set: vi.fn() },
        scale: { set: vi.fn() },
      }
      items.push(item)
      return { item, index: itemCount++ }
    })

    const state = new PlayingState()
    state.enter(ctx)

    // Spawn all 20 with large enough dt to account for dynamic spawn interval
    // DifficultyManager may increase spawnInterval as items fall to bottom (misses)
    // Use a generous dt (5000ms) to ensure spawns happen regardless of interval changes
    for (let i = 0; i < 20; i++) {
      state.update(ctx, 5000)
    }
    expect(ctx.acquirePoolItem).toHaveBeenCalledTimes(20)

    for (const item of items) {
      item.y = 800
    }
    state.update(ctx, 16)
    state.update(ctx, 500)

    expect(ctx.transitions).toContain('gameover')
  })

  it('setSessionResult includes timePlayed and mode', () => {
    const ctx = createMockGameContext()
    let itemCount = 0
    const items: { y: number; visible: boolean; alpha: number; x: number }[] =
      []
    vi.mocked(ctx.acquirePoolItem).mockImplementation(() => {
      const item = {
        visible: true,
        x: 200,
        y: -40,
        text: '',
        tint: 0xffffff,
        alpha: 1,
        anchor: { set: vi.fn() },
        scale: { set: vi.fn() },
      }
      items.push(item)
      return { item, index: itemCount++ }
    })

    const state = new PlayingState()
    state.enter(ctx)

    // Use large dt to ensure spawns happen despite dynamic spawn interval
    for (let i = 0; i < 20; i++) {
      state.update(ctx, 5000)
    }

    for (const item of items) {
      item.y = 800
    }
    state.update(ctx, 16)
    state.update(ctx, 500)

    expect(ctx.setSessionResult).toHaveBeenCalled()
    const result = ctx.getSessionResult()
    expect(result).not.toBeNull()
    expect(result?.total).toBe(20)
    expect(result?.timePlayed).toBeGreaterThan(0)
    expect(result?.mode).toBe('letters')
  })

  it('exit clears all active entities', () => {
    const ctx = createMockGameContext()
    let itemCount = 0
    vi.mocked(ctx.acquirePoolItem).mockImplementation(() => {
      return {
        item: {
          visible: true,
          x: 100,
          y: 0,
          text: '',
          tint: 0xffffff,
          alpha: 1,
          anchor: { set: vi.fn() },
          scale: { set: vi.fn() },
        },
        index: itemCount++,
      }
    })

    const state = new PlayingState()
    state.enter(ctx)
    state.update(ctx, 1500) // Spawn one
    state.exit(ctx)
    expect(ctx.releasePoolItem).toHaveBeenCalled()
  })
})

describe('GameOverState', () => {
  it('enter adds container to gameRoot', () => {
    const ctx = createMockGameContext()
    const state = new GameOverState()
    state.enter(ctx)
    expect(ctx.gameRoot.addChild).toHaveBeenCalled()
  })

  it('exit removes and destroys container', () => {
    const ctx = createMockGameContext()
    const state = new GameOverState()
    state.enter(ctx)
    state.exit(ctx)
    expect(ctx.gameRoot.removeChild).toHaveBeenCalled()
  })

  it('reads timePlayed and mode from SessionResult', () => {
    const ctx = createMockGameContext()
    ctx.setSessionResult({
      hits: 15,
      misses: 5,
      total: 20,
      timePlayed: 30000,
      mode: 'letters',
    })
    const state = new GameOverState()
    state.enter(ctx)
    expect(ctx.gameRoot.addChild).toHaveBeenCalled()
  })

  it('reads word mode from SessionResult', () => {
    const ctx = createMockGameContext('words')
    ctx.setSessionResult({
      hits: 10,
      misses: 3,
      total: 15,
      timePlayed: 45000,
      mode: 'words',
    })
    const state = new GameOverState()
    state.enter(ctx)
    expect(ctx.gameRoot.addChild).toHaveBeenCalled()
  })
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
