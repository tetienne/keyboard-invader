# Requirements: Keyboard Invader

**Defined:** 2026-03-28
**Core Value:** Rendre l'apprentissage du clavier amusant et non frustrant pour des enfants de 5 a 8 ans

## v1 Requirements

### Core Gameplay

- [x] **GAME-01**: L'enfant voit des lettres/mots tomber du haut de l'ecran et tape pour les eliminer
- [x] **GAME-02**: L'enfant en mode lettres (pre-lecteur) voit des lettres individuelles avec gros visuels
- [ ] **GAME-03**: L'enfant en mode mots (lecteur) voit des mots courts a taper en entier
- [x] **GAME-04**: L'enfant recoit un feedback audio et visuel immediat a chaque frappe (correct ou incorrect)
- [x] **GAME-05**: L'enfant voit son score affiche pendant la partie
- [ ] **GAME-06**: L'enfant peut mettre le jeu en pause et reprendre
- [ ] **GAME-07**: L'enfant voit un resume de fin de session (precision, lettres/mots pratiques, temps)

### Adaptive Difficulty

- [ ] **DIFF-01**: La vitesse de chute s'ajuste automatiquement selon la performance de l'enfant
- [ ] **DIFF-02**: La longueur/complexite des mots s'adapte au niveau de l'enfant
- [ ] **DIFF-03**: Le taux d'apparition des lettres/mots s'adapte a la performance en temps reel
- [ ] **DIFF-04**: Le systeme vise un taux de reussite d'environ 70% pour maintenir l'etat de flow

### Progression

- [x] **PROG-01**: L'enfant gagne de l'XP apres chaque session en fonction de sa performance
- [x] **PROG-02**: L'enfant monte de niveau en accumulant de l'XP
- [x] **PROG-03**: L'enfant voit une animation de celebration quand il monte de niveau

### Profiles & Persistence

- [ ] **PROF-01**: L'enfant choisit son profil en cliquant sur son avatar (pas de mot de passe)
- [ ] **PROF-02**: La progression de chaque enfant est sauvegardee dans le navigateur (LocalStorage)
- [ ] **PROF-03**: La progression peut etre synchronisee entre appareils via Firebase (optionnel)

### Audio & Visual

- [ ] **AV-01**: Le jeu a un style visuel cartoon/SVG avec des personnages colores et expressifs
- [ ] **AV-02**: Le jeu a des effets sonores (frappe, destruction, felicitations)
- [ ] **AV-03**: Le jeu a une musique d'ambiance avec controle du volume
- [x] **AV-04**: Les animations sont fluides (60fps) meme sur machines modestes

### Developer Experience

- [x] **DX-01**: Pre-commit hooks (pre-commit framework) valident le code avant chaque commit
- [x] **DX-02**: ESLint maximum (typescript-eslint strict + stylistic, no-explicit-any, naming-convention, tous plugins necessaires)
- [x] **DX-03**: Le projet utilise TypeScript en mode strict (strict: true, noUncheckedIndexedAccess, etc.)
- [x] **DX-04**: Tailwind CSS pour le styling des ecrans hors-jeu (menus, profils, settings)
- [x] **DX-05**: Vanilla TypeScript pour le DOM (pas de framework UI) -- PixiJS pour le canvas du jeu

### Infrastructure

- [x] **INFRA-01**: L'application est deployable sur une plateforme gratuite (GitHub Pages, Netlify, Vercel)
- [ ] **INFRA-02**: L'application fonctionne sur tous les navigateurs modernes (Chrome, Firefox, Safari, Edge)
- [ ] **INFRA-03**: L'application est responsive (desktop prioritaire, tablette/mobile supportes)

## v2 Requirements

### Content

- **CONT-01**: Banques de mots multilingues (francais et anglais)
- **CONT-02**: Guide clavier visuel avec zones colorees par doigt
- **CONT-03**: Personnages/avatars deblocables comme recompense

### Advanced

- **ADV-01**: Statistiques detaillees pour les parents
- **ADV-02**: Mode entrainement cible sur les touches les moins maitrisees

## Out of Scope

| Feature | Reason |
|---------|--------|
| Multijoueur / competition en ligne | Anxiete et frustration chez les jeunes enfants |
| Leaderboards publics | Nuit a l'estime de soi des enfants en bas age |
| Clavier virtuel pour taper | L'objectif est le clavier physique |
| Comptes email/mot de passe | Trop complexe pour des enfants |
| Publicites ou achats in-app | Projet personnel, detruit la confiance des parents |
| Phrases avec ponctuation | Un enfant de 5 ans ne connait pas la ponctuation |
| WPM comme metrique principale | Decourageant pour les debutants |
| Application native iOS/Android | Web uniquement |
| Game over punitif | Un enfant de 5 ans qui perd brutalement arrete de jouer |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| GAME-01 | Phase 2, 3 | Complete |
| GAME-02 | Phase 3 | Complete |
| GAME-03 | Phase 4 | Pending |
| GAME-04 | Phase 3 | Complete |
| GAME-05 | Phase 3 | Complete |
| GAME-06 | Phase 4 | Pending |
| GAME-07 | Phase 4 | Pending |
| DIFF-01 | Phase 5 | Pending |
| DIFF-02 | Phase 5 | Pending |
| DIFF-03 | Phase 5 | Pending |
| DIFF-04 | Phase 5 | Pending |
| PROG-01 | Phase 7 | Complete |
| PROG-02 | Phase 7 | Complete |
| PROG-03 | Phase 7 | Complete |
| PROF-01 | Phase 6 | Pending |
| PROF-02 | Phase 6 | Pending |
| PROF-03 | Phase 10 | Pending |
| AV-01 | Phase 8 | Pending |
| AV-02 | Phase 9 | Pending |
| AV-03 | Phase 9 | Pending |
| AV-04 | Phase 2 | Complete |
| DX-01 | Phase 1 | Complete |
| DX-02 | Phase 1 | Complete |
| DX-03 | Phase 1 | Complete |
| DX-04 | Phase 1 | Complete |
| DX-05 | Phase 1 | Complete |
| INFRA-01 | Phase 1 | Complete |
| INFRA-02 | Phase 10 | Pending |
| INFRA-03 | Phase 10 | Pending |

**Coverage:**
- v1 requirements: 29 total
- Mapped to phases: 29
- Unmapped: 0

---
*Requirements defined: 2026-03-28*
*Last updated: 2026-03-28 after roadmap creation*
