import './style.css'

import { Application, BitmapFont, BitmapText } from 'pixi.js'

async function init(): Promise<void> {
  const app = new Application()

  await app.init({ background: '#1a1a2e', resizeTo: window })

  const container = document.getElementById('game-container')

  if (!container) {
    throw new Error('game-container element not found')
  }

  container.appendChild(app.canvas)

  BitmapFont.install({
    name: 'GameFont',
    style: {
      fontFamily: 'Arial',
      fontSize: 48,
      fill: '#ffffff',
    },
  })

  const title = new BitmapText({
    text: 'Keyboard Invader',
    style: { fontFamily: 'GameFont', fontSize: 48 },
  })

  title.x = app.screen.width / 2 - title.width / 2
  title.y = app.screen.height / 2 - title.height / 2

  app.stage.addChild(title)
}

void init()
