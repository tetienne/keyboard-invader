import { describe, it, expect } from 'vitest'
import {
  DifficultyManager,
  LETTER_DIFFICULTY_CONFIG,
  WORD_DIFFICULTY_CONFIG,
} from '@/game/difficulty.js'
import type { DifficultyConfig } from '@/game/difficulty.js'

function makeConfig(overrides: Partial<DifficultyConfig> = {}): DifficultyConfig {
  return { ...LETTER_DIFFICULTY_CONFIG, ...overrides }
}

/** Helper: record N hits then M misses */
function fillWindow(
  dm: DifficultyManager,
  hits: number,
  misses: number,
): void {
  for (let i = 0; i < hits; i++) dm.recordResult(true)
  for (let i = 0; i < misses; i++) dm.recordResult(false)
}

describe('rolling window', () => {
  it('does not adjust params when window has fewer than 10 items', () => {
    const dm = new DifficultyManager(makeConfig())
    const initial = dm.params

    for (let i = 0; i < 9; i++) dm.recordResult(true)

    expect(dm.params.fallSpeed).toBe(initial.fallSpeed)
    expect(dm.params.spawnInterval).toBe(initial.spawnInterval)
  })

  it('returns correct rolling accuracy after 10 items', () => {
    const dm = new DifficultyManager(makeConfig())
    fillWindow(dm, 7, 3)
    expect(dm.rollingAccuracy).toBeCloseTo(0.7)
  })

  it('slides window (drops oldest) after reaching windowSize', () => {
    const dm = new DifficultyManager(makeConfig())
    fillWindow(dm, 10, 0)
    expect(dm.rollingAccuracy).toBe(1.0)

    dm.recordResult(false)
    expect(dm.rollingAccuracy).toBeCloseTo(0.9)
    expect(dm.windowFull).toBe(true)
  })
})

describe('fall speed adjustment', () => {
  it('increases fallSpeed by speedStep when accuracy > 0.8', () => {
    const dm = new DifficultyManager(makeConfig())
    const base = dm.params.fallSpeed
    fillWindow(dm, 9, 1) // 0.9 accuracy
    expect(dm.params.fallSpeed).toBe(base + 5)
  })

  it('decreases fallSpeed by speedStep * 2 when accuracy < 0.6', () => {
    const dm = new DifficultyManager(makeConfig())
    const base = dm.params.fallSpeed
    fillWindow(dm, 5, 5) // 0.5 accuracy
    expect(dm.params.fallSpeed).toBe(base - 10)
  })

  it('clamps fallSpeed to maxFallSpeed', () => {
    const dm = new DifficultyManager(makeConfig({ baseFallSpeed: 148 }))
    fillWindow(dm, 9, 1)
    expect(dm.params.fallSpeed).toBe(150)
  })

  it('clamps fallSpeed to minFallSpeed', () => {
    const dm = new DifficultyManager(makeConfig({ baseFallSpeed: 45 }))
    fillWindow(dm, 5, 5)
    expect(dm.params.fallSpeed).toBe(40)
  })
})

describe('spawn interval adjustment', () => {
  it('decreases spawnInterval by spawnStep when accuracy > 0.8 (harder)', () => {
    const dm = new DifficultyManager(makeConfig())
    const base = dm.params.spawnInterval
    fillWindow(dm, 9, 1)
    expect(dm.params.spawnInterval).toBe(base - 150)
  })

  it('increases spawnInterval by spawnStep * 2 when accuracy < 0.6 (easier)', () => {
    const dm = new DifficultyManager(makeConfig())
    const base = dm.params.spawnInterval
    fillWindow(dm, 5, 5)
    expect(dm.params.spawnInterval).toBe(base + 300)
  })

  it('clamps spawnInterval to minSpawnInterval', () => {
    const dm = new DifficultyManager(makeConfig({ baseSpawnInterval: 900 }))
    fillWindow(dm, 9, 1)
    expect(dm.params.spawnInterval).toBe(800)
  })

  it('clamps spawnInterval to maxSpawnInterval', () => {
    const dm = new DifficultyManager(makeConfig({ baseSpawnInterval: 2900 }))
    fillWindow(dm, 5, 5)
    expect(dm.params.spawnInterval).toBe(3000)
  })
})

describe('dead zone', () => {
  it('does not change fallSpeed or spawnInterval when accuracy is 60-80%', () => {
    const dm = new DifficultyManager(makeConfig())
    const initial = dm.params
    fillWindow(dm, 7, 3) // 70%
    expect(dm.params.fallSpeed).toBe(initial.fallSpeed)
    expect(dm.params.spawnInterval).toBe(initial.spawnInterval)
  })

  it('does not trigger easing at exactly 0.6 (boundary inclusive)', () => {
    const dm = new DifficultyManager(makeConfig())
    const initial = dm.params
    fillWindow(dm, 6, 4)
    expect(dm.params.fallSpeed).toBe(initial.fallSpeed)
    expect(dm.params.spawnInterval).toBe(initial.spawnInterval)
  })

  it('does not trigger ramping at exactly 0.8 (boundary inclusive)', () => {
    const dm = new DifficultyManager(makeConfig())
    const initial = dm.params
    fillWindow(dm, 8, 2)
    expect(dm.params.fallSpeed).toBe(initial.fallSpeed)
    expect(dm.params.spawnInterval).toBe(initial.spawnInterval)
  })
})

describe('asymmetric easing', () => {
  it('ease step changes fallSpeed by 2x the ramp step', () => {
    const config = makeConfig()
    const rampDm = new DifficultyManager(config)
    const easeDm = new DifficultyManager(config)

    fillWindow(rampDm, 9, 1)
    const rampChange = Math.abs(rampDm.params.fallSpeed - config.baseFallSpeed)

    fillWindow(easeDm, 5, 5)
    const easeChange = Math.abs(easeDm.params.fallSpeed - config.baseFallSpeed)

    expect(easeChange).toBe(rampChange * 2)
  })

  it('ease step changes spawnInterval by 2x the ramp step', () => {
    const config = makeConfig()
    const rampDm = new DifficultyManager(config)
    const easeDm = new DifficultyManager(config)

    fillWindow(rampDm, 9, 1)
    const rampChange = Math.abs(rampDm.params.spawnInterval - config.baseSpawnInterval)

    fillWindow(easeDm, 5, 5)
    const easeChange = Math.abs(easeDm.params.spawnInterval - config.baseSpawnInterval)

    expect(easeChange).toBe(rampChange * 2)
  })
})

describe('complexity level', () => {
  it('starts at level 0', () => {
    const dm = new DifficultyManager(makeConfig())
    expect(dm.params.complexityLevel).toBe(0)
  })

  it('promotes to level 1 after 5+ consecutive items with accuracy > 0.8', () => {
    const dm = new DifficultyManager(makeConfig())
    // Fill window with 10 hits -> accuracy 1.0, counter starts incrementing
    // Item 10: counter=1, 11:2, 12:3, 13:4, 14:5 -> promotes
    fillWindow(dm, 10, 0)
    for (let i = 0; i < 5; i++) dm.recordResult(true)
    expect(dm.params.complexityLevel).toBe(1)
  })

  it('demotes from level 1 to level 0 when accuracy drops below 0.5', () => {
    const dm = new DifficultyManager(makeConfig())
    fillWindow(dm, 10, 0)
    for (let i = 0; i < 5; i++) dm.recordResult(true)
    expect(dm.params.complexityLevel).toBe(1)

    // Add 6 misses: window becomes 4 hits / 10 = 0.4
    for (let i = 0; i < 6; i++) dm.recordResult(false)
    expect(dm.params.complexityLevel).toBe(0)
  })

  it('resets consecutive counter when accuracy drops to 0.8 or below', () => {
    // Use 8 hits + 2 misses as initial fill = 0.8 accuracy (not > 0.8)
    // The complexity threshold is strictly > 0.8, so counter stays 0
    const dm = new DifficultyManager(makeConfig())
    fillWindow(dm, 8, 2) // accuracy = 0.8, counter = 0
    expect(dm.params.complexityLevel).toBe(0)

    // Sliding window: add hits one by one, accuracy stays 8/10 = 0.8
    // because each hit replaces a hit (oldest) and the 2 misses remain in window
    // +h: [h,h,h,h,h,h,h,m,m,h] = 8/10=0.8 -> counter stays 0
    // +h: [h,h,h,h,h,h,m,m,h,h] = 8/10=0.8 -> counter stays 0
    // +h: [h,h,h,h,h,m,m,h,h,h] = 8/10=0.8 -> counter stays 0
    // +h: [h,h,h,h,m,m,h,h,h,h] = 8/10=0.8 -> counter stays 0
    // +h: [h,h,h,m,m,h,h,h,h,h] = 8/10=0.8 -> counter stays 0
    for (let i = 0; i < 5; i++) dm.recordResult(true)
    // 5 items added but accuracy never exceeded 0.8, so no promotion
    expect(dm.params.complexityLevel).toBe(0)
  })

  it('reaches level 2 after 5 more consecutive high-accuracy items from level 1', () => {
    const dm = new DifficultyManager(makeConfig())
    fillWindow(dm, 10, 0)
    for (let i = 0; i < 5; i++) dm.recordResult(true)
    expect(dm.params.complexityLevel).toBe(1)

    for (let i = 0; i < 5; i++) dm.recordResult(true)
    expect(dm.params.complexityLevel).toBe(2)
  })

  it('demotes level 2 to level 1 (not 0) when accuracy < 0.5', () => {
    const dm = new DifficultyManager(makeConfig())
    fillWindow(dm, 10, 0)
    for (let i = 0; i < 10; i++) dm.recordResult(true) // 5 for level 1, 5 for level 2
    expect(dm.params.complexityLevel).toBe(2)

    for (let i = 0; i < 6; i++) dm.recordResult(false) // 4/10 = 0.4
    expect(dm.params.complexityLevel).toBe(1)
  })
})

describe('convergence', () => {
  it('keeps params in dead zone when accuracy stays at 70%', () => {
    const dm = new DifficultyManager(makeConfig())
    const initial = dm.params

    // Fill window with 70% accuracy: 7 hits, 3 misses
    fillWindow(dm, 7, 3)
    expect(dm.params.fallSpeed).toBe(initial.fallSpeed)
    expect(dm.params.spawnInterval).toBe(initial.spawnInterval)

    // Maintain 70% by replaying the same hit pattern
    // Window: [h,h,h,h,h,h,h,m,m,m]
    // +h: drops oldest h -> [h,h,h,h,h,h,m,m,m,h] = 7/10 = 0.7
    // +h: [h,h,h,h,h,m,m,m,h,h] = 7/10
    // +h: [h,h,h,h,m,m,m,h,h,h] = 7/10
    dm.recordResult(true)
    dm.recordResult(true)
    dm.recordResult(true)

    expect(dm.rollingAccuracy).toBeCloseTo(0.7)
    expect(dm.params.fallSpeed).toBe(initial.fallSpeed)
    expect(dm.params.spawnInterval).toBe(initial.spawnInterval)
  })
})

describe('config presets', () => {
  it('LETTER_DIFFICULTY_CONFIG has correct values', () => {
    expect(LETTER_DIFFICULTY_CONFIG.mode).toBe('letters')
    expect(LETTER_DIFFICULTY_CONFIG.baseFallSpeed).toBe(80)
    expect(LETTER_DIFFICULTY_CONFIG.minFallSpeed).toBe(40)
    expect(LETTER_DIFFICULTY_CONFIG.maxFallSpeed).toBe(150)
    expect(LETTER_DIFFICULTY_CONFIG.baseSpawnInterval).toBe(1500)
    expect(LETTER_DIFFICULTY_CONFIG.minSpawnInterval).toBe(800)
    expect(LETTER_DIFFICULTY_CONFIG.maxSpawnInterval).toBe(3000)
    expect(LETTER_DIFFICULTY_CONFIG.speedStep).toBe(5)
    expect(LETTER_DIFFICULTY_CONFIG.spawnStep).toBe(150)
    expect(LETTER_DIFFICULTY_CONFIG.deadZoneLow).toBe(0.6)
    expect(LETTER_DIFFICULTY_CONFIG.deadZoneHigh).toBe(0.8)
    expect(LETTER_DIFFICULTY_CONFIG.windowSize).toBe(10)
    expect(LETTER_DIFFICULTY_CONFIG.maxComplexityLevel).toBe(2)
  })

  it('WORD_DIFFICULTY_CONFIG has correct values', () => {
    expect(WORD_DIFFICULTY_CONFIG.mode).toBe('words')
    expect(WORD_DIFFICULTY_CONFIG.baseFallSpeed).toBe(50)
    expect(WORD_DIFFICULTY_CONFIG.minFallSpeed).toBe(25)
    expect(WORD_DIFFICULTY_CONFIG.maxFallSpeed).toBe(100)
    expect(WORD_DIFFICULTY_CONFIG.baseSpawnInterval).toBe(2500)
    expect(WORD_DIFFICULTY_CONFIG.minSpawnInterval).toBe(1500)
    expect(WORD_DIFFICULTY_CONFIG.maxSpawnInterval).toBe(4000)
    expect(WORD_DIFFICULTY_CONFIG.maxComplexityLevel).toBe(1)
  })
})
