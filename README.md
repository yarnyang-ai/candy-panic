# Candy Panic!!

A 30-second pixel candy-collecting game. Characters are 16×16 pixels; blue candy is 1×1, orange candy is 2×2, and red candy and stones are 3×3. No build, API key, or external dependencies are needed.

## Play

- Move: Left / Right arrows or A / D.
- Double jump: Space, Up arrow, or W.
- Drop through a floating platform: Down arrow or S (↓ on touch controls). Press once per platform.
- Pause / resume: Esc or P. Switching tabs pauses automatically.
- Touch controls appear inside the game on mobile.
- Sound is ON by default; audio starts after START is pressed. Toggle it with SOUND.
- Soda +1, Orange +5, Strawberry +10, Stone −10.
- Red candy and stones move slowly. Stones disappear on contact with the ground or platforms.
- The boy randomly jumps among the five floating platforms every five seconds, always choosing a different one. A flashing red frame marks his exact landing position before and during the jump.
- Touching the boy ends the round immediately. The result displays "DON'T TOUCH ME, KITTY!!" and keeps the score collected so far.
- The start screen shows scoring and your locally saved high score.
- Use COPY RESULT beside PLAY AGAIN, or open the result in X's compose window.

## Publish with GitHub Pages

1. Upload this folder's contents to a GitHub repository. Keep `index.html` at the repository root.
2. In **Settings → Pages → Build and deployment → Source**, select **GitHub Actions**.
3. Push to `main`, or run **Actions → Deploy Candy Panic to GitHub Pages → Run workflow**.
4. Open the URL shown in Pages, usually `https://<username>.github.io/<repository>/`.

Alternatively, choose **Deploy from a branch → main / (root)** and disable or remove the included Actions workflow.

## Local preview

```powershell
python -m http.server 4174 --bind 127.0.0.1
```

Open `http://127.0.0.1:4174/`. Use an HTTP server rather than opening the HTML file directly; the game uses ES modules.

## Development

Character images are loaded from `assets/characters/player.png` and `assets/characters/boy.png`. Replace either with a 16×16 transparent PNG to customize it. Facing flips, walking and throwing animations are handled by the game. Reload the page after replacing an image.

Run `npm test` with Node.js 22 or newer. No package installation is needed.

- `src/core.js`: simulation, scoring, movement and collisions.
- `src/art.js`: original forest and reference-inspired pixel characters.
- `src/main.js`: screens, input, audio, high score and sharing.
- `styles.css`: responsive game layout.

(C)YarnYang

