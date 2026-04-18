import { Sprite, Assets, Container } from 'pixi.js'
import type { Texture } from 'pixi.js'
import type { AvatarDefinition } from './definitions.js'

export function drawAvatar(
  container: Container,
  def: AvatarDefinition,
  size: number,
): Sprite {
  const texture = Assets.get<Texture>(def.svgPath)
  const sprite = new Sprite(texture)
  sprite.width = size
  sprite.height = size
  sprite.anchor.set(0.5)
  container.addChild(sprite)
  return sprite
}
