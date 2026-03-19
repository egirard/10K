# Feature Research

**Domain:** Browser-based dice game (Ten Thousand / Farkle variant)
**Researched:** 2026-03-19
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Correct scoring logic | Wrong scoring = broken game. Players know the rules and will notice immediately. | MEDIUM | Must handle all combos: singles (1s, 5s), triples, quadruples+, straights, three pairs, hot dice. The BCSTH variant has specific doubling rules for 4+of-a-kind. |
| Dice selection (hold/score) | Core interaction loop. Every Farkle game lets you tap/click dice to set them aside. | LOW | Click-to-select with clear visual state (selected vs unselected). Must prevent selecting non-scoring dice. |
| Score display per player | Players need to see standings at a glance. Every competitor shows this. | LOW | Current turn score, banked score, all player totals visible simultaneously. |
| Roll / Bank buttons | The two primary actions. No game ships without these. | LOW | "Roll Dice" and "Bank Score" must be prominent. Disable when invalid (e.g., can't bank below threshold). |
| Farkle detection and feedback | Farkle (no scoring dice) is the core tension mechanic. Must be communicated clearly. | LOW | Visual + audio feedback. Show what was rolled, pause for comprehension, then clear. |
| Hot dice detection | All 6 dice scoring = mandatory re-roll. Players expect this rule. | LOW | Auto-detect when all dice are set aside. Clear indication that player must roll again. |
| Entry threshold enforcement | 800-point (or configurable) minimum to "get on the board." Standard rule. | LOW | Show progress toward threshold. Prevent banking below it. |
| Final round logic | When someone hits 10K, everyone else gets one more turn. Standard rule. | LOW | Clear announcement, visual indicator of "last chance" state. |
| Scoring reference / cheat sheet | New and casual players need to look up what scores what. Every competitor has this. | LOW | Accessible in-game without leaving the play area. Collapsible panel or modal. |
| Turn indicator | Must be obvious whose turn it is, especially in multiplayer. | LOW | Highlight active player. Animation or visual cue on turn change. |
| Mobile-responsive layout | Most casual game sessions happen on phones. Board Game Arena, cardgames.io, buddyboardgames all work on mobile. | MEDIUM | Touch targets for dice, buttons sized for thumbs. Portrait orientation primary. |
| New game / restart | Players will want to play again immediately. | LOW | Single action to start over with same players and settings. |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| 3D physics-based dice rolling | Every competitor uses flat 2D dice or simple animations. Realistic 3D dice with physics creates a visceral, satisfying roll that makes the game feel premium. This is the project's core value proposition. | HIGH | Three.js + Cannon-es/Rapier for physics. Must read landing face from physics state. Must perform well on mobile. |
| Game table aesthetic (felt/wood) | Evokes the tactile feel of playing at a real table. No browser Farkle game does this well. Competitors look like generic web apps. | MEDIUM | Felt texture, wood rim, warm lighting. The 3D dice land on the felt surface. Cohesive visual identity. |
| AI opponents with named personalities | Competitors have generic "Computer" opponents or basic difficulty levels. Named AI with distinct risk strategies (cautious Carol, reckless Rick, balanced Bob) makes solo play feel social and replayable. | MEDIUM | Each personality needs a risk threshold model, a name, and observable behavior patterns. Players should be able to predict and react to AI tendencies. |
| WebRTC peer-to-peer multiplayer | No server required. Play with friends by sharing a link or QR code. Most competitors require accounts or use centralized servers. Buddyboardgames does room-based but server-reliant. | HIGH | Host-authoritative model. Signaling server needed for connection setup only. PeerJS or similar library. Game state synced from host to peers. |
| QR code game joining | Scan-to-join is faster and more natural than sharing links, especially when people are in the same room. No dice game competitor does this. | LOW | Generate QR code encoding the join URL. Display prominently for host. Works naturally with WebRTC join flow. |
| Sound design (dice on felt, scoring, farkle) | Audio feedback makes dice rolling satisfying and scoring moments celebratory. Most browser Farkle games have no sound or bad sound. | MEDIUM | Dice clatter on felt, satisfying "bank" sound, farkle buzzer/groan, hot dice fanfare. Must have mute toggle. |
| Hotseat multiplayer | Pass-and-play on a single device. Great for family game night on a tablet. Some competitors support this but many are online-only. | LOW | Hide previous player's strategic info on turn change. Clear "pass the device" prompt. |
| Configurable rules | Entry threshold, target score, scoring variants. BuddyBoardGames does this well. Lets groups play "their" version. | LOW | Settings screen before game start. Presets for common variants. |
| Stats tracking (local storage) | High scores, best single round, win/loss records, streaks. Gives solo players goals beyond winning. | LOW | Persist to localStorage. Show stats screen accessible from menu. No account required. |
| Dice roll anticipation / suspense | Slow-motion final bounce, camera angle on the last die, brief pause before revealing a farkle. Builds tension that flat dice games cannot create. | MEDIUM | Leverages the 3D engine. Camera work and timing choreography. Must not slow down gameplay for experienced players (speed setting). |
| Animated score tallying | Points counting up with visual flair when banking. Makes scoring moments feel rewarding. | LOW | Number animation, maybe particles or glow effect. Quick but noticeable. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| User accounts / login | Persistent identity, cross-device stats | Requires backend infrastructure, auth system, GDPR compliance. Massively increases scope for a casual dice game. Project explicitly out of scope. | Local storage for stats. QR code / link sharing for multiplayer identity. |
| Real-time chat | Social interaction during remote games | Moderation burden, inappropriate content risk, UI clutter on mobile. Dice games are fast-paced enough that chat gets ignored. Project explicitly out of scope. | Preset emoji reactions or quick emotes (thumbs up, groan, celebration) if any social feedback is desired. |
| Global leaderboards | Competition beyond friend groups | Requires backend, invites cheating/manipulation, meaningless without matchmaking. Dice games are heavily luck-based so leaderboards reflect volume not skill. | Local stats + personal bests. Bragging rights within friend group via shared screen. |
| Tournament / ladder system | Organized competitive play | Massive feature scope, needs matchmaking, scheduling, backend. Farkle is a casual social game, not an esport. Project explicitly out of scope. | Just play another game. The fun is in the session, not the ranking. |
| Dice customization / skins | Personalization, monetization | Scope creep, asset creation burden, distracts from core experience. Risks looking like a free-to-play mobile game. | One set of beautiful, realistic dice that look great on the felt table. Maybe 2-3 color options at most. |
| Ads / monetization | Revenue | Degrades user experience, requires ad SDK integration, privacy implications. This is a passion project, not a business. | Ship it free. If it needs to make money later, consider optional tip jar or donation link. |
| Multiple dice game modes (Yahtzee, Zilch, etc.) | More content, broader appeal | Each game has different rules, UI, and scoring. Multiplies testing surface. Dilutes focus. Ship one game well. | Nail Ten Thousand first. Architecture can support variants later if desired, but do not plan for it. |
| Undo / take-back | Forgiveness for misclicks | Undermines the push-your-luck tension that is the entire point of the game. In multiplayer, creates disputes. | Clear confirmation before banking. Good dice selection UX to prevent misclicks. |
| AI difficulty levels | Accessibility | Difficulty levels feel artificial and patronizing. A "hard" AI that gets lucky rolls feels unfair; an "easy" AI that plays badly feels boring. | AI personalities with different risk strategies. A cautious AI is easier to beat not because it is dumber but because it banks early. Natural difficulty variance. |

## Feature Dependencies

```
[Scoring Logic Engine]
    └──requires──> [Dice Selection UI]
    └──requires──> [Farkle Detection]
    └──requires──> [Hot Dice Detection]
    └──requires──> [Entry Threshold Logic]
    └──requires──> [Final Round Logic]

[3D Dice Rendering]
    └──requires──> [Three.js + Physics Engine Setup]
    └──requires──> [Face Reading from Physics State]

[3D Dice on Felt Table]
    └──requires──> [3D Dice Rendering]
    └──requires──> [Game Table Aesthetic]

[Sound Design]
    └──enhances──> [3D Dice Rendering] (dice clatter)
    └──enhances──> [Farkle Detection] (farkle sound)
    └──enhances──> [Score Banking] (banking sound)

[AI Opponents]
    └──requires──> [Scoring Logic Engine]
    └──requires──> [Turn Management]

[Hotseat Multiplayer]
    └──requires──> [Turn Management]
    └──requires──> [Score Display]

[WebRTC Multiplayer]
    └──requires──> [Turn Management]
    └──requires──> [Game State Serialization]
    └──requires──> [Signaling Mechanism]

[QR Code Joining]
    └──requires──> [WebRTC Multiplayer]

[Configurable Rules]
    └──enhances──> [Scoring Logic Engine]
    └──must-precede──> [AI Opponents] (AI must respect configured rules)

[Stats Tracking]
    └──requires──> [Scoring Logic Engine]
    └──independent of──> [Multiplayer] (works in solo mode)
```

### Dependency Notes

- **Scoring Logic Engine** is the foundation: every game mode, AI, and multiplayer feature depends on correct scoring. Build and test this first.
- **3D Dice Rendering** is independent of game logic: can be developed in parallel. The integration point is "roll result" — physics determines what was rolled, game logic scores it.
- **WebRTC Multiplayer requires Game State Serialization**: the host must be able to serialize and transmit complete game state to peers. Design state shape early.
- **QR Code Joining is trivial once WebRTC works**: it is just a URL encoded as a QR code. Do not build it before WebRTC is functional.
- **Configurable Rules must exist before AI Opponents**: AI decision-making depends on knowing the rules (e.g., entry threshold affects when AI will bank).
- **Sound Design can be layered in at any point**: it enhances existing features without being a dependency for anything.

## MVP Definition

### Launch With (v1)

Minimum viable product — what is needed to validate that the 3D dice feel good and the game plays correctly.

- [ ] Scoring logic engine with all Ten Thousand rules (BCSTH variant) — the game must be correct
- [ ] 3D dice rolling with physics on a felt table surface — the core differentiator, must feel satisfying
- [ ] Dice selection UI (click/tap to set aside scoring dice) — core interaction
- [ ] Roll / Bank actions with proper state management — core game loop
- [ ] Farkle and hot dice detection with feedback — core tension mechanics
- [ ] Entry threshold and final round logic — complete rule set
- [ ] Score display for all players — game state visibility
- [ ] Single-player vs one AI opponent (simple strategy) — playable without friends
- [ ] Scoring reference accessible in-game — onboarding for new players
- [ ] Mobile-responsive layout — most players will be on phones
- [ ] Basic sound effects (dice roll, bank, farkle) — the dice must sound satisfying

### Add After Validation (v1.x)

Features to add once core game feel is validated.

- [ ] Multiple AI personalities (3-4 distinct strategies) — adds replayability to solo mode
- [ ] Hotseat multiplayer — enables same-device group play
- [ ] Configurable rules (threshold, target score) — lets groups play their variant
- [ ] Game table aesthetic polish (wood rim, lighting, textures) — visual refinement
- [ ] Stats tracking in local storage — gives solo players progression
- [ ] Animated score tallying and visual feedback polish — juice
- [ ] Speed setting for dice animations — let experienced players play faster

### Future Consideration (v2+)

Features to defer until the core game is solid.

- [ ] WebRTC peer-to-peer multiplayer — significant complexity, needs stable game state model first
- [ ] QR code game joining — depends on WebRTC being solid
- [ ] Dice roll anticipation / camera work — polish that requires the 3D engine to be mature
- [ ] Preset emoji reactions for remote multiplayer — only relevant once remote play exists
- [ ] Additional AI personalities — content expansion once the personality system is proven
- [ ] Dark mode / theme options — nice to have, low priority

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Scoring logic engine | HIGH | MEDIUM | P1 |
| 3D physics dice rolling | HIGH | HIGH | P1 |
| Game table aesthetic (basic) | HIGH | MEDIUM | P1 |
| Dice selection UI | HIGH | LOW | P1 |
| Roll / Bank controls | HIGH | LOW | P1 |
| Farkle + hot dice detection | HIGH | LOW | P1 |
| Entry threshold + final round | HIGH | LOW | P1 |
| Score display | HIGH | LOW | P1 |
| Basic AI opponent | HIGH | MEDIUM | P1 |
| Scoring reference | MEDIUM | LOW | P1 |
| Mobile-responsive layout | HIGH | MEDIUM | P1 |
| Basic sound effects | MEDIUM | LOW | P1 |
| AI personalities (multiple) | MEDIUM | MEDIUM | P2 |
| Hotseat multiplayer | MEDIUM | LOW | P2 |
| Configurable rules | MEDIUM | LOW | P2 |
| Stats tracking | MEDIUM | LOW | P2 |
| Score animations / juice | LOW | LOW | P2 |
| Speed setting | LOW | LOW | P2 |
| WebRTC multiplayer | HIGH | HIGH | P3 |
| QR code joining | MEDIUM | LOW | P3 |
| Dice roll suspense/camera | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | cardgames.io/farkle | BuddyBoardGames | Board Game Arena | PlayOnlineDiceGames | 10K (Our Approach) |
|---------|---------------------|------------------|------------------|--------------------|--------------------|
| Dice visuals | 2D flat dice, clean | 2D flat dice | 2D minimal | 2D basic | 3D physics dice on felt table |
| Game feel | Fast, functional | Fast, functional | Fast, functional | Basic, dated | Premium, tactile, satisfying |
| AI opponents | Yes, generic names | No (multiplayer focus) | No | Yes, basic "computer" | Named personalities with strategies |
| Multiplayer | Online (account-based) | Room-based (link sharing) | Online (account required) | Account-based | WebRTC P2P (no account, QR join) |
| Hotseat | No | Yes (same device) | No | No | Yes |
| Sound | Minimal/none | None | None | None | Dice clatter, scoring sounds, farkle feedback |
| Custom rules | Speed only | Yes (extensive) | Standard only | Standard only | Yes (threshold, target, scoring variants) |
| Stats | Basic wins | None | Platform-level | Account-based | Local storage, detailed personal stats |
| Mobile support | Yes | Yes | Yes | Poor | Yes (touch-optimized) |
| No account required | No (for multiplayer) | Yes | No | No | Yes |
| Visual theme | Generic card game site | Themed (seasonal) | Platform standard | Dated web design | Game table aesthetic (felt, wood, warm lighting) |

## Sources

- [cardgames.io Farkle](https://cardgames.io/farkle/) — most polished browser Farkle, 2D dice, online multiplayer with accounts
- [BuddyBoardGames Farkle](https://www.buddyboardgames.com/farkle) — room-based multiplayer, best custom rules implementation, no account needed
- [Board Game Arena Farkle](https://en.boardgamearena.com/gamepanel?game=farkle) — platform play, 1-12 players, real-time and turn-based
- [PlayOnlineDiceGames Farkle](https://www.playonlinedicegames.com/farkle) — basic implementation, account-based
- [Three.js Dice Rolling Simulator](https://discourse.threejs.org/t/dice-rolling-simulator/68529) — reference for 3D dice physics approach
- [Crafting a Dice Roller with Three.js and Cannon-es (Codrops)](https://tympanus.net/codrops/2023/01/25/crafting-a-dice-roller-with-three-js-and-cannon-es/) — tutorial for the exact tech stack
- [NetplayJS](https://github.com/rameshvarun/netplayjs) — WebRTC P2P multiplayer library reference
- [Farkle Rules (Dice Game Depot)](https://www.dicegamedepot.com/farkle-rules/) — comprehensive rule variants

---
*Feature research for: Browser-based dice game (Ten Thousand / Farkle variant)*
*Researched: 2026-03-19*
