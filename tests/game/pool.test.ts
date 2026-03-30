import { describe, it, expect } from 'vitest'
import { ObjectPool } from '@/game/pool'

function createCounter() {
  let id = 0
  return () => ({ id: id++ })
}

describe('ObjectPool', () => {
  it('pre-allocates initialSize items', () => {
    const pool = new ObjectPool(createCounter(), 10)
    expect(pool.totalCount).toBe(10)
    expect(pool.activeCount).toBe(0)
  })

  it('acquire returns item and increments activeCount', () => {
    const pool = new ObjectPool(createCounter(), 5)
    const { item, index } = pool.acquire()
    expect(item).toBeDefined()
    expect(index).toBeGreaterThanOrEqual(0)
    expect(pool.activeCount).toBe(1)
  })

  it('release decrements activeCount', () => {
    const pool = new ObjectPool(createCounter(), 5)
    const { index } = pool.acquire()
    pool.release(index)
    expect(pool.activeCount).toBe(0)
  })

  it('grows pool when all items are active', () => {
    const pool = new ObjectPool(createCounter(), 2)
    pool.acquire()
    pool.acquire()
    expect(pool.totalCount).toBe(2)
    pool.acquire() // should grow
    expect(pool.totalCount).toBe(3)
    expect(pool.activeCount).toBe(3)
  })

  it('never shrinks after release', () => {
    const pool = new ObjectPool(createCounter(), 5)
    const indices: number[] = []
    for (let i = 0; i < 5; i++) {
      indices.push(pool.acquire().index)
    }
    for (const idx of indices) {
      pool.release(idx)
    }
    expect(pool.totalCount).toBe(5)
    expect(pool.activeCount).toBe(0)
  })

  it('reset releases all items', () => {
    const pool = new ObjectPool(createCounter(), 5)
    pool.acquire()
    pool.acquire()
    pool.acquire()
    expect(pool.activeCount).toBe(3)
    pool.reset()
    expect(pool.activeCount).toBe(0)
    expect(pool.totalCount).toBe(5)
  })

  it('reuses released items before growing', () => {
    const pool = new ObjectPool(createCounter(), 2)
    const first = pool.acquire()
    pool.release(first.index)
    const second = pool.acquire()
    expect(second.index).toBe(first.index)
    expect(pool.totalCount).toBe(2)
  })
})
