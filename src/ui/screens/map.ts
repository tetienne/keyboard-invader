import { campaign, type LevelDef } from '../../content/campaign'
import { t } from '../../core/i18n'
import { isLevelUnlocked, isWorldUnlocked, levelStars } from '../../game/progression'
import { totalStars } from '../../state/profile'
import type { App, Screen } from '../app'
import { h, starsText } from '../dom'
import { backButton, coinChip, settingsButton, starChip } from '../widgets'
import { openSettings } from './settings'
import { gameScreen, levelLaunch } from './game'
import { hubScreen } from './hub'

function planetStyle(base: string, glow: string, dark: string): string {
  return `background: radial-gradient(circle at 35% 30%, #ffffff66, ${base} 45%, ${dark}); --glow: ${glow}88`
}

/** First unlocked level without stars: where the pilot marker stands. */
function currentLevel(app: App, levels: readonly LevelDef[]): LevelDef | undefined {
  const profile = app.profile
  if (!profile) return undefined
  return levels.find(
    (l) => isLevelUnlocked(profile, app.settings.layout, l) && levelStars(profile, l.id) === 0,
  )
}

export function defaultWorld(app: App): number {
  const profile = app.profile
  if (!profile) return 0
  const worlds = campaign(app.settings.layout)
  let best = 0
  for (const w of worlds) {
    if (isWorldUnlocked(profile, app.settings.layout, w.index) && currentLevel(app, w.levels)) {
      best = w.index
      if (!profile.reader || w.index >= 3) break
    }
  }
  return best
}

export function mapScreen(app: App, worldIndex = defaultWorld(app)): Screen {
  const profile = app.profile
  if (!profile) return hubScreen(app)
  const layout = app.settings.layout
  const worlds = campaign(layout)
  const world = worlds[worldIndex] ?? worlds[0]
  if (!world) return hubScreen(app)
  const unlocked = isWorldUnlocked(profile, layout, world.index)
  const current = currentLevel(app, world.levels)
  const { theme } = world

  const tabs = worlds.map((w) =>
    h(
      'button',
      {
        class: `world-tab${w.index === world.index ? ' active' : ''}${isWorldUnlocked(profile, layout, w.index) ? '' : ' locked'}`,
        style: planetStyle(w.theme.planet.base, w.theme.planet.glow, w.theme.planet.shade),
        title: t(`world.${w.index}` as 'world.0'),
        onClick: () => app.go(mapScreen(app, w.index)),
      },
      isWorldUnlocked(profile, layout, w.index) ? '' : '🔒',
    ),
  )

  const n = world.levels.length
  // Narrow phones get a path winding downwards instead of across.
  const vertical = window.innerWidth < 640
  const points = world.levels.map((_, i) =>
    vertical
      ? { x: 50 + Math.sin(i * 1.25) * 30, y: 6 + (i * 88) / (n - 1) }
      : { x: 7 + (i * 86) / (n - 1), y: 50 + Math.sin(i * 1.25) * 28 },
  )
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '0 0 100 100')
  svg.setAttribute('preserveAspectRatio', 'none')
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'polyline')
  path.setAttribute('points', points.map((p) => `${p.x},${p.y}`).join(' '))
  path.setAttribute('fill', 'none')
  path.setAttribute('stroke', theme.accent)
  path.setAttribute('stroke-opacity', '0.55')
  path.setAttribute('stroke-width', '6')
  path.setAttribute('stroke-dasharray', '2 14')
  path.setAttribute('stroke-linecap', 'round')
  path.setAttribute('vector-effect', 'non-scaling-stroke')
  svg.append(path)

  const launch = (level: LevelDef): void => app.go(gameScreen(app, levelLaunch(level)))

  const nodes = world.levels.map((level, i) => {
    const open = unlocked && isLevelUnlocked(profile, layout, level)
    const stars = levelStars(profile, level.id)
    const pos = points[i] ?? { x: 50, y: 50 }
    const cls = [
      'node',
      'pop',
      level.boss ? 'boss' : '',
      stars > 0 ? 'done' : '',
      open ? '' : 'locked',
      level === current ? 'current' : '',
    ]
    const node = h(
      'button',
      {
        class: cls.filter(Boolean).join(' '),
        style: `left:${pos.x}%;top:${pos.y}%;animation-delay:${i * 50}ms`,
        disabled: !open,
        title: t('levelTitle', { id: level.id }),
        onClick: () => launch(level),
      },
      open ? (level.boss ? '👾' : String(level.index + 1)) : '🔒',
      open && !level.boss ? starsText(stars) : null,
      open && level.boss && stars > 0 ? starsText(stars) : null,
      level === current ? h('span', { class: 'marker' }, profile.avatar) : null,
    )
    return node
  })

  const el = h(
    'div',
    { class: vertical ? 'screen scroll' : 'screen' },
    h(
      'div',
      { class: 'topbar' },
      backButton(() => app.go(hubScreen(app))),
      h(
        'div',
        { class: 'row' },
        starChip(totalStars(profile)),
        coinChip(profile.coins),
        settingsButton(() => openSettings(app, () => app.go(mapScreen(app, world.index)))),
      ),
    ),
    h(
      'div',
      { class: 'map', style: vertical ? 'margin-top:64px;padding-bottom:40px' : '' },
      h(
        'div',
        { class: 'world-head' },
        h('div', {
          class: 'planet',
          style: planetStyle(theme.planet.base, theme.planet.glow, theme.planet.shade),
        }),
        h(
          'div',
          null,
          h(
            'h1',
            { class: 'title', style: 'text-align:left' },
            t(`world.${world.index}` as 'world.0'),
          ),
          h(
            'p',
            { class: 'subtitle', style: 'text-align:left' },
            t(`worldSub.${world.index}` as 'worldSub.0'),
          ),
        ),
      ),
      h('div', { class: 'world-tabs' }, ...tabs),
      unlocked
        ? h(
            'div',
            {
              class: vertical ? 'path vertical' : 'path',
              style: vertical ? `height:${n * 92}px` : '',
            },
            svg,
            ...nodes,
          )
        : h('div', { class: 'panel lock-note' }, '🔒 ', t('worldLocked')),
    ),
  )

  return {
    el,
    scene: 'menu',
    music: 'menu',
    world: world.index,
    onKey: (e) => {
      if (e.key === 'ArrowRight' && worlds[world.index + 1]) app.go(mapScreen(app, world.index + 1))
      else if (e.key === 'ArrowLeft' && world.index > 0) app.go(mapScreen(app, world.index - 1))
      else if ((e.key === 'Enter' || e.key === ' ') && current && unlocked) launch(current)
      else if (e.key === 'Escape') app.go(hubScreen(app))
    },
  }
}
