export type Lang = 'fr' | 'en'

/**
 * Kid-friendly vocabulary. Only plain a-z letters: no accents, so every word
 * can be typed with one key per letter on both AZERTY and QWERTY.
 */
const WORDS: Readonly<Record<Lang, string>> = {
  fr: `
    le la un ma ta sa et il on tu oh ah
    ami bus lit nez sol mur roi riz lac sac jus feu jeu oui non bol dos vol fil cou moi toi lui
    mer ver bec sel car col cri eau zoo ski axe pot rat nid dur mou fou but art ici top hop tic tac
    chat lune loup ours lion main pied bras dent lait pain miel ciel vent roue rose bleu vert noir
    nuit jour robe sapin kiwi pomme poire fleur arbre robot avion train neige pluie vache poule
    sucre alien porte table livre jouet crabe singe tigre panda koala lapin magie reine gomme stylo
    jaune rouge blanc bravo super hibou ballon souris canard cheval mouton cochon tortue requin
    pirate prince bonbon crayon orange violet soleil bateau jardin maison girafe dragon cosmos
    orbite camion guitare musique fromage licorne galaxie martien monstre pompier docteur tambour
    baleine dauphin chocolat papillon escargot pingouin tracteur vaisseau capitaine dinosaure
    crocodile kangourou grenouille trompette satellite astronaute
  `,
  en: `
    a an up me we go no so hi oh my is it
    cat dog sun sky car bus hat cup egg fox pig cow bee owl ant bat rat red map box toy ice pen bed
    run hop fun yes big top zoo jam net bag kid win joy
    moon star fish bird frog lion bear duck cake milk tree rain snow wind boat ship ball kite book
    door home blue pink king crab apple grape lemon mouse horse sheep tiger zebra panda koala robot
    alien train plane green black white happy smile magic queen candy pizza water cloud beach shell
    whale shark super puppy comet rocket planet galaxy dragon pirate castle garden monkey rabbit
    turtle donkey parrot cookie banana orange purple yellow flower winter summer meteor jungle
    doctor pencil guitar kitten penguin dolphin giraffe unicorn chicken rainbow balloon teacher
    dinosaur elephant kangaroo drummer spaceship astronaut butterfly crocodile
  `,
}

const cache = new Map<Lang, string[]>()

export function wordList(lang: Lang): string[] {
  let list = cache.get(lang)
  if (!list) {
    list = [...new Set(WORDS[lang].split(/\s+/).filter((w) => w.length > 0))]
    cache.set(lang, list)
  }
  return list
}

export function wordsBetween(lang: Lang, minLen: number, maxLen: number): string[] {
  return wordList(lang).filter((w) => w.length >= minLen && w.length <= maxLen)
}
