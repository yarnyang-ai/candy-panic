import { WIDTH, HEIGHT, FLOOR, CANDIES, pickCandyType } from './core.js';

function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const random = rng(174);
const spriteImages = Object.fromEntries(['player', 'boy'].map(kind => {
  const image = new Image();
  image.src = new URL(`../assets/characters/${kind}.png`, import.meta.url).href;
  return [kind, image];
}));
const palettes = {
  player: { w: '#fcf1ff', v: '#c7b4d4', k: '#211e2b', h: '#302739', j: '#635073', p: '#b77bdf', e: '#a04ccd', s: '#f4c6b1', f: '#d8999c', b: '#332b3f' },
  boy: { t: '#e1b36c', T: '#765033', q: '#92deb2', c: '#f8a247', r: '#df6264', b: '#6abbe1', h: '#f99e35', H: '#ffd36d', s: '#f7c69b', f: '#d99c77', e: '#519b61', n: '#31516a', N: '#243a52', R: '#ab4148', w: '#f5ead0', g: '#e8bf6c', d: '#71503e', k: '#3a2c2a' },
};
const sprites = {
  player: [
    '...w........w...', '...wkw....wkw...', '..wppwwwwwwppw..', '..wvwjjjjjjwvw..',
    '..wwhhhhhhhhww..', '..vwhsssssshwv..', '..vwhseseshwv...', '...vhfssssfhv...',
    '...wwvkkkvww....', '..wvwkkpkkwvw...', '..wwwwkwkwwww...', '..svwkkkkkwvs...',
    '...vwkkkkkwv....', '..w..s..s.......', '...wvw..wvw.....', '....bb..bb......',
  ],
  boy: [
    '....tttttttt....', '...tTqcrbqcTt...', '...ttTTtTTttt...', '..s..hHHHhh..s..',
    '..n.hhHhhhhH.n..', '..nRhhsssshRnN..', '...nNseseshNn...', '....RfssssRf....',
    '....ngwwwgn.....', '...nRwdwdwRn....', '...ngRwdwRgn....', '...NRddddRN.....',
    '....NdddddN.....', '.....sw.ws......', '.....ww.ww......', '....dkk.dkk.....',
  ],
};

export function drawSprite(ctx, kind, x, y, { facing = 1, walk = 0, throwing = false } = {}) {
  x = Math.round(x); y = Math.round(y);
  ctx.save();
  ctx.translate(x + (facing < 0 ? 16 : 0), y);
  ctx.scale(facing < 0 ? -1 : 1, 1);
  const customSprite = spriteImages[kind];
  if (customSprite?.complete && customSprite.naturalWidth === 16 && customSprite.naturalHeight === 16) {
    ctx.imageSmoothingEnabled = false;
    if (walk || throwing) {
      for (let row = 0; row < 16; row++) {
        if (row >= 13 && walk) {
          ctx.drawImage(customSprite, 0, row, 8, 1, walk, row + (walk > 0 ? -1 : 0), 8, 1);
          ctx.drawImage(customSprite, 8, row, 8, 1, 8 - walk, row, 8, 1);
        } else if (kind === 'boy' && throwing && row >= 3 && row < 7) {
          ctx.drawImage(customSprite, 0, row, 13, 1, 0, row, 13, 1);
          ctx.drawImage(customSprite, 13, row, 3, 1, 14, row, 3, 1);
        } else {
          ctx.drawImage(customSprite, 0, row, 16, 1, 0, row, 16, 1);
        }
      }
    } else {
      ctx.drawImage(customSprite, 0, 0);
    }
    ctx.restore();
    return;
  }
  const rows = sprites[kind];
  const palette = palettes[kind];
  for (let row = 0; row < 16; row++) for (let col = 0; col < 16; col++) {
    const pixel = rows[row][col];
    if (!palette[pixel]) continue;
    let dx = 0, dy = 0;
    if (row >= 13 && walk) { dx = col < 8 ? walk : -walk; dy = walk > 0 && col < 8 ? -1 : 0; }
    if (throwing && col > 12 && row >= 3 && row < 7) { dx = 1; }
    ctx.fillStyle = palette[pixel]; ctx.fillRect(col + dx, row + dy, 1, 1);
  }
  ctx.restore();
}

function pixelCircle(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  for (let row = -r; row <= r; row++) {
    const half = Math.floor(Math.sqrt(r * r - row * row));
    ctx.fillRect(x - half, y + row, half * 2 + 1, 1);
  }
}

function pine(ctx, x, y, height, color, trunkColor) {
  const width = height * 0.38;
  ctx.fillStyle = trunkColor;
  ctx.fillRect(Math.round(x - 2), Math.round(y - height), 4, height);
  ctx.fillStyle = color;
  for (let tier = 0; tier < 5; tier++) {
    const top = Math.round(y - height + tier * height * 0.13);
    const h = height * 0.38;
    for (let row = 0; row < h; row += 3) {
      const half = Math.floor(row / h * width * (0.45 + tier * 0.12));
      ctx.fillRect(Math.round(x - half), top + row, half * 2 + 2, 3);
    }
  }
}

function broadTree(ctx, x, y, height, color, leaves) {
  const top = y - height;
  ctx.fillStyle = color;
  ctx.fillRect(x, top, 7, height);
  ctx.fillRect(x + 7, top + 22, 3, height - 22);
  for (let i = 0; i < 6; i++) {
    const branchY = Math.round(top + i * 15 + 12);
    const side = i % 2 ? -1 : 1;
    for (let j = 0; j < 8; j++) ctx.fillRect(x + j * 3 * side, branchY - j * 2, 5, 3);
  }
  for (let i = 0; i < 24; i++) {
    const lx = Math.round(x + (random() - 0.5) * 98), ly = Math.round(top - 7 + random() * 75);
    ctx.fillStyle = leaves[i % leaves.length];
    ctx.fillRect(lx, ly, 15 + Math.floor(random() * 21), 5 + Math.floor(random() * 9));
    ctx.fillRect(lx + 4, ly - 4, 16, 4);
  }
}

export function drawPlatform(ctx, p, seed = 1) {
  const r = rng(seed * 512 + 17);
  const { x, y, w } = p;
  ctx.fillStyle = '#29362a'; ctx.fillRect(x + 3, y + 3, w - 6, 8);
  ctx.fillStyle = '#3b4933'; ctx.fillRect(x, y, w, 6);
  ctx.fillStyle = '#76845a'; ctx.fillRect(x + 1, y, w - 2, 2);
  ctx.fillStyle = '#9aa26b';
  for (let i = 0; i < w; i += 4) if (r() > 0.3) ctx.fillRect(x + i, y - 1 - Math.floor(r() * 2), 2, 2);
  for (let i = 3; i < w - 4; i += 5) {
    ctx.fillStyle = r() > 0.4 ? '#45523a' : '#222f26';
    ctx.fillRect(x + i, y + 6, 4, 4 + Math.floor(r() * 9));
    if (r() > 0.6) { ctx.fillStyle = '#627448'; ctx.fillRect(x + i, y + 8, 1, 12 + Math.floor(r() * 14)); }
  }
}

export function createBackground(platforms) {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH; canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, '#253b31'); sky.addColorStop(0.38, '#6d7860'); sky.addColorStop(0.72, '#9a9368'); sky.addColorStop(1, '#465c43');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  pixelCircle(ctx, 343, 65, 23, '#b9ad77');
  pixelCircle(ctx, 343, 65, 19, '#d2bb80');
  ctx.fillStyle = '#f5d59a11';
  ctx.beginPath(); ctx.moveTo(340, 25); ctx.lineTo(420, 246); ctx.lineTo(260, 246); ctx.closePath(); ctx.fill();
  for (let i = 0; i < 33; i++) {
    const x = Math.floor(i * 17 + random() * 15), h = 60 + random() * 65;
    pine(ctx, x, 210 + random() * 13, h, '#63785a', '#697858');
  }
  ctx.fillStyle = '#627653';
  for (let x = 0; x < WIDTH; x += 4) ctx.fillRect(x, 202 + Math.sin(x * 0.025) * 9, 4, 68);
  for (let i = 0; i < 21; i++) {
    const x = Math.floor(i * 25 + random() * 19);
    pine(ctx, x, 240, 90 + random() * 90, '#455e46', '#4a5e42');
  }
  // High branches frame the sun, without hiding the play area.
  broadTree(ctx, 31, 251, 239, '#273e30', ['#2b4432', '#314a35', '#3d5237']);
  broadTree(ctx, 451, 252, 223, '#293f2e', ['#30482f', '#3e5336', '#405735']);
  broadTree(ctx, 122, 250, 201, '#3b5238', ['#3a5137', '#425b3b', '#4c6241']);
  ctx.fillStyle = '#1c35286b'; ctx.fillRect(0, 0, 189, HEIGHT);
  // Deliberately scattered, sharply cut pixels give the forest its texture.
  for (let i = 0; i < 680; i++) {
    const x = Math.floor(random() * WIDTH), y = Math.floor(random() * FLOOR);
    ctx.fillStyle = ['#ccbd7f16', '#193c291d', '#bac08018'][i % 3];
    ctx.fillRect(x, y, 1 + Math.floor(random() * 3), 1);
  }
  for (let i = 0; i < platforms.length; i++) drawPlatform(ctx, platforms[i], i + 1);
  // Loamy earth, moss, roots and tiny stones.
  ctx.fillStyle = '#202d24'; ctx.fillRect(0, FLOOR + 2, WIDTH, HEIGHT - FLOOR);
  ctx.fillStyle = '#4e623b'; ctx.fillRect(0, FLOOR, WIDTH, 3);
  ctx.fillStyle = '#7f8a50'; ctx.fillRect(0, FLOOR, WIDTH, 1);
  for (let x = 0; x < WIDTH; x += 2) {
    const h = 1 + Math.floor(random() * 5);
    ctx.fillStyle = ['#809451', '#657d46', '#a1a56a'][Math.floor(random() * 3)];
    ctx.fillRect(x, FLOOR - h, 1, h);
    if (random() > 0.75) ctx.fillRect(x - 1, FLOOR - h, 3, 1);
  }
  for (let i = 0; i < 250; i++) {
    ctx.fillStyle = ['#405038', '#38412e', '#192820', '#55563a'][i % 4];
    ctx.fillRect(Math.floor(random() * WIDTH), FLOOR + 4 + Math.floor(random() * 20), 1 + Math.floor(random() * 3), 1);
  }
  // Amber mushrooms and little woodland flowers.
  for (const [x, y] of [[22, 244], [73, 198], [97, 244], [159, 244], [325, 244], [380, 195], [458, 128], [433, 244]]) {
    ctx.fillStyle = '#d3c49a'; ctx.fillRect(x, y - 4, 1, 5);
    ctx.fillStyle = '#c97f4b'; ctx.fillRect(x - 2, y - 5, 5, 2); ctx.fillRect(x - 1, y - 6, 3, 1);
    ctx.fillStyle = '#f4ba73'; ctx.fillRect(x - 1, y - 5, 1, 1);
  }
  for (const [x, y] of [[138, 246], [340, 246], [62, 199], [424, 129]]) {
    ctx.fillStyle = '#869651'; ctx.fillRect(x, y - 7, 1, 7);
    ctx.fillStyle = '#c9b676'; ctx.fillRect(x - 1, y - 9, 3, 2);
  }
  // A lantern suspended from a branch.
  ctx.fillStyle = '#3d4930'; ctx.fillRect(389, 50, 1, 29);
  ctx.fillRect(386, 78, 7, 2); ctx.fillRect(386, 87, 7, 2);
  ctx.fillStyle = '#cfab66'; ctx.fillRect(387, 80, 5, 7);
  ctx.fillStyle = '#f3d49a'; ctx.fillRect(388, 81, 2, 5);
  return canvas;
}

const glyphs = {
  C: ['01111', '11000', '11000', '11000', '11000', '11000', '01111'],
  A: ['01110', '11011', '11011', '11111', '11011', '11011', '11011'],
  N: ['11011', '11111', '11111', '11111', '11011', '11011', '11011'],
  D: ['11110', '11011', '11011', '11011', '11011', '11011', '11110'],
  Y: ['11011', '11011', '11011', '01110', '00100', '00100', '00100'],
  R: ['11110', '11011', '11011', '11110', '11100', '11010', '11011'],
  U: ['11011', '11011', '11011', '11011', '11011', '11011', '01110'],
  S: ['01111', '11000', '11000', '01110', '00011', '00011', '11110'],
  H: ['11011', '11011', '11011', '11111', '11011', '11011', '11011'],
  P: ['11110', '11011', '11011', '11110', '11000', '11000', '11000'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  '!': ['1', '1', '1', '1', '1', '0', '1'],
};
export function drawTitle(canvas) {
  const ctx = canvas.getContext('2d');
  function word(text, y, color) {
    let x = 0;
    for (const letter of text) {
      glyphs[letter].forEach((row, j) => {
      for (let col = 0; col < row.length; col++) if (row[col] === '1') {
        ctx.fillStyle = '#14231b'; ctx.fillRect(x + col * 6 + 2, y + j * 6 + 3, 6, 6);
        ctx.fillStyle = color; ctx.fillRect(x + col * 6, y + j * 6, 6, 6);
      }
    });
      x += (glyphs[letter][0].length + 1) * 6;
    }
  }
  word('CANDY', 1, '#eee9ca'); word('PANIC!!', 53, '#f5aa73');
}

export class Renderer {
  constructor(canvas, game) {
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.background = createBackground(game.platforms);
    this.motes = Array.from({ length: 32 }, () => ({ x: random() * WIDTH, y: random() * HEIGHT, speed: 0.3 + random(), phase: random() * 6.28 }));
    this.demoCandies = Array.from({ length: 100 }, () => ({ offset: random() * 5, vx: (random() - 0.5) * 100, type: pickCandyType(random()) }));
  }

  draw(game, time, demo = false) {
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.background, 0, 0);
    for (const m of this.motes) {
      ctx.globalAlpha = 0.15 + (Math.sin(time * m.speed + m.phase) + 1) * 0.22;
      ctx.fillStyle = '#e5ce87'; ctx.fillRect(Math.floor((m.x + time * m.speed * 2) % WIDTH), Math.floor(m.y + Math.sin(time + m.phase) * 3), 1, 1);
    }
    ctx.globalAlpha = 1;
    if (demo) {
      for (const c of this.demoCandies) {
        const { speed, size, color } = CANDIES[c.type];
        const t = (time * 0.5 * speed + c.offset) % 3;
        const x = 330 + c.vx * t, y = 116 - t * 85 + 38 * t * t;
        if (y >= FLOOR - size) continue;
        ctx.fillStyle = color;
        ctx.fillRect(Math.floor(x), Math.floor(y), size, size);
      }
      // Whole-number scaling keeps pixels uniform and animated PNG rows seam-free.
      ctx.save(); ctx.translate(314, 118); ctx.scale(2, 2);
      drawSprite(ctx, 'boy', 0, 0, { throwing: Math.sin(time * 5) > 0 }); ctx.restore();
      ctx.save(); ctx.translate(367, 214 + Math.round(Math.sin(time * 2)) ); ctx.scale(2, 2);
      drawSprite(ctx, 'player', 0, 0, { facing: -1 }); ctx.restore();
      return;
    }
    const walkFrame = Math.floor(game.elapsed * 12) % 3 - 1;
    if (game.boy.warning || game.boy.moving) {
      // Frame the exact landing position; a dark outline preserves contrast over candy.
      const x = Math.round(game.boy.targetX) - 4, y = Math.round(game.boy.targetY) - 4;
      const border = (offset, thickness, size) => {
        ctx.fillRect(x + offset, y + offset, size, thickness);
        ctx.fillRect(x + offset, y + offset + size - thickness, size, thickness);
        ctx.fillRect(x + offset, y + offset, thickness, size);
        ctx.fillRect(x + offset + size - thickness, y + offset, thickness, size);
      };
      ctx.fillStyle = '#160e18';
      border(-1, 4, 26);
      ctx.fillRect(x + 6, y - 11, 12, 5);
      ctx.fillRect(x + 8, y - 6, 8, 2);
      ctx.fillRect(x + 10, y - 4, 4, 2);
      ctx.fillStyle = Math.floor(time * 4) % 2 ? '#a82b3d' : '#ff2947';
      border(0, 2, 24);
      ctx.fillRect(x + 7, y - 10, 10, 3);
      ctx.fillRect(x + 9, y - 7, 6, 2);
      ctx.fillRect(x + 11, y - 5, 2, 2);
    }
    drawSprite(ctx, 'boy', game.boy.x, game.boy.y, { facing: game.boy.facing,
      walk: game.boy.moving ? 0 : walkFrame, throwing: game.boy.throwing > 0 });
    for (const c of game.candies) {
      if (c.life > 7 && Math.floor(time * 10) % 2) continue;
      ctx.fillStyle = CANDIES[c.type].color; ctx.fillRect(Math.floor(c.x), Math.floor(c.y), c.size, c.size);
    }
    const p = game.player;
    drawSprite(ctx, 'player', p.x, p.y, { facing: p.facing, walk: Math.abs(p.vx) > 10 && p.grounded ? walkFrame : 0 });
    for (const e of game.effects) {
      ctx.globalAlpha = Math.max(0, 1 - e.life / 0.7);
      ctx.font = 'bold 6px monospace'; ctx.textAlign = 'center';
      ctx.fillStyle = '#16291a'; ctx.fillText(`${e.points > 0 ? '+' : ''}${e.points}`, Math.round(e.x) + 1, Math.round(e.y - e.life * 26) + 1);
      ctx.fillStyle = CANDIES[e.type].color; ctx.fillText(`${e.points > 0 ? '+' : ''}${e.points}`, Math.round(e.x), Math.round(e.y - e.life * 26));
      ctx.fillRect(Math.floor(e.x + e.life * 9), Math.floor(e.y - 2 - e.life * 11), 1, 1);
    }
    ctx.globalAlpha = 1;
    // The player's mint marker stays legible among a shower of candy.
    ctx.fillStyle = '#d7e7b1';
    ctx.fillRect(Math.round(p.x + 7), Math.round(p.y - 6), 3, 1);
    ctx.fillRect(Math.round(p.x + 8), Math.round(p.y - 5), 1, 1);
  }
}
