import type { Profile } from '../state/profile'
import { totalStars } from '../state/profile'

export interface TrophyDef {
  id: string
  icon: string
  name: { fr: string; en: string }
  desc: { fr: string; en: string }
  check: (p: Profile) => boolean
}

const t = (
  id: string,
  icon: string,
  nameFr: string,
  nameEn: string,
  descFr: string,
  descEn: string,
  check: (p: Profile) => boolean,
): TrophyDef => ({
  id,
  icon,
  name: { fr: nameFr, en: nameEn },
  desc: { fr: descFr, en: descEn },
  check,
})

export const TROPHIES: readonly TrophyDef[] = [
  t(
    'first',
    '👾',
    'Premier contact',
    'First contact',
    'Détruis ton premier alien',
    'Destroy your first alien',
    (p) => p.stats.kills >= 1,
  ),
  t(
    'kills100',
    '🎯',
    'Tireur d’élite',
    'Sharpshooter',
    'Détruis 100 aliens',
    'Destroy 100 aliens',
    (p) => p.stats.kills >= 100,
  ),
  t(
    'kills500',
    '🚀',
    'Héros de l’espace',
    'Space hero',
    'Détruis 500 aliens',
    'Destroy 500 aliens',
    (p) => p.stats.kills >= 500,
  ),
  t(
    'kills2000',
    '🌌',
    'Gardien de la galaxie',
    'Galaxy guardian',
    'Détruis 2000 aliens',
    'Destroy 2000 aliens',
    (p) => p.stats.kills >= 2000,
  ),
  t(
    'combo20',
    '🔥',
    'En feu !',
    'On fire!',
    'Fais un combo de 20',
    'Reach a 20 combo',
    (p) => p.stats.bestCombo >= 20,
  ),
  t(
    'combo50',
    '☄️',
    'Inarrêtable',
    'Unstoppable',
    'Fais un combo de 50',
    'Reach a 50 combo',
    (p) => p.stats.bestCombo >= 50,
  ),
  t(
    'combo100',
    '🌟',
    'Doigts magiques',
    'Magic fingers',
    'Fais un combo de 100',
    'Reach a 100 combo',
    (p) => p.stats.bestCombo >= 100,
  ),
  t(
    'perfect',
    '💎',
    'Parfait !',
    'Perfect!',
    'Gagne 3 étoiles à un niveau',
    'Get 3 stars on a level',
    (p) => p.stats.perfectLevels >= 1,
  ),
  t(
    'perfect10',
    '👑',
    'Roi des étoiles',
    'Star royalty',
    'Gagne 3 étoiles à 10 niveaux',
    'Get 3 stars on 10 levels',
    (p) => p.stats.perfectLevels >= 10,
  ),
  t(
    'boss',
    '🐙',
    'Chasseur de boss',
    'Boss hunter',
    'Bats ton premier boss',
    'Beat your first boss',
    (p) => p.stats.bossKills >= 1,
  ),
  t(
    'boss6',
    '🏆',
    'Légende des boss',
    'Boss legend',
    'Bats 6 boss',
    'Beat 6 bosses',
    (p) => p.stats.bossKills >= 6,
  ),
  t(
    'golden',
    '🪙',
    'Chercheur d’or',
    'Gold digger',
    'Attrape 10 aliens dorés',
    'Catch 10 golden aliens',
    (p) => p.stats.goldenKills >= 10,
  ),
  t(
    'powerups',
    '⚡',
    'Super pouvoirs',
    'Super powers',
    'Utilise 10 bonus',
    'Use 10 power-ups',
    (p) => p.stats.powerups >= 10,
  ),
  t(
    'stars30',
    '⭐',
    'Collectionneur',
    'Collector',
    'Gagne 30 étoiles',
    'Earn 30 stars',
    (p) => totalStars(p) >= 30,
  ),
  t(
    'stars100',
    '🌠',
    'Pluie d’étoiles',
    'Star shower',
    'Gagne 100 étoiles',
    'Earn 100 stars',
    (p) => totalStars(p) >= 100,
  ),
  t(
    'wave5',
    '♾️',
    'Survivant',
    'Survivor',
    'Atteins la vague 5 en mode infini',
    'Reach wave 5 in endless mode',
    (p) => p.endlessBestWave >= 5,
  ),
  t(
    'wave10',
    '🛸',
    'Increvable',
    'Unbreakable',
    'Atteins la vague 10 en mode infini',
    'Reach wave 10 in endless mode',
    (p) => p.endlessBestWave >= 10,
  ),
  t(
    'daily7',
    '🎁',
    'Fidèle pilote',
    'Loyal pilot',
    'Joue 7 jours d’affilée',
    'Play 7 days in a row',
    (p) => p.daily.streak >= 7,
  ),
  t(
    'ship',
    '🛠️',
    'Nouveau vaisseau',
    'New ride',
    'Achète un vaisseau au hangar',
    'Buy a ship in the hangar',
    (p) => p.ships.length >= 2,
  ),
  t(
    'keys1000',
    '⌨️',
    'Mille touches',
    'A thousand keys',
    'Tape 1000 bonnes touches',
    'Type 1000 correct keys',
    (p) => p.stats.correct >= 1000,
  ),
  t(
    'keys10000',
    '🧠',
    'Maître du clavier',
    'Keyboard master',
    'Tape 10 000 bonnes touches',
    'Type 10,000 correct keys',
    (p) => p.stats.correct >= 10000,
  ),
]

/** Awards any trophy whose condition is now met; returns the new ones. */
export function awardTrophies(profile: Profile): TrophyDef[] {
  const fresh: TrophyDef[] = []
  for (const trophy of TROPHIES) {
    if (!profile.trophies.includes(trophy.id) && trophy.check(profile)) {
      profile.trophies.push(trophy.id)
      fresh.push(trophy)
    }
  }
  return fresh
}
