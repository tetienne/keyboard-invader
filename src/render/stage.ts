/** Full-window canvas with DPR handling and automatic quality fallback. */
export class Stage {
  readonly ctx: CanvasRenderingContext2D
  w = 0
  h = 0
  dpr = 1
  private maxDpr = 2
  private slowFrames = 0

  constructor(readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) throw new Error('Canvas 2D not supported')
    this.ctx = ctx
    this.resize()
    window.addEventListener('resize', () => this.resize())
  }

  resize(): void {
    this.dpr = Math.min(this.maxDpr, window.devicePixelRatio || 1)
    this.w = window.innerWidth
    this.h = window.innerHeight
    this.canvas.width = Math.round(this.w * this.dpr)
    this.canvas.height = Math.round(this.h * this.dpr)
    this.canvas.style.width = `${this.w}px`
    this.canvas.style.height = `${this.h}px`
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
  }

  /** Drops resolution on machines that cannot keep up (kids' old laptops). */
  reportFrame(dtMs: number): void {
    if (dtMs > 26 && dtMs < 200) this.slowFrames++
    else this.slowFrames = Math.max(0, this.slowFrames - 1)
    if (this.slowFrames > 90 && this.maxDpr > 1) {
      this.maxDpr = 1
      this.slowFrames = 0
      this.resize()
    }
  }

  begin(): void {
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    this.ctx.globalAlpha = 1
    this.ctx.globalCompositeOperation = 'source-over'
  }
}
