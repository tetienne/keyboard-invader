export type ShipShape =
  | 'arrow'
  | 'round'
  | 'wing'
  | 'saucer'
  | 'rocket'
  | 'star'
  | 'shark'
  | 'crown'

export interface ShipDef {
  id: string
  name: { fr: string; en: string }
  shape: ShipShape
  body: string
  accent: string
  cockpit: string
  price: number
  /** Pilot level required before it can be bought. */
  minLevel: number
}

export const SHIPS: readonly ShipDef[] = [
  {
    id: 'comet',
    name: { fr: 'Comète', en: 'Comet' },
    shape: 'arrow',
    body: '#e8ecff',
    accent: '#ff5fa2',
    cockpit: '#5fd4ff',
    price: 0,
    minLevel: 1,
  },
  {
    id: 'bubble',
    name: { fr: 'Bulle', en: 'Bubble' },
    shape: 'round',
    body: '#ffe066',
    accent: '#ff7a3d',
    cockpit: '#8f9bff',
    price: 60,
    minLevel: 1,
  },
  {
    id: 'falcon',
    name: { fr: 'Faucon', en: 'Falcon' },
    shape: 'wing',
    body: '#7be07b',
    accent: '#1f7a55',
    cockpit: '#fff27a',
    price: 120,
    minLevel: 2,
  },
  {
    id: 'saucer',
    name: { fr: 'Soucoupe', en: 'Saucer' },
    shape: 'saucer',
    body: '#c985ff',
    accent: '#5b1d6e',
    cockpit: '#b8ff6a',
    price: 200,
    minLevel: 3,
  },
  {
    id: 'rocket',
    name: { fr: 'Fusée Rouge', en: 'Red Rocket' },
    shape: 'rocket',
    body: '#ff4d6d',
    accent: '#ffffff',
    cockpit: '#5fd4ff',
    price: 300,
    minLevel: 4,
  },
  {
    id: 'star',
    name: { fr: 'Étoile', en: 'Star' },
    shape: 'star',
    body: '#ffd23f',
    accent: '#ff9f1c',
    cockpit: '#ffffff',
    price: 450,
    minLevel: 6,
  },
  {
    id: 'shark',
    name: { fr: 'Requin', en: 'Shark' },
    shape: 'shark',
    body: '#5fd4ff',
    accent: '#10527a',
    cockpit: '#ff5fa2',
    price: 650,
    minLevel: 8,
  },
  {
    id: 'royal',
    name: { fr: 'Royal', en: 'Royal' },
    shape: 'crown',
    body: '#2b1747',
    accent: '#ffd23f',
    cockpit: '#ff4d6d',
    price: 1000,
    minLevel: 12,
  },
]

export interface LaserDef {
  id: string
  name: { fr: string; en: string }
  colors: readonly string[]
  price: number
}

export const LASERS: readonly LaserDef[] = [
  { id: 'cyan', name: { fr: 'Cyan', en: 'Cyan' }, colors: ['#5fd4ff'], price: 0 },
  { id: 'pink', name: { fr: 'Rose', en: 'Pink' }, colors: ['#ff5fa2'], price: 40 },
  { id: 'lime', name: { fr: 'Citron vert', en: 'Lime' }, colors: ['#b8ff6a'], price: 40 },
  { id: 'gold', name: { fr: 'Or', en: 'Gold' }, colors: ['#ffd23f'], price: 90 },
  {
    id: 'fire',
    name: { fr: 'Feu', en: 'Fire' },
    colors: ['#ff4d2e', '#ffae57', '#ffe066'],
    price: 180,
  },
  {
    id: 'rainbow',
    name: { fr: 'Arc-en-ciel', en: 'Rainbow' },
    colors: ['#ff5fa2', '#ffae57', '#ffe066', '#7be07b', '#5fd4ff', '#c985ff'],
    price: 350,
  },
]

export const findShip = (id: string): ShipDef =>
  SHIPS.find((s) => s.id === id) ?? (SHIPS[0] as ShipDef)
export const findLaser = (id: string): LaserDef =>
  LASERS.find((l) => l.id === id) ?? (LASERS[0] as LaserDef)
