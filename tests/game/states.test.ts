import { describe, it, expect, vi, beforeEach } from 'vitest'
import type {
  GameState,
  GameContext,
  GameMode,
  StateName,
  SessionResult,
  SessionSaveResult,
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
vi.mock('pixi.js', async () => {
  const { createPixiMocks } = await import('../__mocks__/pixi.js')
  return createPixiMocks()
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
      profiles: createMockState(),
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
    sm.transition('profiles', ctx)
    expect(sm.current).toBe('profiles')
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
    sm.transition('profiles', ctx)
    expect(states.boot.exit).toHaveBeenCalledWith(ctx)
    expect(states.profiles.enter).toHaveBeenCalledWith(ctx)
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
  let sessionSaveResult: SessionSaveResult | null = null
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
          tint: 0xffffff,
          alpha: 1,
          scale: { set: vi.fn() },
          setLetter: vi.fn(),
          setTexture: vi.fn(),
          letterLabel: { text: '', tint: 0xffffff },
          sprite: { y: 0, scale: { set: vi.fn(), y: 1 } },
          addChild: vi.fn(),
          updateIdle: vi.fn(),
          reset: vi.fn(),
        },
        index: idx,
      }
    }),
    releasePoolItem: vi.fn(),
    acquireWordPoolItem: vi.fn(() => {
      const idx = wordItemCount++
      const splitText = {
        visible: true, x: 0, y: 0, text: '', tint: 0xffffff, alpha: 1,
        width: 200, scale: { set: vi.fn() },
        chars: [] as Array<{ tint: number }>, split: vi.fn(),
      }
      return {
        item: {
          visible: true,
          x: 0,
          y: 0,
          tint: 0xffffff,
          alpha: 1,
          scale: { set: vi.fn() },
          setLetter: vi.fn(),
          setTexture: vi.fn(),
          letterLabel: { text: '', tint: 0xffffff, visible: true },
          sprite: { y: 0, scale: { set: vi.fn(), y: 1 } },
          children: [splitText],
          wordLabel: splitText,
          addChild: vi.fn(),
          updateIdle: vi.fn(),
          reset: vi.fn(),
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
    setActiveProfile: vi.fn(),
    getActiveProfile: vi.fn(() => null),
    getProfileRepository: vi.fn(() => ({
      loadAll: vi.fn(() => []),
      saveAll: vi.fn(),
    })),
    getSessionSaveResult: vi.fn(() => sessionSaveResult),
    setSessionSaveResult: vi.fn((r: SessionSaveResult | null) => {
      sessionSaveResult = r
    }),
    preallocatePools: vi.fn(),
    transitions,
    inputBuffer,
  }
}

// Mock document.fonts for Node test environment
const mockFontsLoad = vi.fn(() => Promise.resolve([]))
vi.stubGlobal('document', {
  ...((typeof document !== 'undefined' ? document : {}) as object),
  fonts: { load: mockFontsLoad },
})

describe('BootState', () => {
  beforeEach(() => {
    mockFontsLoad.mockClear()
    mockFontsLoad.mockResolvedValue([])
  })

  it('calls document.fonts.load with Fredoka font strings', async () => {
    const ctx = createMockGameContext()
    const state = new BootState()
    state.enter(ctx)

    await vi.waitFor(() => {
      expect(mockFontsLoad).toHaveBeenCalledWith('400 80px Fredoka')
      expect(mockFontsLoad).toHaveBeenCalledWith('700 48px Fredoka')
    })
  })

  it('calls Assets.load with all asset paths', async () => {
    const { Assets } = await import('pixi.js')
    const ctx = createMockGameContext()
    const state = new BootState()
    state.enter(ctx)

    await vi.waitFor(() => {
      expect(Assets.load).toHaveBeenCalled()
    })
    const loadCall = vi.mocked(Assets.load).mock.calls[0]?.[0] as string[]
    expect(loadCall).toEqual(expect.arrayContaining([
      '/assets/aliens/alien-01.svg',
      '/assets/aliens/word-alien-01.svg',
      '/assets/spaceship.svg',
      '/assets/star.svg',
      '/assets/avatars/kid-01.svg',
    ]))
  })

  it('transitions to profiles after all assets resolve', async () => {
    const ctx = createMockGameContext()
    const state = new BootState()
    state.enter(ctx)

    await vi.waitFor(() => {
      expect(ctx.transitions).toContain('profiles')
    })
  })

  it('does not transition if Assets.load rejects', async () => {
    const { Assets } = await import('pixi.js')
    vi.mocked(Assets.load).mockRejectedValueOnce(new Error('load failed'))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const ctx = createMockGameContext()
    const state = new BootState()
    state.enter(ctx)

    await vi.waitFor(() => {
      expect(errorSpy).toHaveBeenCalled()
    })
    expect(ctx.transitions).not.toContain('profiles')
    errorSpy.mockRestore()
  })
})

describe('MenuState', () => {
  it('enter creates bg and menu containers on gameRoot', () => {
    const ctx = createMockGameContext()
    const state = new MenuState()
    state.enter(ctx)
    // bgContainer + menuContainer = 2 addChild calls on gameRoot
    expect(ctx.gameRoot.addChild).toHaveBeenCalledTimes(2)
  })

  it('exit cleans up containers', () => {
    const ctx = createMockGameContext()
    const state = new MenuState()
    state.enter(ctx)
    state.exit(ctx)
    // bgContainer + menuContainer = 2 removeChild calls
    expect(ctx.gameRoot.removeChild).toHaveBeenCalledTimes(2)
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
          tint: 0xffffff,
          alpha: 1,
          scale: { set: vi.fn() },
          setLetter: vi.fn(),
          setTexture: vi.fn(),
          letterLabel: { text: '', tint: 0xffffff },
          sprite: { y: 0, scale: { set: vi.fn(), y: 1 } },
          addChild: vi.fn(),
          updateIdle: vi.fn(),
          reset: vi.fn(),
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
          tint: 0xffffff,
          alpha: 1,
          scale: { set: vi.fn() },
          setLetter: vi.fn(),
          setTexture: vi.fn(),
          letterLabel: { text: '', tint: 0xffffff },
          sprite: { y: 0, scale: { set: vi.fn(), y: 1 } },
          addChild: vi.fn(),
          updateIdle: vi.fn(),
          reset: vi.fn(),
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
        tint: 0xffffff,
        alpha: 1,
        scale: { set: vi.fn() },
        setLetter: vi.fn(),
        setTexture: vi.fn(),
        letterLabel: { text: '', tint: 0xffffff },
        sprite: { y: 0, scale: { set: vi.fn(), y: 1 } },
        addChild: vi.fn(),
        updateIdle: vi.fn(),
        reset: vi.fn(),
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
        tint: 0xffffff,
        alpha: 1,
        scale: { set: vi.fn() },
        setLetter: vi.fn(),
        setTexture: vi.fn(),
        letterLabel: { text: '', tint: 0xffffff },
        sprite: { y: 0, scale: { set: vi.fn(), y: 1 } },
        addChild: vi.fn(),
        updateIdle: vi.fn(),
        reset: vi.fn(),
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
          tint: 0xffffff,
          alpha: 1,
          scale: { set: vi.fn() },
          setLetter: vi.fn(),
          setTexture: vi.fn(),
          letterLabel: { text: '', tint: 0xffffff },
          sprite: { y: 0, scale: { set: vi.fn(), y: 1 } },
          addChild: vi.fn(),
          updateIdle: vi.fn(),
          reset: vi.fn(),
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

describe('GameOverState profile saving', () => {
  it('saves session to profile when active profile exists', () => {
    const ctx = createMockGameContext()
    const saveAllFn = vi.fn()
    const profile = {
      id: 'test-1',
      name: 'Lea',
      avatarId: 'circle',
      cumulativeStats: { totalSessions: 0, totalHits: 0, totalMisses: 0, bestAccuracy: 0 },
      lastDifficultyParams: null,
      preferredGameMode: null,
      sessionHistory: [] as Array<{ hits: number; misses: number; accuracy: number; mode: string; date: string }>,
      createdAt: '2026-01-01T00:00:00Z',
      xp: 0,
      level: 1,
      unlockedAvatarIds: ['avatar-red', 'avatar-blue', 'avatar-green'],
    }
    vi.mocked(ctx.getActiveProfile).mockReturnValue(profile as never)
    vi.mocked(ctx.getProfileRepository).mockReturnValue({
      loadAll: vi.fn(() => [profile] as never),
      saveAll: saveAllFn,
    })
    ctx.setSessionResult({
      hits: 15,
      misses: 5,
      total: 20,
      timePlayed: 30000,
      mode: 'letters',
    })
    vi.mocked(ctx.getDifficulty).mockReturnValue({
      fallSpeed: 90,
      spawnInterval: 1200,
      complexityLevel: 1,
    })

    const state = new GameOverState()
    state.enter(ctx)

    expect(saveAllFn).toHaveBeenCalled()
    expect(profile.cumulativeStats.totalSessions).toBe(1)
    expect(profile.cumulativeStats.totalHits).toBe(15)
    expect(profile.cumulativeStats.totalMisses).toBe(5)
    expect(profile.cumulativeStats.bestAccuracy).toBe(75)
    expect(profile.sessionHistory).toHaveLength(1)
    expect(profile.lastDifficultyParams).toEqual({
      fallSpeed: 90,
      spawnInterval: 1200,
      complexityLevel: 1,
    })
    expect(profile.preferredGameMode).toBe('letters')
  })

  it('calculates XP and updates profile level after session', () => {
    const ctx = createMockGameContext()
    const saveAllFn = vi.fn()
    const profile = {
      id: 'test-2',
      name: 'Hugo',
      avatarId: 'circle',
      cumulativeStats: { totalSessions: 0, totalHits: 0, totalMisses: 0, bestAccuracy: 0 },
      lastDifficultyParams: null,
      preferredGameMode: null,
      sessionHistory: [] as Array<{ hits: number; misses: number; accuracy: number; mode: string; date: string }>,
      createdAt: '2026-01-01T00:00:00Z',
      xp: 40,
      level: 1,
      unlockedAvatarIds: ['avatar-red', 'avatar-blue', 'avatar-green'],
    }
    vi.mocked(ctx.getActiveProfile).mockReturnValue(profile as never)
    vi.mocked(ctx.getProfileRepository).mockReturnValue({
      loadAll: vi.fn(() => [profile] as never),
      saveAll: saveAllFn,
    })
    // 15 hits / 20 total = 75% accuracy in letters mode
    // baseXp = 30, accuracyBonus = round(30 * 0.75 * 0.5) = 11, total = 41 XP
    // Starting at 40 XP: 40 + 41 = 81 XP -> level 2 (threshold 50)
    ctx.setSessionResult({
      hits: 15,
      misses: 5,
      total: 20,
      timePlayed: 30000,
      mode: 'letters',
    })
    vi.mocked(ctx.getDifficulty).mockReturnValue({
      fallSpeed: 90,
      spawnInterval: 1200,
      complexityLevel: 1,
    })

    const state = new GameOverState()
    state.enter(ctx)

    expect(profile.xp).toBe(81) // 40 + 41
    expect(profile.level).toBe(2) // crossed 50 threshold
    expect(ctx.setSessionSaveResult).toHaveBeenCalled()
    const saveResult = (ctx.setSessionSaveResult as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as SessionSaveResult
    expect(saveResult.xpGain.totalXp).toBe(41)
    expect(saveResult.levelUp.previousLevel).toBe(1)
    expect(saveResult.levelUp.newLevel).toBe(2)
    expect(saveResult.levelUp.levelsGained).toBe(1)
  })

  it('does not crash when no active profile exists', () => {
    const ctx = createMockGameContext()
    vi.mocked(ctx.getActiveProfile).mockReturnValue(null)
    ctx.setSessionResult({
      hits: 10,
      misses: 5,
      total: 15,
      timePlayed: 20000,
      mode: 'letters',
    })

    const state = new GameOverState()
    expect(() => state.enter(ctx)).not.toThrow()
  })
})

describe('PlayingState profile difficulty restoration', () => {
  it('passes lastDifficultyParams to DifficultyManager when profile has saved params', () => {
    const ctx = createMockGameContext()
    const savedParams = { fallSpeed: 100, spawnInterval: 1000, complexityLevel: 1 }
    vi.mocked(ctx.getActiveProfile).mockReturnValue({
      id: 'test-1',
      name: 'Lea',
      avatarId: 'circle',
      cumulativeStats: { totalSessions: 1, totalHits: 10, totalMisses: 5, bestAccuracy: 67 },
      lastDifficultyParams: savedParams,
      preferredGameMode: 'letters',
      sessionHistory: [],
      createdAt: '2026-01-01T00:00:00Z',
    } as never)

    const state = new PlayingState()
    state.enter(ctx)
    // After enter, difficulty should be set from profile params
    // The update loop pushes difficulty to context via setDifficulty
    state.update(ctx, 16)
    expect(ctx.setDifficulty).toHaveBeenCalledWith(
      expect.objectContaining({
        fallSpeed: 100,
        spawnInterval: 1000,
        complexityLevel: 1,
      }),
    )
    state.exit(ctx)
  })

  it('uses default difficulty when profile has no saved params', () => {
    const ctx = createMockGameContext()
    vi.mocked(ctx.getActiveProfile).mockReturnValue({
      id: 'test-1',
      name: 'Lea',
      avatarId: 'circle',
      cumulativeStats: { totalSessions: 0, totalHits: 0, totalMisses: 0, bestAccuracy: 0 },
      lastDifficultyParams: null,
      preferredGameMode: null,
      sessionHistory: [],
      createdAt: '2026-01-01T00:00:00Z',
    } as never)

    const state = new PlayingState()
    state.enter(ctx)
    state.update(ctx, 16)
    // Should use base config values (80 fall speed for letters)
    expect(ctx.setDifficulty).toHaveBeenCalledWith(
      expect.objectContaining({
        fallSpeed: 80,
        spawnInterval: 1500,
        complexityLevel: 0,
      }),
    )
    state.exit(ctx)
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
