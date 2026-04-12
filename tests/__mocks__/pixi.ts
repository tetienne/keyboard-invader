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
  children: unknown[] = []
  x = 0
  y = 0
  alpha = 1
  tint = 0xffffff
  visible = true
  eventMode = 'auto'
  cursor = 'default'
  scale: { set: Fn } = { set: vi.fn() }
  on: Fn = vi.fn()
  emit: Fn = vi.fn()
  addChild: Fn = vi.fn((...args: unknown[]) => {
    this.children.push(...args)
    return args[0]
  })
  removeChild: Fn = vi.fn()
  destroy: Fn = vi.fn()
  clear: Fn = vi.fn().mockReturnThis()
  rect: Fn = vi.fn().mockReturnThis()
  circle: Fn = vi.fn().mockReturnThis()
  moveTo: Fn = vi.fn().mockReturnThis()
  lineTo: Fn = vi.fn().mockReturnThis()
  closePath: Fn = vi.fn().mockReturnThis()
  roundRect: Fn = vi.fn().mockReturnThis()
  fill: Fn = vi.fn().mockReturnThis()
  stroke: Fn = vi.fn().mockReturnThis()
  arc: Fn = vi.fn().mockReturnThis()
}

export class MockSplitBitmapText {
  x = 0
  y = 0
  width = 200
  height = 40
  text = ''
  tint = 0xffffff
  alpha = 1
  visible = true
  chars: { tint: number }[] = []
  anchor: { set: Fn } = { set: vi.fn() }
  scale: { set: Fn } = { set: vi.fn() }
  split: Fn = vi.fn()
  destroy: Fn = vi.fn()

  constructor(opts?: { text?: string }) {
    if (opts?.text) this.text = opts.text
  }
}

export class MockText {
  x = 0
  y = 0
  text = ''
  style: unknown = null
  alpha = 1
  visible = true
  anchor: { set: Fn } = { set: vi.fn() }
  scale: { set: Fn } = { set: vi.fn() }
  destroy: Fn = vi.fn()

  constructor(opts?: { text?: string; style?: unknown }) {
    if (opts?.text) this.text = opts.text
    if (opts?.style) this.style = opts.style
  }
}

export class MockSprite {
  x = 0
  y = 0
  width = 64
  height = 64
  alpha = 1
  tint = 0xffffff
  visible = true
  texture: unknown = null
  anchor: { set: Fn } = { set: vi.fn() }
  scale: { x: number; y: number; set: Fn } = {
    x: 1,
    y: 1,
    set: vi.fn(function (this: { x: number; y: number }, sx: number, sy?: number) {
      this.x = sx
      this.y = sy ?? sx
    }),
  }
  destroy: Fn = vi.fn()

  constructor(texture?: unknown) {
    if (texture) this.texture = texture
  }
}

export class MockTexture {
  source = 'mock'
}

export function createPixiMocks(): Record<string, unknown> {
  return {
    Container: MockContainer,
    BitmapText: MockBitmapText,
    SplitBitmapText: MockSplitBitmapText,
    Graphics: MockGraphics,
    Sprite: MockSprite,
    Texture: MockTexture,
    Text: MockText,
    BitmapFont: { install: vi.fn() },
    BitmapFontManager: { install: vi.fn(), ASCII: [[' ', '~']] },
    Assets: {
      load: vi.fn(() => Promise.resolve()),
      get: vi.fn(() => new MockTexture()),
    },
  }
}
