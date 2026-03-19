---
phase: 1
slug: scoring-engine
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.x |
| **Config file** | vitest.config.ts (Wave 0 creates) |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --coverage` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | SCORE-01..07 | unit | `npx vitest run src/engine/scoring.test.ts` | No (W0) | pending |
| 01-02-01 | 02 | 1 | TURN-01..07 | unit | `npx vitest run src/engine/turn.test.ts` | No (W0) | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `package.json` — initialize project with TypeScript and Vitest
- [ ] `tsconfig.json` — TypeScript configuration
- [ ] `vitest.config.ts` — Vitest configuration
- [ ] `src/engine/scoring.test.ts` — test stubs for SCORE-01..07
- [ ] `src/engine/turn.test.ts` — test stubs for TURN-01..07

*Wave 0 sets up the project and test infrastructure.*

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
