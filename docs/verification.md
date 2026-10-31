# Verification — Candy Panic!!

2026-10-31

- Node test suite: **27 passed**, 0 failed.
- JavaScript syntax: all three modules pass `node --check`.
- Local HTTP: HTML, CSS, SVG favicon and modules all return200.
- Browser: countdown, actual round ending at30 seconds, result arithmetic, personal best reload persistence, movement, jumping, replay, pause/resume, result copying.
- Responsive visual checks: normal desktop,390px and320px widths. Final320px result check: page width305px (excluding scrollbar), stage height280px, result panel248.9px; all actions fit inside the stage, no horizontal overflow.
- Independent source review: approved.

Small-screen correction: an auto-sized block with `aspect-ratio` and `min-height` expanded horizontally. Giving the stage explicit `width:100%` constrains it to the frame. The active mobile arena keeps16:9 so both edges remain visible. Start/results retain sufficient height; the result panel scrolls for larger share fallbacks.

Publishing to GitHub Pages is not verified live because no destination repository was provided. `.github/workflows/pages.yml` includes the test and deployment steps. See README for both Actions and branch deployment.

## Requested update

- STONE is2×2 pixels with half-speed motion, now−10 points. Contact with ground or floating platforms expires it immediately and prevents collection after expiry.
- All other candy remains1×1 and retains its bounce behavior.
- Final5 seconds double each throw from6 to12; tests cover both the boundary and a large update crossing it.
- Removed decorative intro, taglines, captions, field notes and footer copy. Retained score rules, controls, time, results and share controls.
- Fresh source review approved the changes with no concrete defects.

## Candy Panic!! presentation update

Reference-inspired16×16 sprites, title, English UI/accessibility/share text, contained scoring and high score, and minimal outside text verified. No emission-amount text remains in the webpage or README. Mobile gameplay canvas298.67×168 CSS pixels at320 viewport width preserves16:9; touch dock62px stays inside the frame. Character enlargement preview saved in the ignored `.qa/` directory. Node suite14/14 passes; independent source review approved.

## Latest balance and copy update

- Blue1×1, Yellow2×2, Red/Stone3×3; Red and Stone both half-speed.
- Stone chance reduced from11% to5.5%, redistributing the difference to blue. Verified11 stones from200 uniform type draws through actual simulation.
- Increased both jump apex heights by1.5 using launch speed×sqrt(1.5); verified simulated rises55.8px and44.39px within0.4px.
- Emission multiplier starts at elapsed20 seconds; boundary and crossing-update tests pass. No corresponding quantity text is shown in the UI.
- COPY RESULT is the button beside PLAY AGAIN; duplicate lower copy link and native-share handler removed. X compose remains available.
- Node suite16/16 passes. Fresh source review approved with no concrete bugs.

## Default sound and Orange restoration

- Sound defaults to ON; initial HTML and runtime ARIA/label state agree. Audio is initialized after START or a sound-toggle interaction.
- Restored Orange naming and original orange color (#ffad50), retaining2×2 size and+5 points.
- Browser reload shows SOUND ON and Orange. OFF→ON toggles verified, no console warnings or errors. Node suite16/16 passes.
- The proximity-scoring concern was inspected: overlap pickup is active immediately at the candy spawn point. Balance alternatives were proposed for discussion; no proximity gameplay rule has been applied yet.

## User-selected relocation remedy

The user selected periodic movement to another platform. Implemented five-second departures with0.7-second hops and0.8-second destination warnings. Route visits center, right lower, right upper, center, left lower, left upper. Candy follows the boy's actual emitter position, including during hops. No arbitrary proximity pickup restriction was introduced.

21/21 tests pass, including destination warnings, interpolated hops, terrain-aligned landings, full route, relocated candy emission, large updates and replay reset. Browser confirmed live relocation; warning and flight frames visually inspected. All syntax checks pass, no browser warnings/errors, fresh independent review approved. Current preview refreshed.

## Contact game over

Body overlap with the boy ends the round immediately, before candy spawning or collection in that substep. Transparent sprite margins are inset by2px for a fair contact area. The result retains the collected score, labels the outcome GAME OVER and displays exactly `DON'T TOUCH ME, KITTY!!`. Normal timeout remains RESULT without that message. Both outcomes use the existing replay/copy controls.

The simulation stops subsequent substeps and deducts only time consumed before the collision. Tests cover same-frame score exclusion, frozen score/timer/positions, a near miss, airborne contact, countdown, replay reset and normal timeout reason. Node suite27/27 passes and independent review approved. Browser fixture in ignored `.qa/contact.html` supplies overlapping starting positions for the first round, then a short normal timeout for replay; production has no test hook.

Browser verified GAME OVER plus the exact message,390px responsive layout, replay, and subsequent normal RESULT with the message hidden. No console warnings/errors. Screenshot `.qa/kitty-gameover.png`; main preview refreshed.

## Custom player PNG

Copied the user's `kokorochara.png` without modifying its bytes to `assets/characters/player.png` (16×16 RGBA with transparency). SHA256 matches source:650CC212D6120F6456EB02958E5C3C433F9C40EE4B7DAA70F40F10712AC8D8CB. Canvas now uses this PNG with nearest-neighbor display, facing flips and existing leg animation; original code sprite remains as a loading fallback. GitHub Pages workflow copies character PNG assets. Player export and preview refreshed from the custom asset.

27/27 regression tests pass; art syntax check passes. Browser verified title/game rendering, movement and jump with the PNG, with no warnings/errors. Current preview refreshed; screenshot `.qa/custom-player.png`.

## Custom boy PNG

Copied the user's `boy.png` unchanged to `assets/characters/boy.png` (16×16 RGBA). Source/asset SHA256 matches:536C449A9A15D86900F3915CD930FA5AFF946F664886208C65E0FFB6F8B9B291. Shared PNG renderer now supports both characters and preserves facing, foot and throwing offsets. Existing Pages asset-copy rule includes both PNGs. Exported character PNGs and preview refreshed;27/27 tests and art syntax check pass.

## Random destinations and flashing red warning

Replaced the fixed route with a uniform random choice among the other four of the five floating platforms. Destinations are committed in advance and remain fixed through each jump. Movement randomness is separate from candy randomness. Existing five-second timing, jump duration and warning duration are retained.

The warning now frames the exact landing coordinates with a 24×24 red border, dark outline and downward arrow. It alternates bright/dim red twice per second and remains visible during flight. Browser fixture `.qa/random-jump.html` verified bright/dim warning states, flight and the matching landing; screenshot `.qa/random-jump.png`. No browser warnings/errors. Main preview refreshed. All29 tests and core/art syntax checks pass; independent read-only review approved without findings.

## Title sprite scaling and horizontal seams

Reproduced horizontal seams in animated PNG rows at1.6× scaling using `.qa/sprite-check.html`: whole-image idle drawing was clean, while per-row throwing drawing introduced horizontal gaps. At2× both paths were clean. Changed both title characters to integer2× scaling (previously boy1.6×, player1.7×), adjusting their vertical anchors to retain the intended foot positions. Custom PNG bytes and gameplay rendering are unchanged.

Verified actual title renderer in throwing and idle frames with `.qa/title-check.html`, then refreshed the main preview and saved `.qa/title-pixels-fixed.png`. No browser warnings/errors. All29 regression tests and the art syntax check pass.

## Drop through floating platforms

Down arrow or S drops the player through the platform they are standing on. The action moves their feet below that one-way surface and starts a small downward velocity; lower platforms and the floor still catch the player. Keyboard repeats are ignored, so each press drops through one platform. A matching ↓ touch button and English keyboard guide were added.

All31 tests pass, including dropping from an upper platform onto a lower platform and then the floor, plus rejection on the floor, in midair, during countdown and after finishing. Core/main syntax checks pass. Browser fixture `.qa/drop.html` uses the actual UI with a temporary upper-platform starting position: ArrowDown landed at y183, S reached the floor at y230, and the touch button dropped from y119 onto y183. The320px touch layout fits all four controls; screenshot `.qa/drop-controls.png`. No browser warnings/errors. Viewport reset, fixture tab closed and main preview refreshed.
