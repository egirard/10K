# 10K — Ten Thousand Dice Game

## What This Is

A web-based implementation of the classic dice game Ten Thousand (also known as 10,000 or Farkle variant). Players roll six dice, set aside scoring combinations, and push their luck to accumulate points — first to 10,000 wins. The game runs entirely in the browser with 3D animated dice on a game-table aesthetic, supporting solo play against AI personalities, local hotseat multiplayer, and remote multiplayer via WebRTC peer-to-peer connections initiated by QR code.

## Core Value

The dice rolling experience must feel satisfying and the game rules must be correctly implemented — if the 3D dice feel great and the scoring logic is right, everything else follows.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Correct implementation of Ten Thousand rules (scoring, hot dice, farkle, 800-point threshold, final round)
- [ ] 3D animated dice rolling with physics (Three.js)
- [ ] Game table visual style (felt/wood textures, physical dice look)
- [ ] Mobile-friendly responsive design
- [ ] Any number of players (1+)
- [ ] Solo mode with AI opponents that have distinct personalities (cautious, aggressive, balanced, etc.)
- [ ] Hotseat multiplayer on a single device
- [ ] Remote multiplayer via WebRTC (host's browser runs game logic)
- [ ] QR code generation for remote players to join
- [ ] Configurable game settings (entry threshold, target score)
- [ ] Stats tracking in local storage (high scores, best single round, most continuous scoring rounds, win/loss records)

### Out of Scope

- Backend server / user accounts — all client-side with local storage
- Native mobile app — web only, but mobile-friendly
- Real-time chat between remote players — keep it focused on the game
- Tournament/ladder system — casual play only

## Context

- The game follows the rules from the BCSTH PDF variant of Ten Thousand:
  - 6 dice, standard scoring (1=100, 5=50, triples, straights, three pairs)
  - For each die over three-of-a-kind, the score doubles (e.g., 3x2=200, 4x2=400, 5x2=800, 6x2=1600)
  - Three 1s = 1000 points
  - Straight (1-2-3-4-5-6) = 1000 points
  - Three pairs = 1000 points
  - Hot dice: if all 6 dice score, player must roll all 6 again
  - Farkle: no scoring dice = lose all accumulated points for that turn
  - 800-point threshold to "get on the board" (configurable)
  - Final round: when someone hits 10,000, everyone else gets one more turn
- Scoring combinations only count within a single throw (not accumulated across throws)
- WebRTC connections are peer-to-peer with the game creator acting as host/authority
- AI players have named personalities with distinct risk strategies, not difficulty levels

## Constraints

- **Tech stack**: React + Three.js (React Three Fiber) for UI and 3D dice
- **No backend**: Everything runs client-side; WebRTC for multiplayer, local storage for persistence
- **Browser support**: Modern evergreen browsers (Chrome, Firefox, Safari, Edge)
- **Performance**: Must run smoothly on mobile devices (dice physics can't be too heavy)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Host-authoritative WebRTC | Simpler than consensus-based P2P; host already has game context | — Pending |
| React + Three.js (R3F) | Rich ecosystem, good for mixing UI with 3D; user preference | — Pending |
| AI personalities over difficulty levels | More character and replayability; feels like playing against "someone" | — Pending |
| Local storage only | No backend complexity; game is casual/social, not competitive ranked | — Pending |
| Game table aesthetic | Felt/wood textures give tactile feel that matches the dice game theme | — Pending |

---
*Last updated: 2026-03-19 after initialization*
