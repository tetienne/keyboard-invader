/**
 * Input buffer that captures keydown events, filters repeats and modifiers,
 * normalizes to lowercase, and drains per tick.
 *
 * Uses event.key (not event.code) for AZERTY keyboard safety (D-08, D-09).
 */
export class InputManager {
  private buffer: string[] = []
  private listener: ((event: KeyboardEvent) => void) | null = null

  /**
   * Process a keyboard event. Public for direct testing;
   * also wired by attach() to window keydown.
   */
  handleKeyDown(event: KeyboardEvent): void {
    if (event.repeat) return
    if (event.ctrlKey || event.altKey || event.metaKey) return
    const key = event.key.toLowerCase()
    this.buffer.push(key)
  }

  /**
   * Attach keydown listener to window.
   */
  attach(): void {
    this.listener = (e: KeyboardEvent) => {
      this.handleKeyDown(e)
    }
    window.addEventListener('keydown', this.listener)
  }

  /**
   * Detach keydown listener from window.
   */
  detach(): void {
    if (this.listener) {
      window.removeEventListener('keydown', this.listener)
      this.listener = null
    }
  }

  /**
   * Return buffered keys and clear the buffer.
   * Called once per game tick.
   */
  drain(): string[] {
    const keys = this.buffer.slice()
    this.buffer.length = 0
    return keys
  }
}
