# Roadmap: 10K — Ten Thousand Dice Game

## Overview

This roadmap delivers a solo practice mode of Ten Thousand with 3D physics dice on a game table aesthetic. The build order follows the dependency chain: scoring engine first (pure logic, fully testable without UI), then the 3D dice and table (the core differentiator, validated early for mobile performance risk), then wiring everything together into a playable game with HUD, audio, and game flow. Three phases, each delivering a complete, verifiable capability.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Scoring Engine** - Pure TypeScript implementation of all Ten Thousand scoring rules and turn mechanics, fully unit-tested
- [ ] **Phase 2: 3D Dice and Game Table** - Physics-based 3D dice rolling on a felt/wood game table with face detection, optimized for mobile
- [ ] **Phase 3: Playable Game** - Wire engine to dice via stores, add HUD overlay, audio, game flow, and mobile-responsive polish

## Phase Details

### Phase 1: Scoring Engine
**Goal**: All Ten Thousand scoring rules and turn mechanics are correctly implemented as pure TypeScript functions with comprehensive test coverage
**Depends on**: Nothing (first phase)
**Requirements**: SCORE-01, SCORE-02, SCORE-03, SCORE-04, SCORE-05, SCORE-06, SCORE-07, TURN-01, TURN-02, TURN-03, TURN-04, TURN-05, TURN-06, TURN-07
**Success Criteria** (what must be TRUE):
  1. Given any combination of 6 dice values, the engine returns the correct score per BCSTH rules (singles, triples, 4+of-a-kind, straights, three pairs)
  2. The engine correctly identifies which dice in a roll are scoring dice and which are not
  3. Hot dice are detected when all 6 dice are set aside as scoring
  4. Farkle is detected when no scoring dice exist in a roll
  5. Turn state machine correctly enforces the flow: roll, select scoring dice, bank-or-roll-again, with 800-point entry threshold
**Plans:** 3 plans

Plans:
- [ ] 01-01-PLAN.md — Initialize project (TypeScript + Vitest) and define shared types and constants
- [ ] 01-02-PLAN.md — TDD scoring engine (singles, triples, N-of-a-kind, straight, three pairs, findScoringDice)
- [ ] 01-03-PLAN.md — TDD turn state machine (roll, select, bank, farkle, hot dice, threshold)

### Phase 2: 3D Dice and Game Table
**Goal**: Six 3D dice roll with satisfying physics on a game table with felt and wood textures, and dice face values are correctly read after settling
**Depends on**: Phase 1
**Requirements**: DICE-01, DICE-02, DICE-03, DICE-04, DICE-05, DICE-06
**Success Criteria** (what must be TRUE):
  1. Six 3D dice roll with physics-based animation on a felt surface and come to rest naturally
  2. After dice settle, the face-up value of each die is correctly determined via quaternion dot-product
  3. The game table has a felt surface with wood textures that conveys a physical game table aesthetic
  4. Dice roll animation runs smoothly on mobile devices without frame drops or jank
  5. Player can tap/click individual dice to select them, with clear visual feedback distinguishing selected from unselected
**Plans**: TBD

Plans:
- [ ] 02-01: TBD
- [ ] 02-02: TBD

### Phase 3: Playable Game
**Goal**: A complete, playable solo practice game of Ten Thousand running in the browser with HUD, audio feedback, and mobile-responsive layout
**Depends on**: Phase 2
**Requirements**: GAME-01, GAME-02, GAME-03, GAME-04, GAME-05, GAME-06, UI-01, UI-02, UI-03, UI-04, UI-05, UI-06, UI-07, AUDIO-01, AUDIO-02, AUDIO-03
**Success Criteria** (what must be TRUE):
  1. Player can start a solo practice game, roll dice, select scoring dice, and choose to bank or roll again with correct rule enforcement
  2. Current turn score and total banked score are clearly visible, and an animated score tally plays when points are banked
  3. Farkle and hot dice events produce clear visual and audio feedback with a pause for comprehension
  4. Dice produce realistic clatter sounds when rolling, with distinct audio for farkle, banking, and hot dice events
  5. The game is fully playable on mobile in portrait orientation with touch-friendly controls and a scoring reference accessible without leaving the play area
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Scoring Engine | 0/3 | Planning complete | - |
| 2. 3D Dice and Game Table | 0/? | Not started | - |
| 3. Playable Game | 0/? | Not started | - |
