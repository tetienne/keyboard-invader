import { describe, it, expect } from 'vitest'
import { InputManager } from '@/game/input'

function makeKeyEvent(
  key: string,
  overrides: Partial<KeyboardEventInit> = {},
): KeyboardEvent {
  return new KeyboardEvent('keydown', { key, ...overrides })
}

describe('InputManager', () => {
  it('buffers a normal keypress', () => {
    const input = new InputManager()
    input.handleKeyDown(makeKeyEvent('a'))
    expect(input.drain()).toEqual(['a'])
  })

  it('ignores key repeats', () => {
    const input = new InputManager()
    input.handleKeyDown(makeKeyEvent('a', { repeat: true }))
    expect(input.drain()).toEqual([])
  })

  it('ignores ctrlKey modifier', () => {
    const input = new InputManager()
    input.handleKeyDown(makeKeyEvent('a', { ctrlKey: true }))
    expect(input.drain()).toEqual([])
  })

  it('ignores altKey modifier', () => {
    const input = new InputManager()
    input.handleKeyDown(makeKeyEvent('a', { altKey: true }))
    expect(input.drain()).toEqual([])
  })

  it('ignores metaKey modifier', () => {
    const input = new InputManager()
    input.handleKeyDown(makeKeyEvent('a', { metaKey: true }))
    expect(input.drain()).toEqual([])
  })

  it('normalizes to lowercase', () => {
    const input = new InputManager()
    input.handleKeyDown(makeKeyEvent('A'))
    expect(input.drain()).toEqual(['a'])
  })

  it('buffers multiple keys in order', () => {
    const input = new InputManager()
    input.handleKeyDown(makeKeyEvent('a'))
    input.handleKeyDown(makeKeyEvent('b'))
    input.handleKeyDown(makeKeyEvent('c'))
    expect(input.drain()).toEqual(['a', 'b', 'c'])
  })

  it('drain empties buffer', () => {
    const input = new InputManager()
    input.handleKeyDown(makeKeyEvent('a'))
    input.drain()
    expect(input.drain()).toEqual([])
  })
})
