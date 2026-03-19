# Phase 2: 3D Dice and Game Table - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Six 3D dice with physics-based rolling on a felt/wood game table. Dice face values correctly read after settling. Player can tap to select scoring dice. Optimized for mobile. This phase delivers the visual and interactive foundation — no game logic wiring (that's Phase 3).

</domain>

<decisions>
## Implementation Decisions

### Dice Appearance
- Classic white dice with black pips, red center pip on the 1-face
- Slightly rounded edges, realistic proportions
- Reference: concept images in `playthrough.md` and `Gemini_Generated_Image_*.png` files at repo root

### Table Design
- Green felt surface with raised dark wood rim/border
- Slightly angled top-down camera perspective (as shown in concept images)
- Portrait mobile layout: "10K" title top center, score badge top-right, back arrow top-left
- Bank/Roll Again buttons at bottom of screen

### Roll Feel
- Realistic and weighty: visible arc, 3-4 bounces on felt, ~2 seconds to settle
- Physics should feel physical — dice have weight and felt has friction
- No camera movement during rolls — fixed angle throughout

### Lighting
- Static warm overhead lighting, consistent throughout gameplay
- No mood shifts or dynamic lighting changes

### Selection UX — Tap to Group
- Tap a scoring die to select it — it smooth-slides (~0.3s ease) to the left cluster on the felt
- Slide path should avoid other dice on the table if possible (move through only if no other path)
- Tap a selected die to deselect it — it slides back to unselected area (toggle behavior)
- Unselected dice are visually dimmed/greyed out to distinguish from selected dice
- Non-scoring dice respond to tap with a quick shake/reject animation (can't be selected)
- Bank button shows potential points: "Bank (450)"
- Roll Again button shows remaining dice count: "Roll Again (1)"

### Claude's Discretion
- Tap target sizing (generous hit area vs die-only — pick what works best with physics)
- Exact physics parameters (gravity, friction, restitution coefficients)
- Dice face detection method (quaternion dot-product recommended by research)
- Felt and wood texture implementation details
- Exact dice 3D model approach (geometry + materials vs imported model)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Visual Reference
- `playthrough.md` — Playthrough concept document describing the visual flow of a game turn
- `Gemini_Generated_Image_7dg2m87dg2m87dg2.png` — Initial roll concept (dice layout, table, UI)
- `Gemini_Generated_Image_7dg2m87dg2m87dg2 (1).png` — Decision phase concept (same layout, dice selection)
- `Gemini_Generated_Image_7dg2m87dg2m87dg2 (2).png` — Risk phase concept (selected dice grouped left, lone die right)
- `Gemini_Generated_Image_7dg2m87dg2m87dg2 (3).png` — Bank outcome concept (banked dice clustered, score display)

### Technical Research
- `.planning/research/STACK.md` — R3F v9 + react-three-rapier v2 + Zustand v5 stack
- `.planning/research/ARCHITECTURE.md` — Component boundaries, dual-state pattern, dice face detection
- `.planning/research/PITFALLS.md` — Performance pitfalls, quaternion face detection, mobile optimization

### Existing Code
- `src/engine/types.ts` — DieValue type (1-6), Roll type used by scoring engine
- `src/engine/scoring.ts` — findScoringDice() returns indices of scoring dice (needed for non-scoring die shake)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/engine/types.ts`: `DieValue` type (1|2|3|4|5|6), `Roll` type — dice rendering must produce values compatible with these types
- `src/engine/scoring.ts`: `findScoringDice(roll)` — returns indices of dice that can score, needed to determine which dice are tappable vs shake-reject
- `src/engine/constants.ts`: `DICE_COUNT = 6` — number of dice to render

### Established Patterns
- Pure TypeScript with strict mode — 3D code should follow same strict typing
- Vitest for testing — any testable logic (face detection) should have tests

### Integration Points
- Phase 3 will wire the 3D scene to the scoring engine via Zustand stores
- This phase should expose: a way to trigger a roll, read settled face values, and handle die selection
- The 3D scene component should accept props/callbacks for game state integration in Phase 3

</code_context>

<specifics>
## Specific Ideas

- Concept images are the primary visual reference — match the green felt, wood rim, dice style, and button layout as closely as possible
- The playthrough document describes the flow: roll → select scoring dice (grouped left) → roll remaining → bank or continue
- Image 4 (bank outcome) shows selected dice clustered together with the lone unselected die isolated on the right — this spatial separation is the core selection UX

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-3d-dice-and-game-table*
*Context gathered: 2026-03-19*
