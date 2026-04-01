import { Container } from 'pixi.js'
import type { GameState, GameContext } from './types.js'

type ProfileView = 'select' | 'create' | 'edit' | 'delete-confirm'

export class ProfileState implements GameState {
  private _currentView: ProfileView = 'select'
  private _container: Container | null = null

  enter(ctx: GameContext): void {
    this._container = new Container()
    ctx.gameRoot.addChild(this._container)
    // Full implementation in Task 2
  }

  exit(ctx: GameContext): void {
    if (this._container) {
      ctx.gameRoot.removeChild(this._container)
      this._container.destroy({ children: true })
      this._container = null
    }
  }

  update(): void {
    // Static UI
  }

  render(): void {
    // no-op
  }
}
