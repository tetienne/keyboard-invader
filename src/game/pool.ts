/**
 * Generic object pool with grow-on-demand.
 * Pre-allocates items via factory. Never shrinks.
 * Uses a Set<number> for O(1) active tracking.
 */
export class ObjectPool<T> {
  private readonly items: T[] = []
  private readonly active = new Set<number>()
  private readonly factory: () => T

  constructor(factory: () => T, initialSize = 20) {
    this.factory = factory
    for (let i = 0; i < initialSize; i++) {
      this.items.push(this.factory())
    }
  }

  /**
   * Acquire the first inactive item, or grow the pool by one.
   */
  acquire(): { item: T; index: number } {
    for (let i = 0; i < this.items.length; i++) {
      if (!this.active.has(i)) {
        this.active.add(i)
        const item = this.items[i] as T
        return { item, index: i }
      }
    }
    // All active -- grow by one
    const index = this.items.length
    this.items.push(this.factory())
    this.active.add(index)
    const item = this.items[index] as T
    return { item, index }
  }

  /**
   * Release an item back to the pool.
   */
  release(index: number): void {
    this.active.delete(index)
  }

  /**
   * Release all items (useful for state transitions).
   */
  reset(): void {
    this.active.clear()
  }

  get activeCount(): number {
    return this.active.size
  }

  get totalCount(): number {
    return this.items.length
  }
}
