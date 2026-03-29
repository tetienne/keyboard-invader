# Requirements: Keyboard Invader

**Defined:** 2026-03-28
**Core Value:** Rendre l'apprentissage du clavier amusant et non frustrant pour des enfants de 5 a 8 ans

## v1 Requirements

### Core Gameplay

- [ ] **GAME-01**: L'enfant voit des lettres/mots tomber du haut de l'ecran et tape pour les eliminer
- [ ] **GAME-02**: L'enfant en mode lettres (pre-lecteur) voit des lettres individuelles avec gros visuels
- [ ] **GAME-03**: L'enfant en mode mots (lecteur) voit des mots courts a taper en entier
- [ ] **GAME-04**: L'enfant recoit un feedback audio et visuel immediat a chaque frappe (correct ou incorrect)
- [ ] **GAME-05**: L'enfant voit son score affiche pendant la partie
- [ ] **GAME-06**: L'enfant peut mettre le jeu en pause et reprendre
- [ ] **GAME-07**: L'enfant voit un resume de fin de session (precision, lettres/mots pratiques, temps)

### Adaptive Difficulty

- [ ] **DIFF-01**: La vitesse de chute s'ajuste automatiquement selon la performance de l'enfant
- [ ] **DIFF-02**: La longueur/complexite des mots s'adapte au niveau de l'enfant
- [ ] **DIFF-03**: Le taux d'apparition des lettres/mots s'adapte a la performance en temps reel
- [ ] **DIFF-04**: Le systeme vise un taux de reussite d'environ 70% pour maintenir l'etat de flow

### Progression

- [ ] **PROG-01**: L'enfant gagne de l'XP apres chaque session en fonction de sa performance
- [ ] **PROG-02**: L'enfant monte de niveau en accumulant de l'XP
- [ ] **PROG-03**: L'enfant voit une animation de celebration quand il monte de niveau

### Profiles & Persistence

- [ ] **PROF-01**: L'enfant choisit son profil en cliquant sur son avatar (pas de mot de passe)
- [ ] **PROF-02**: La progression de chaque enfant est sauvegardee dans le navigateur (LocalStorage)
- [ ] **PROF-03**: La progression peut etre synchronisee entre appareils via Firebase (optionnel)

### Audio & Visual

- [ ] **AV-01**: Le jeu a un style visuel cartoon/SVG avec des personnages colores et expressifs
- [ ] **AV-02**: Le jeu a des effets sonores (frappe, destruction, felicitations)
- [ ] **AV-03**: Le jeu a une musique d'ambiance avec controle du volume
- [ ] **AV-04**: Les animations sont fluides (60fps) meme sur machines modestes

### Developer Experience

- [ ] **DX-01**: Pre-commit hooks (pre-commit framework) valident le code avant chaque commit
- [ ] **DX-02**: ESLint maximum (typescript-eslint strict + stylistic, no-explicit-any, naming-convention, tous plugins necessaires)
- [ ] **DX-03**: Le projet utilise TypeScript en mode strict (strict: true, noUncheckedIndexedAccess, etc.)
- [ ] **DX-04**: Tailwind CSS pour le styling des ecrans hors-jeu (menus, profils, settings)
- [ ] **DX-05**: Vanilla TypeScript pour le DOM (pas de framework UI) -- PixiJS pour le canvas du jeu

### Infrastructure

- [ ] **INFRA-01**: L'application est deployable sur une plateforme gratuite (GitHub Pages, Netlify, Vercel)
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
| (populated during roadmap creation) | | |

**Coverage:**
- v1 requirements: 26 total
- Mapped to phases: 0
- Unmapped: 26

---
*Requirements defined: 2026-03-28*
*Last updated: 2026-03-28 after initial definition*
