# Keyboard Invader

## What This Is

Application web ludique style "typing invaders" pour apprendre la dactylographie aux enfants. Des mots et lettres tombent du haut de l'ecran, l'enfant tape pour les eliminer. Le jeu s'adapte au niveau de chaque enfant avec un systeme de progression (XP, niveaux, personnages a debloquer).

## Core Value

Rendre l'apprentissage du clavier amusant et non frustrant pour des enfants de 5 a 8 ans, avec une difficulte qui s'adapte automatiquement a leur niveau.

## Requirements

### Validated

- [x] Gameplay "typing invaders" rendering infrastructure -- Validated in Phase 02: game-engine-foundation (canvas, game loop, state machine, object pool, input)

### Active

- [ ] Gameplay "typing invaders" -- mots/lettres tombent, taper pour eliminer
- [ ] Mode lettres individuelles pour les plus jeunes (5 ans, pre-lecture)
- [ ] Mode mots pour les plus grands (8 ans, lecture acquise)
- [ ] Difficulte adaptive (vitesse, longueur des mots, complexite)
- [ ] Systeme de niveaux et d'experience (XP)
- [ ] Personnages/avatars deblocables en recompense
- [ ] Profils individuels par enfant (selection par clic sur avatar, pas de mot de passe)
- [ ] Sauvegarde locale (LocalStorage) par defaut
- [ ] Sauvegarde cloud optionnelle (Firebase) pour synchro entre appareils
- [ ] Support multilingue (francais, anglais, extensible)
- [ ] Style visuel cartoon/SVG avec personnages ronds et expressifs
- [ ] Effets sonores (frappe, destruction, felicitations) et musique d'ambiance
- [ ] Design responsive (desktop prioritaire, tablette/mobile support)

### Out of Scope

- Clavier virtuel a l'ecran -- l'objectif est d'apprendre le clavier physique
- Systeme de comptes avec email/mot de passe -- trop complexe pour des enfants
- Mode multijoueur en ligne -- v1 est une experience solo
- Application native (iOS/Android) -- web uniquement

## Context

- Deux enfants cibles : un garcon de 5 ans (decouvre les lettres, ne sait pas encore lire) et une fille de 8 ans (sait lire, peut taper des mots courts)
- L'ecart d'age impose deux modes de jeu distincts mais dans la meme application
- Le format "invaders" est intuitif : l'urgence visuelle motive la frappe sans etre punitive
- Hebergement gratuit requis (GitHub Pages, Netlify, Vercel ou Cloudflare Pages)
- Pas de backend serveur -- tout cote client sauf Firebase optionnel

## Constraints

- **Hosting**: Plateforme gratuite (static hosting) -- pas de budget serveur
- **No backend**: Tout cote client, Firebase uniquement pour la persistence cloud optionnelle
- **Accessibilite**: Doit fonctionner sur tous les navigateurs modernes
- **Performance**: Animations fluides meme sur machines modestes (laptops d'enfants)
- **Securite enfants**: Aucune donnee personnelle collectee, pas de chat, pas de liens externes

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Typing invaders comme gameplay principal | Intuitif, visuellement dynamique, facile a adapter en difficulte | -- Pending |
| Cartoon/SVG pour les visuels | Attrayant pour les enfants, performant (vectoriel), facile a animer | -- Pending |
| Selection profil par clic avatar | Zero friction pour des enfants, pas de mot de passe a retenir | -- Pending |
| LocalStorage + Firebase optionnel | Simple par defaut, synchro cloud en bonus sans complexite initiale | -- Pending |
| Support multilingue des le depart | Permet francais et anglais, architecture extensible | -- Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check -- still the right priority?
3. Audit Out of Scope -- reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-30 after Phase 02 completion*
