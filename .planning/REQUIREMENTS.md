# Requirements: 10K — Ten Thousand Dice Game

**Defined:** 2026-03-19
**Core Value:** The dice rolling experience must feel satisfying and the game rules must be correctly implemented

## v1 Requirements

Requirements for initial release. Validates the core differentiator: 3D dice on a felt table with correct scoring. Single player practice mode only.

### Scoring Engine

- [x] **SCORE-01**: Game correctly scores single 1s (100 points) and single 5s (50 points)
- [x] **SCORE-02**: Game correctly scores three-of-a-kind (1s=1000, others=face value x100)
- [x] **SCORE-03**: Game correctly applies doubling for 4+of-a-kind (4x=double triple, 5x=double quad, 6x=double quint)
- [x] **SCORE-04**: Game correctly scores a straight (1-2-3-4-5-6) as 1000 points when rolled on all 6 dice
- [x] **SCORE-05**: Game correctly scores three pairs as 1000 points when rolled on all 6 dice
- [x] **SCORE-06**: Scoring combinations only count within a single throw (not accumulated across throws)
- [x] **SCORE-07**: Game identifies all valid scoring dice in a roll and prevents selecting non-scoring dice

### Turn Mechanics

- [ ] **TURN-01**: Player can roll all 6 dice at the start of a turn
- [ ] **TURN-02**: Player must set aside at least one scoring die after each roll
- [ ] **TURN-03**: Player can choose to bank accumulated turn points and end their turn
- [ ] **TURN-04**: Farkle: if no scoring dice are rolled, player loses all accumulated turn points
- [ ] **TURN-05**: Hot dice: if all 6 dice are set aside as scoring, player must roll all 6 again (adding to accumulated points)
- [ ] **TURN-06**: Player must earn 800 points (default threshold) in a single turn to "get on the board"
- [ ] **TURN-07**: After getting on the board, player can bank any amount on subsequent turns

### Game Flow

- [ ] **GAME-01**: Player can start a new solo practice game
- [ ] **GAME-02**: Game tracks total banked score across turns
- [ ] **GAME-03**: Game ends when player reaches or exceeds 10,000 points (default target)
- [ ] **GAME-04**: Player can start a new game after completion
- [ ] **GAME-05**: Entry threshold is configurable by host before game start (default 800)
- [ ] **GAME-06**: Target score is configurable by host before game start (default 10,000)

### 3D Dice & Table

- [ ] **DICE-01**: Six 3D dice render with physics-based rolling animation on a felt surface
- [ ] **DICE-02**: Dice landing faces are correctly read from physics state after roll settles
- [ ] **DICE-03**: Game table has felt surface with wood textures (game table aesthetic)
- [ ] **DICE-04**: Player can tap/click individual dice to select them as scoring dice (clear visual feedback)
- [ ] **DICE-05**: Dice roll includes suspense elements (camera work, anticipation on final bounces)
- [ ] **DICE-06**: 3D dice and physics run smoothly on mobile devices

### Audio

- [ ] **AUDIO-01**: Dice produce realistic clatter sound when rolling on the felt surface
- [ ] **AUDIO-02**: Distinct sound feedback for farkle (loss), banking (success), and hot dice (excitement)
- [ ] **AUDIO-03**: Player can mute/unmute all game audio

### UI

- [ ] **UI-01**: Roll and Bank buttons are prominently displayed with proper enable/disable states
- [ ] **UI-02**: Current turn score and total banked score are clearly visible
- [ ] **UI-03**: Scoring reference / cheat sheet is accessible in-game without leaving play area
- [ ] **UI-04**: Layout is mobile-responsive with touch-friendly targets (portrait orientation primary)
- [ ] **UI-05**: Clear visual feedback on farkle (what was rolled, pause for comprehension)
- [ ] **UI-06**: Animated score tallying when points are banked (counting up with visual flair)
- [ ] **UI-07**: Turn indicator shows current game state (rolling, selecting, banking)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### AI Opponents

- **AI-01**: Solo mode with AI opponents competing against the player
- **AI-02**: Multiple AI personalities with named characters and distinct risk strategies (cautious, aggressive, balanced)
- **AI-03**: AI respects all configured game rules (threshold, target score)

### Multiplayer

- **MP-01**: Hotseat multiplayer — pass-and-play on a single device with turn prompts
- **MP-02**: WebRTC peer-to-peer remote multiplayer (host-authoritative)
- **MP-03**: QR code generation for remote players to scan and join
- **MP-04**: Any number of players supported in all multiplayer modes
- **MP-05**: Final round logic — when a player reaches target, everyone else gets one more turn

### Polish

- **POLISH-01**: Stats tracking in local storage (high scores, best single round, most continuous scoring rounds, win/loss records)
- **POLISH-02**: Speed settings for experienced players to speed up dice animations
- **POLISH-03**: Additional dice roll suspense / camera choreography

## Out of Scope

| Feature | Reason |
|---------|--------|
| User accounts / login | No backend — everything client-side with local storage |
| Real-time chat | Moderation burden, UI clutter on mobile, fast-paced game makes chat ignored |
| Global leaderboards | Requires backend, luck-based game makes leaderboards reflect volume not skill |
| Tournament / ladder system | Massive scope, casual game not an esport |
| Dice customization / skins | Scope creep, risks free-to-play aesthetic |
| Ads / monetization | Degrades UX, passion project |
| Multiple game modes (Yahtzee, etc.) | Multiplies scope, dilutes focus — nail Ten Thousand first |
| Undo / take-back | Undermines push-your-luck tension, creates multiplayer disputes |
| Native mobile app | Web only, but mobile-friendly |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SCORE-01 | Phase 1 | Complete |
| SCORE-02 | Phase 1 | Complete |
| SCORE-03 | Phase 1 | Complete |
| SCORE-04 | Phase 1 | Complete |
| SCORE-05 | Phase 1 | Complete |
| SCORE-06 | Phase 1 | Complete |
| SCORE-07 | Phase 1 | Complete |
| TURN-01 | Phase 1 | Pending |
| TURN-02 | Phase 1 | Pending |
| TURN-03 | Phase 1 | Pending |
| TURN-04 | Phase 1 | Pending |
| TURN-05 | Phase 1 | Pending |
| TURN-06 | Phase 1 | Pending |
| TURN-07 | Phase 1 | Pending |
| GAME-01 | Phase 3 | Pending |
| GAME-02 | Phase 3 | Pending |
| GAME-03 | Phase 3 | Pending |
| GAME-04 | Phase 3 | Pending |
| GAME-05 | Phase 3 | Pending |
| GAME-06 | Phase 3 | Pending |
| DICE-01 | Phase 2 | Pending |
| DICE-02 | Phase 2 | Pending |
| DICE-03 | Phase 2 | Pending |
| DICE-04 | Phase 2 | Pending |
| DICE-05 | Phase 2 | Pending |
| DICE-06 | Phase 2 | Pending |
| AUDIO-01 | Phase 3 | Pending |
| AUDIO-02 | Phase 3 | Pending |
| AUDIO-03 | Phase 3 | Pending |
| UI-01 | Phase 3 | Pending |
| UI-02 | Phase 3 | Pending |
| UI-03 | Phase 3 | Pending |
| UI-04 | Phase 3 | Pending |
| UI-05 | Phase 3 | Pending |
| UI-06 | Phase 3 | Pending |
| UI-07 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 36 total
- Mapped to phases: 36
- Unmapped: 0

---
*Requirements defined: 2026-03-19*
*Last updated: 2026-03-19 after roadmap creation*
