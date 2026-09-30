/** A random source returning floats in [0, 1). Injectable so game logic stays testable. */
export type Rng = () => number

/** Small, fast, seedable PRNG (mulberry32). */
export function createRng(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function randRange(rng: Rng, min: number, max: number): number {
  return min + (max - min) * rng()
}

export function randInt(rng: Rng, min: number, maxInclusive: number): number {
  return Math.floor(randRange(rng, min, maxInclusive + 1))
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
  if (items.length === 0) throw new Error('pick() on empty list')
  return items[Math.floor(rng() * items.length)] as T
}

export function weightedPick<T>(rng: Rng, items: readonly T[], weight: (item: T) => number): T {
  if (items.length === 0) throw new Error('weightedPick() on empty list')
  let total = 0
  for (const item of items) total += Math.max(0, weight(item))
  if (total <= 0) return pick(rng, items)
  let roll = rng() * total
  for (const item of items) {
    roll -= Math.max(0, weight(item))
    if (roll < 0) return item
  }
  return items[items.length - 1] as T
}
