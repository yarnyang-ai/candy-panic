# Candy Rush Implementation Plan

> Execute inline using superpowers:executing-plans. The user's request authorizes building the complete game; routine design choices are made autonomously.

**Goal:** Deliver a complete 30-second pixel candy game ready for GitHub Pages.
**Architecture:** Dependency-free canvas renderer and DOM UI consume a deterministic game simulation module.
**Tech Stack:** HTML, CSS, JavaScript ES modules, node:test.
**Spec:** docs/superpowers/specs/2026-10-31-candy-rush-design.md

## Global constraints
- Characters 16×16, candy 1×1 logical pixels, play time 30 seconds.
- Blue +1, orange +5, red +10, gray −1, explained before play.
- Start → 3-second countdown → play → shareable result.
- Relative asset URLs, no build or runtime dependencies, GitHub Pages compatible.

## Review focus
- Countdown must not consume play time; exact end cannot grant extra points.
- A candy can only be collected once, gray may yield a negative total.
- Reset must clear particles, count and held input; focus loss must pause.
- Narrow screens must expose usable movement and jump buttons.
- Storage/clipboard/native sharing may be unavailable; game remains playable.

## Task 1: Simulation
- [x] Create tests/core.test.js; test Game.start(), Game.update(dt,input), Game.jump(), Game.collect(candy), reset(), all four colors, timer boundaries, repeated collection, jump limits, landing and bounds.
- [x] Run `node --test`, observe missing core failure, implement src/core.js, rerun to green.

## Task 2: Playable presentation
- [x] Create index.html, styles.css, src/art.js, src/main.js: original forest and 16×16 sprites, start overlay, HUD, controls, results and share fallbacks.
- [x] Serve locally, inspect and play through a round; check pause, replay and narrow viewport.

## Task 3: Delivery
- [x] Add README.md for Pages deployment, .github/workflows/pages.yml and .nojekyll.
- [x] Run full tests, JavaScript syntax checks and HTTP checks; review against requirements and record outcomes.

## Verification record
- `npm test`: 9 passed, 0 failed. Includes countdown overshoot, exact deadline, all color scores, double pickup prevention, negative scores, jumping, bounds, landing, actual pickup and clean restart.
- `node --check src/core.js`, `src/art.js`, `src/main.js`: all exit 0.
- Local HTTP checks: root, stylesheet, favicon and all three JavaScript modules return 200.
- Browser: full start/countdown/play/result cycle; result224 =42 +29×5 +5×10 −13, prior303 =74 +28×5 +10×10 −11. Personal best persists across reload. Copy result succeeds. Pause timer21.6 stays frozen, resume continues from it.
- Desktop and 390px/320px mobile widths inspected. Fixed stage width expansion from CSS aspect-ratio + min-height. Result panel can scroll if clipboard fallback expands its content.
- Fresh independent reviewer: approved; no remaining concrete defects.
- GitHub deployment is prepared, not executed: no remote repository was specified and the task requests upload-ready files.
