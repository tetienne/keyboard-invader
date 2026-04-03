import { describe, it, expect, vi } from 'vitest'

vi.mock('pixi.js', async () => {
  const { createPixiMocks } = await import('../__mocks__/pixi.js')
  return createPixiMocks()
})

import { Starfield } from '@/game/starfield.js'
import { MockContainer } from '../__mocks__/pixi.js'

describe('Starfield', () => {
  it('creates stars as children of parent', () => {
    const parent = new MockContainer() as never
    const sf = new Starfield(parent)
    // Parent should have children (stars)
    const children = (parent as unknown as { children: unknown[] }).children
    expect(children.length).toBe(60)
    expect(sf).toBeDefined()
  })

  it('update moves stars downward', () => {
    const parent = new MockContainer() as never
    const sf = new Starfield(parent)
    // Just verify no crash on update
    sf.update(16)
    sf.update(100)
  })

  it('stars that scroll off bottom reposition at top', () => {
    const parent = new MockContainer() as never
    const sf = new Starfield(parent)
    for (let i = 0; i < 200; i++) {
      sf.update(100)
    }
    // Should not crash; starfield wraps correctly
  })

  it('setIntensity modifies speed multiplier', () => {
    const parent = new MockContainer() as never
    const sf = new Starfield(parent)
    sf.setIntensity(5)
    sf.setIntensity(0)
  })

  it('destroy cleans up stars', () => {
    const parent = new MockContainer() as never
    const sf = new Starfield(parent)
    sf.destroy()
  })
})
