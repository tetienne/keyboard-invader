# Feature Landscape

**Domain:** Typing game for children (5-8 years old), "typing invaders" style
**Researched:** 2026-03-28

## Competitive Landscape Summary

The kids typing game space is well-established. Key players and what they do well:

- **TypingClub / Jungle Junior**: Best structured curriculum for young kids. 250+ lessons, animated stories, star ratings per level, badge collection. Alphabet-first approach for pre-readers.
- **Nitro Type**: Best engagement loop for older kids. Multiplayer racing, short 30-60s sessions, car customization. Works for grade 3+ (readers).
- **ZType**: Closest to our "typing invaders" concept. Space shooter, words descend, type to destroy. Great game feel (explosions, audio cues, escalating tension). No adaptive difficulty -- just escalating waves. Targets teens/adults, not young children.
- **Dance Mat Typing (BBC)**: Best character-driven instruction. 4 levels x 3 stages, animated animal guides, celebration songs after each stage. Ages 7-11. No adaptive difficulty.
- **Typing.com**: Best teacher/classroom tools. K-12 curriculum, digital citizenship lessons, unlimited free tier. Broad but not deep on game engagement.
- **KidzType**: Best variety. 30+ mini-games (balloon pop, ninja, racing). Low barrier -- no login required. Lacks coherent progression.

**Key insight for Keyboard Invader:** ZType proves the "type to shoot" mechanic works, but targets older users. No product combines the invaders mechanic with adaptive difficulty for ages 5-8 specifically. That is the gap.

## Table Stakes

Features users expect. Missing = product feels incomplete or kids disengage immediately.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Core "falling words/letters" gameplay | This IS the product. ZType/invaders mechanic is the core promise. | High | Canvas/WebGL animation loop, collision detection, input handling |
| Single-letter mode for pre-readers | 5-year-olds cannot read words. Every competitor with young-kid support has letter-only modes (Jungle Junior, Keyboarding Zoo). | Medium | Subset of word mode; simpler content, larger visuals |
| Word mode for readers | 8-year-olds need words to stay challenged. All competitors offer this. | Medium | Word lists by difficulty, partial-word highlighting as typed |
| Visual keyboard guide | Kids need to know WHERE the key is. Color-coded hand zones (left/right) shown on-screen keyboard diagram. Not a virtual keyboard to tap -- a reference guide. Every educational typing tool has this. | Medium | SVG overlay, highlight active key, color by finger |
| Immediate audio/visual feedback on keypress | ZType's best feature: every correct keystroke = satisfying audio cue + visual effect. Every wrong keystroke = distinct (but not harsh) feedback. Kids need instant reinforcement. | Medium | Sound sprites, particle effects on hit/miss |
| Difficulty progression (speed ramps up) | All competitors do this. Waves get faster, words get longer. Without it, the game is either too easy or too hard within 60 seconds. | Medium | Timer-based speed increase, wave system |
| Score/points display | Universal in games. Kids need a number going up. | Low | HUD element |
| Session feedback (end-of-game summary) | Accuracy %, keys practiced, time played. TypingClub and Typing.com both show this. Parents want to see progress too. | Low | Stats calculation, summary screen |
| Child-safe environment | No chat, no external links, no personal data collection, no ads. TypingClub, Nitro Type, and Dance Mat all emphasize this. Parents will not use an unsafe tool. | Low | Architecture decision, not a feature to build |
| Responsive to desktop/laptop screens | Kids use family laptops. Must work on common screen sizes. | Medium | CSS responsive layout, canvas scaling |
| Pause/resume | Kids get interrupted. Every game has pause. | Low | Game state management |

## Differentiators

Features that set Keyboard Invader apart. Not universally expected, but create the product's unique value.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Adaptive difficulty (real-time)** | THE key differentiator. No invaders-style game does this well for kids. Adjust speed, word length, and letter complexity based on real-time accuracy/speed. If kid is struggling, slow down. If crushing it, speed up. Eliminates frustration (the #1 reason kids quit). | High | Needs performance tracking algorithm, smooth difficulty curves, multiple knobs to tune (speed, complexity, spawn rate) |
| **Dual age-mode in one app** | 5-year-old and 8-year-old in same household use the same app with different experiences. Competitors either target young OR old kids, not both gracefully. | Medium | Profile-based mode selection, different content pools per mode |
| **Avatar-based profile selection (no passwords)** | Click your character to start playing. Zero friction. Most competitors require login/account or have no profiles at all. | Medium | LocalStorage profiles, avatar picker UI |
| **Unlockable characters/avatars** | XP-gated cosmetic rewards. Research shows unlockable content is a top motivator for kids. Nitro Type does cars; we do characters. | Medium | Asset creation, unlock thresholds, XP economy design |
| **XP and leveling system** | Visible progression beyond single sessions. Kids return to "level up." TypingClub has stars/badges; we have XP/levels which feel more game-like. | Medium | XP formula, level thresholds, persistent storage |
| **Multilingual word banks (FR/EN)** | French and English from day one. Most competitors are English-only. Bilingual households (the target family) need this. | Medium | i18n architecture, curated word lists per language per difficulty |
| **Cartoon/SVG character art style** | Rounded, expressive, colorful characters that appeal to 5-8 year olds. ZType is too "cool/dark" for young kids. Dance Mat's style is closer to what works. | Medium | Art direction, SVG assets, character animations |
| **Celebration moments** | Dance Mat Typing nails this: songs/dances after completing a stage. Over-the-top positive reinforcement for young kids. Not just a score -- a celebration. | Medium | Animation sequences, sound design, trigger on milestones |

## Anti-Features

Features to explicitly NOT build. Each temptation has a reason to resist.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Multiplayer / competitive racing** | Target age is 5-8. Competition creates anxiety and frustration in young children. Nitro Type works for grade 3+ because those kids can handle losing. A 5-year-old cannot. | Solo play only. "Beat your own score" framing. |
| **Leaderboards** | Same problem as multiplayer. A child who is always last will stop playing. Public ranking is harmful for developing self-esteem at this age. | Personal best tracking only. "You beat your record!" |
| **Timed pressure with fail states** | If the game ends abruptly because words reached the bottom, a 5-year-old cries. ZType's "game over" loop works for teens, not kindergarteners. | Adaptive difficulty should prevent overwhelming. If a word reaches the bottom, it disappears with a gentle "missed" animation -- not game over. Consider an "endless" mode where the game never truly ends, just gets easier if you are struggling. |
| **Virtual on-screen keyboard for tapping** | The project goal is learning the PHYSICAL keyboard. A tap-to-type keyboard undermines the entire purpose. | Visual keyboard reference (see where keys are) but input must come from physical keyboard only. |
| **Complex account system (email/password)** | Kids cannot type emails or remember passwords. Parents do not want to create accounts for a typing game. | Avatar-click profiles stored locally. Optional Firebase sync can use a simple parent-entered code. |
| **Ads or in-app purchases** | Destroys trust with parents. Distracts children. The project is free/self-hosted. | Free and open. No monetization needed (personal project). |
| **Punitive error feedback** | Harsh buzzer sounds, red flashing screens, or "WRONG!" text. Research shows punitive feedback causes kids to avoid difficult keys rather than practice them. | Gentle miss indicators. Encouraging tone. "Almost!" not "Wrong!" |
| **Long mandatory sessions** | Kids ages 5-8 have 10-15 minute attention spans for structured activity. Forcing 30-minute sessions causes burnout. | Short rounds (2-5 minutes). Easy to restart. Progress saves automatically. |
| **Typing proper sentences with punctuation** | 5-year-olds do not know punctuation. Even 8-year-olds struggle with shift+key combos. Adds friction without educational value at this age. | Letters and simple words only. No capitals required. No punctuation. |
| **WPM (words per minute) as primary metric** | WPM is meaningless and discouraging for beginners. A 5-year-old typing 3 WPM does not need to know that. | Track accuracy and "letters zapped" instead. Speed improvements shown as relative ("Faster than last time!") not absolute. |

## Feature Dependencies

```
Visual keyboard guide --> Core gameplay (needs to highlight active target key)
Single-letter mode --> Core gameplay (subset of content)
Word mode --> Core gameplay (extends content)
Adaptive difficulty --> Core gameplay + Score tracking (needs performance data)
XP system --> Score tracking (XP derived from gameplay stats)
Leveling system --> XP system (levels = XP thresholds)
Unlockable characters --> Leveling system (unlock at level milestones)
Avatar-based profiles --> LocalStorage persistence (must save/load profiles)
Multilingual word banks --> Word mode (different content pools)
Celebration moments --> Leveling system (triggered by level-ups and milestones)
Session feedback --> Score tracking (accuracy, speed, keys hit)
Cloud sync (Firebase) --> Avatar-based profiles + LocalStorage (sync what exists locally)
```

**Critical path:** Core gameplay --> Score tracking --> Adaptive difficulty --> XP/Levels --> Unlockable content

## MVP Recommendation

**Prioritize (Phase 1 -- Playable game):**
1. Core falling-letters/words gameplay loop with canvas rendering
2. Single-letter mode (start with the 5-year-old -- simpler to build, validates the core mechanic)
3. Immediate audio/visual feedback on every keypress
4. Basic score display and session summary
5. Pause/resume

**Prioritize (Phase 2 -- Engaging game):**
1. Word mode for older kids
2. Visual keyboard guide
3. Adaptive difficulty system
4. Basic XP and leveling

**Prioritize (Phase 3 -- Sticky game):**
1. Avatar-based profiles (multiple kids)
2. Unlockable characters
3. Celebration moments
4. Multilingual word banks (FR/EN)

**Defer to Phase 4+:**
- Cloud sync (Firebase) -- nice-to-have, not needed for single-device use
- Advanced stats/analytics for parents

**Rationale:** Get the core game loop feeling good before layering progression systems. A fun 2-minute typing session with satisfying feedback is more valuable than a complex XP system with boring gameplay. The adaptive difficulty is Phase 2 because it requires gameplay data to tune properly -- you need to play the basic game first to understand what "too hard" and "too easy" feel like for a 5-year-old.

## Sources

- [TypingClub](https://www.typingclub.com/) -- structured curriculum, Jungle Junior for young kids
- [Nitro Type](https://www.nitrotype.com/) -- competitive racing engagement model
- [ZType](https://zty.pe/) -- space shooter typing mechanic (closest to our concept)
- [Dance Mat Typing](https://www.dancemattypingguide.com/) -- BBC character-driven approach
- [Typing.com](https://www.typing.com/) -- K-12 curriculum and teacher tools
- [KidzType](https://www.kidztype.com/) -- variety of mini-games
- [AirDroid - Top 15 Free Typing Games for Kids](https://www.airdroid.com/parent-control/typing-games-for-kids/) -- comparative overview
- [Today's Parent - Free Typing Games](https://www.todaysparent.com/kids/free-typing-games-for-kids/) -- parent perspective on engagement
- [TypingFlo - Typing Practice Age Guide](https://www.typingflo.com/blog/typing-practice-for-kids) -- age-appropriate expectations
- [Common Sense Media - TypingClub Review](https://www.commonsensemedia.org/website-reviews/typingclub) -- safety and educational quality
- [Gamification for Teachers - XP Systems](https://gamificationforteachers.com/classroom-xp-systems/) -- XP/reward effectiveness research
