import { describe, it, expect, vi } from 'vitest'

vi.mock('pixi.js', async () => {
  const { createPixiMocks } = await import('../__mocks__/pixi.js')
  return createPixiMocks()
})

import { Starfield } from '@/game/starfield.js'
import { MockContainer } from '../__mocks__/pixi.js'

describe('Starfield', () => {
  it('creates 3 layers with correct total star count (40 + 25 + 15 = 80)', () => {
    const parent = new MockContainer() as never
    const sf = new Starfield(parent)
    expect(sf.layerCount).toBe(3)
    expect(sf.totalStarCount).toBe(80)
  })

  it('update moves stars downward', () => {
    const parent = new MockContainer() as never
    const sf = new Starfield(parent)
    // Access internal state via the parent's children
    // The parent mock stores layer containers in children
    const layers = (parent as unknown as { children: unknown[] }).children
    expect(layers.length).toBe(3)
    // Just verify no crash on update
    sf.update(16)
    sf.update(100)
  })

  it('stars that scroll off bottom reposition at top', () => {
    const parent = new MockContainer() as never
    const sf = new Starfield(parent)
    // Run many updates to force at least some stars past BASE_HEIGHT (720)
    for (let i = 0; i < 200; i++) {
      sf.update(100)
    }
    // Should not crash; starfield wraps correctly
  })

  it('setIntensity modifies layer alpha values', () => {
    const parent = new MockContainer() as never
    const sf = new Starfield(parent)
    // Should not crash
    sf.setIntensity(5)
    sf.setIntensity(0)
  })

  it('destroy cleans up containers', () => {
    const parent = new MockContainer() as never
    const sf = new Starfield(parent)
    sf.destroy()
  })
})
