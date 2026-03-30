export class DebugOverlay {
  private el: HTMLDivElement
  private visible = false

  constructor() {
    this.el = document.createElement('div')
    this.el.id = 'debug-overlay'
    this.el.style.cssText = `
      position: fixed;
      top: 16px;
      left: 16px;
      background: rgba(22, 33, 62, 0.85);
      color: #a0aec0;
      font-family: monospace;
      font-size: 14px;
      padding: 8px;
      border-radius: 4px;
      z-index: 1000;
      display: none;
      pointer-events: none;
    `
    document.body.appendChild(this.el)
  }

  toggle(): void {
    this.visible = !this.visible
    this.el.style.display = this.visible ? 'block' : 'none'
  }

  update(
    fps: number,
    state: string,
    poolActive: number,
    poolTotal: number,
  ): void {
    if (!this.visible) return
    this.el.innerHTML = [
      `<div style="color:#ffffff;font-weight:bold">FPS: ${String(Math.round(fps))}</div>`,
      `<div>State: <span style="color:#e94560">${state}</span></div>`,
      `<div>Pool: ${String(poolActive)}/${String(poolTotal)}</div>`,
    ].join('')
  }

  destroy(): void {
    this.el.remove()
  }
}
