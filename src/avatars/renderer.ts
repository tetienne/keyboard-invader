import { Sprite, Assets } from 'pixi.js'
import type { Container, Texture } from 'pixi.js'
import type { AvatarDefinition } from './definitions.js'

/**
 * Safely retrieves a texture from the asset cache.
 * Assets.get() is typed as always returning T, but at runtime it returns
 * undefined if the asset has not been loaded yet.
 */
function safeGetTexture(path: string): Texture | undefined {
  return Assets.get<Texture>(path) as Texture | undefined
}

export function drawAvatar(
  container: Container,
  def: AvatarDefinition,
  size: number,
): Sprite | null {
  const texture = safeGetTexture(def.svgPath)
  if (!texture) {
    console.warn(`Avatar texture not loaded: ${def.svgPath}`)
    return null
  }
  const sprite = new Sprite(texture)
  sprite.width = size
  sprite.height = size
  sprite.anchor.set(0.5)
  container.addChild(sprite)
  return sprite
}
