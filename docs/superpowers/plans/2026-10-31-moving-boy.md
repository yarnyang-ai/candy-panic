# Moving candy boy implementation plan

**Goal:** Implement the user's selected proximity-farming remedy: the boy periodically moves to a different platform.
**Architecture:** Derive the boy's stop, jump progress and warning from active game elapsed time. Reuse existing terrain and candy physics. Canvas draws a compact landing marker.
**Tech stack:** Existing dependency-free JavaScript/Canvas and node:test.

## Design
- Five seconds between departures,0.7-second jump,0.8-second destination warning.
- Route by platform index:1(center),2(right lower),4(right upper),1(center),0(left lower),3(left upper); repeat.
- Boy continues scattering candy while moving; existing collection/scoring stays unchanged.
- Stops stay within each platform. Movement is paused and reset by the existing game lifecycle.
- No additional instructions or flavor text on the page; destination is shown with a pixel marker.

## Steps
- [x] Add failing tests for warning/start/landing, later stops, emitter position, large time steps and restart.
- [x] Implement elapsed-time movement in src/core.js; confirm complete suite passes.
- [x] Add destination marker and airborne pose in src/art.js.
- [x] Inspect movement/warning in browser; independent review; final suite and syntax checks.

## Validation
21/21 tests pass. Core, art and main pass syntax checks. Browser confirmed movement to the right upper platform; warning and airborne frames visually inspected. No browser errors. Independent review approved the change and a full-round position sweep. Preview refreshed.
