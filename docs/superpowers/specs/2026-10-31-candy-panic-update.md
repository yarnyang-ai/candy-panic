# Candy Panic!! update

User-requested revision of the existing game:

- Title and share text: Candy Panic!!.
- Reference-inspired 16×16 characters: orange-haired pirate boy with a candy chest; black-haired player in a white cat-ear hood with purple accents.
- Stone score: −10; existing size, slow motion and terrain disappearance are preserved.
- Score legend and local high score appear inside the start screen.
- Outside the game: only the upper-left title and `(C)YarnYang` below.
- All webpage labels, accessibility labels, status messages and share text use English.
- No on-page explanation or badge about candy emission amounts; existing simulation behavior is preserved.
- Mobile controls are inside the game frame. Their 62px dock is added below a 16:9 canvas to preserve square pixels.

Implementation: `index.html`, `styles.css`, `src/art.js`, `src/core.js`, `src/main.js`; renamed package/workflow and updated README.

Verification: 14/14 Node tests, all JavaScript syntax checks, sprite matrices each16 rows×16 columns. Desktop start layout inspected. At320px mobile width the active canvas measures298.67×168 CSS pixels (16:9), dock62px, with no horizontal overflow. Enlarged character preview inspected. Fresh independent review approved the changes.
