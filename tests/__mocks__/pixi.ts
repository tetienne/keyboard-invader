import { vi, type Mock } from 'vitest'

type Fn = Mock

export class MockContainer {
  children: unknown[] = []
  x = 0
  y = 0
  scale: { set: Fn } = { set: vi.fn() }
  eventMode = 'auto'
  cursor = 'default'
  addChild: Fn = vi.fn((...args: unknown[]) => {
    this.children.push(...args)
    return args[0]
  })
  removeChild: Fn = vi.fn()
  removeChildren: Fn = vi.fn(() => {
    const removed = this.children.slice()
    this.children = []
    return removed
  })
  destroy: Fn = vi.fn()
  on: Fn = vi.fn()
  emit: Fn = vi.fn()
}

export class MockBitmapText {
  x = 0
  y = 0
  width = 100
  height = 40
  text = ''
  tint = 0xffffff
  alpha = 1
  eventMode = 'auto'
  cursor = 'default'
  visible = true
  anchor: { set: Fn } = { set: vi.fn() }
  scale: { set: Fn } = { set: vi.fn() }
  on: Fn = vi.fn()
  destroy: Fn = vi.fn()
  emit: Fn = vi.fn()

  constructor(opts?: { text?: string }) {
    if (opts?.text) this.text = opts.text
  }
}

export class MockGraphics {
  x = 0
  y = 0
  visible = true
  emit: Fn = vi.fn()
  destroy: Fn = vi.fn()
  clear: Fn = vi.fn().mockReturnThis()
  rect: Fn = vi.fn().mockReturnThis()
  circle: Fn = vi.fn().mockReturnThis()
  moveTo: Fn = vi.fn().mockReturnThis()
  lineTo: Fn = vi.fn().mockReturnThis()
  closePath: Fn = vi.fn().mockReturnThis()
  roundRect: Fn = vi.fn().mockReturnThis()
  fill: Fn = vi.fn().mockReturnThis()
}

export function createPixiMocks(): Record<string, unknown> {
  return {
    Container: MockContainer,
    BitmapText: MockBitmapText,
    Graphics: MockGraphics,
    BitmapFont: { install: vi.fn() },
  }
}
