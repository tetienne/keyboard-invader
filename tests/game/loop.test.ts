import { describe, it, expect, vi } from 'vitest'
import { GameLoop, TICK_MS } from '@/game/loop.js'

describe('GameLoop', () => {
  it('single tick at exactly tickMs', () => {
    const loop = new GameLoop()
    const onUpdate = vi.fn()
    loop.onUpdate = onUpdate
    loop.onRender = vi.fn()
    loop.accumulate(TICK_MS)
    loop.tick()
    expect(onUpdate).toHaveBeenCalledTimes(1)
    expect(onUpdate).toHaveBeenCalledWith(TICK_MS)
  })

  it('no tick when under tickMs', () => {
    const loop = new GameLoop()
    const onUpdate = vi.fn()
    loop.onUpdate = onUpdate
    loop.onRender = vi.fn()
    loop.accumulate(10)
    loop.tick()
    expect(onUpdate).toHaveBeenCalledTimes(0)
  })

  it('multiple ticks', () => {
    const loop = new GameLoop()
    const onUpdate = vi.fn()
    loop.onUpdate = onUpdate
    loop.onRender = vi.fn()
    loop.accumulate(TICK_MS * 2)
    loop.tick()
    expect(onUpdate).toHaveBeenCalledTimes(2)
  })

  it('caps catch-up at maxCatchUp', () => {
    const loop = new GameLoop()
    const onUpdate = vi.fn()
    loop.onUpdate = onUpdate
    loop.onRender = vi.fn()
    loop.accumulate(200)
    loop.tick()
    expect(onUpdate).toHaveBeenCalledTimes(3)
  })

  it('drops excess accumulated time after cap', () => {
    const loop = new GameLoop()
    const onUpdate = vi.fn()
    loop.onUpdate = onUpdate
    loop.onRender = vi.fn()
    loop.accumulate(200)
    loop.tick()
    onUpdate.mockClear()
    loop.accumulate(TICK_MS)
    loop.tick()
    expect(onUpdate).toHaveBeenCalledTimes(1)
  })

  it('resetAccumulator prevents pending ticks', () => {
    const loop = new GameLoop()
    const onUpdate = vi.fn()
    loop.onUpdate = onUpdate
    loop.onRender = vi.fn()
    loop.accumulate(50)
    loop.resetAccumulator()
    loop.tick()
    expect(onUpdate).toHaveBeenCalledTimes(0)
  })
})
