export const WIDTH = 480;
export const HEIGHT = 270;
export const FLOOR = 246;
const BOY_MOVE_INTERVAL = 5;
const BOY_MOVE_DURATION = 0.7;
const BOY_WARNING_DURATION = 0.8;
export const CANDIES = Object.freeze({
  blue: { points: 1, color: '#69c9fa', label: 'Soda', size: 1, speed: 1 },
  orange: { points: 5, color: '#ffad50', label: 'Orange', size: 2, speed: 1 },
  red: { points: 10, color: '#ff656b', label: 'Strawberry', size: 3, speed: 0.5 },
  gray: { points: -10, color: '#a6aaa5', label: 'Stone', size: 3, speed: 0.5 },
});

export function createCandy(type, x, y, vx = 0, vy = 0) {
  return { type, x, y, vx, vy, size: CANDIES[type].size, life: 0, collected: false, expired: false };
}

export function pickCandyType(r) {
  // Halve stone's former 11% chance; assign the difference to blue candy.
  return r < 0.585 ? 'blue' : r < 0.835 ? 'orange' : r < 0.945 ? 'red' : 'gray';
}

export class Game {
  constructor(random = Math.random, boyRandom = Math.random) {
    this.random = random;
    this.boyRandom = boyRandom;
    this.platforms = [
      { x: 40, y: 199, w: 84 }, { x: 174, y: 150, w: 132 },
      { x: 356, y: 196, w: 84 }, { x: 10, y: 135, w: 64 },
      { x: 406, y: 129, w: 64 },
    ];
    this.reset();
  }

  reset() {
    this.phase = 'start';
    this.countdown = 3;
    this.remaining = 30;
    this.elapsed = 0;
    this.endReason = null;
    this.score = 0;
    this.counts = { blue: 0, orange: 0, red: 0, gray: 0 };
    this.player = { x: 234, y: FLOOR - 16, vx: 0, vy: 0, jumps: 0, facing: 1, grounded: true };
    this.boyStops = [1];
    this.boy = { x: 232, y: 134, facing: 1, throwing: 0,
      platformIndex: 1, targetPlatformIndex: null, targetX: null, targetY: null,
      moving: false, warning: false };
    this.candies = [];
    this.effects = [];
    this.events = [];
    this.spawnClock = 0;
  }

  start() {
    this.reset();
    this.boyStops.push(this.pickNextBoyPlatform(1));
    this.boy.targetPlatformIndex = this.boyStops[1];
    this.phase = 'countdown';
  }

  pickNextBoyPlatform(current) {
    // Choose uniformly among the other four platforms, independently of candy RNG.
    return (current + 1 + Math.floor(this.boyRandom() * (this.platforms.length - 1))) % this.platforms.length;
  }

  boyRestPosition(index, time) {
    const platform = this.platforms[index];
    const walkRange = Math.min(18, (platform.w - 16) / 3);
    return { x: platform.x + (platform.w - 16) / 2 + Math.sin(time * 1.2) * walkRange,
      y: platform.y - 16 };
  }

  updateBoy() {
    const boy = this.boy;
    const cycle = Math.floor((this.elapsed + 1e-8) / BOY_MOVE_INTERVAL);
    const localTime = Math.max(0, this.elapsed - cycle * BOY_MOVE_INTERVAL);
    // Commit the next destination before its warning starts and retain it through landing.
    while (this.boyStops.length <= cycle + 1) {
      this.boyStops.push(this.pickNextBoyPlatform(this.boyStops.at(-1)));
    }
    const stop = this.boyStops[cycle];
    const oldX = boy.x;
    boy.moving = cycle > 0 && localTime < BOY_MOVE_DURATION - 1e-8;
    boy.warning = !boy.moving && localTime >= BOY_MOVE_INTERVAL - BOY_WARNING_DURATION - 1e-8;
    boy.targetPlatformIndex = boy.moving ? stop : this.boyStops[cycle + 1];
    const departureTime = (cycle + (boy.moving ? 0 : 1)) * BOY_MOVE_INTERVAL;
    const to = this.boyRestPosition(boy.targetPlatformIndex, departureTime + BOY_MOVE_DURATION);
    boy.targetX = to.x;
    boy.targetY = to.y;
    if (boy.moving) {
      const previousStop = this.boyStops[cycle - 1];
      const from = this.boyRestPosition(previousStop, departureTime);
      const progress = localTime / BOY_MOVE_DURATION;
      boy.x = from.x + (to.x - from.x) * progress;
      boy.y = from.y + (to.y - from.y) * progress - Math.sin(progress * Math.PI) * 36;
      boy.platformIndex = previousStop;
    } else {
      Object.assign(boy, this.boyRestPosition(stop, this.elapsed));
      boy.platformIndex = stop;
    }
    if (Math.abs(boy.x - oldX) > 1e-8) boy.facing = boy.x > oldX ? 1 : -1;
  }

  drop() {
    const p = this.player;
    if (this.phase !== 'playing' || !p.grounded) return false;
    const platform = this.platforms.find(s => Math.abs(p.y + 16 - s.y) < 0.01 &&
      p.x + 12 > s.x && p.x + 4 < s.x + s.w);
    if (!platform) return false;
    // Move the feet below this one-way surface; lower platforms still catch us.
    p.y += 1;
    p.vy = 30;
    p.grounded = false;
    return true;
  }

  jump() {
    const p = this.player;
    if (this.phase !== 'playing' || p.jumps >= 2) return false;
    // Jump height is proportional to launch speed squared.
    p.vy = (p.jumps === 0 ? -185 : -165) * Math.sqrt(1.5);
    p.jumps++;
    p.grounded = false;
    this.events.push({ type: 'jump', x: p.x + 8, y: p.y + 16 });
    return true;
  }

  collect(candy) {
    if (this.phase !== 'playing' || candy.collected || candy.expired || !CANDIES[candy.type]) return false;
    candy.collected = true;
    const points = CANDIES[candy.type].points;
    this.score += points;
    this.counts[candy.type]++;
    this.effects.push({ x: candy.x, y: candy.y, life: 0, points, type: candy.type });
    this.events.push({ type: 'collect', points });
    return true;
  }

  finish(reason) {
    if (this.phase !== 'playing') return;
    this.phase = 'result';
    this.endReason = reason;
    this.events.push({ type: 'finish', reason });
  }

  update(dt, input = {}) {
    if (!Number.isFinite(dt) || dt <= 0) return;
    if (this.phase === 'countdown') {
      const used = Math.min(dt, this.countdown);
      this.countdown = Math.max(0, this.countdown - used);
      dt -= used;
      if (this.countdown > 1e-8) return;
      this.countdown = 0;
      this.phase = 'playing';
      this.events.push({ type: 'go' });
    }
    if (this.phase !== 'playing') return;
    const active = Math.min(dt, this.remaining);
    let left = active;
    while (left > 1e-8 && this.phase === 'playing') {
      const step = Math.min(left, 1 / 60);
      this.step(step, input);
      left -= step;
    }
    this.remaining = Math.max(0, this.remaining - (active - left));
    if (this.remaining < 1e-8) {
      this.remaining = 0;
      this.finish('time');
    }
  }

  step(dt, input) {
    this.elapsed += dt;
    const p = this.player;
    const direction = Number(!!input.right) - Number(!!input.left);
    p.vx += ((direction * 112) - p.vx) * Math.min(1, dt * 20);
    if (direction) p.facing = direction;
    p.x = Math.max(2, Math.min(WIDTH - 18, p.x + p.vx * dt));
    if (p.x === 2 || p.x === WIDTH - 18) p.vx = 0;
    const previousBottom = p.y + 16;
    p.vy += 460 * dt;
    p.y += p.vy * dt;
    p.grounded = false;
    const surfaces = [...this.platforms, { x: 0, y: FLOOR, w: WIDTH }];
    if (p.vy >= 0) for (const s of surfaces) {
      if (p.x + 12 > s.x && p.x + 4 < s.x + s.w && previousBottom <= s.y + 0.01 && p.y + 16 >= s.y) {
        p.y = s.y - 16; p.vy = 0; p.jumps = 0; p.grounded = true;
        break;
      }
    }
    if (p.y < 0) { p.y = 0; p.vy = Math.max(0, p.vy); }

    this.updateBoy();
    // Inset the transparent sprite margins for a fair body-contact hitbox.
    const boy = this.boy;
    if (p.x + 14 > boy.x + 2 && p.x + 2 < boy.x + 14 &&
        p.y + 16 > boy.y + 2 && p.y + 2 < boy.y + 16) {
      this.finish('kitty');
      return;
    }
    this.boy.throwing = Math.max(0, this.boy.throwing - dt);
    this.spawnClock -= dt;
    while (this.spawnClock <= 0) {
      this.spawnClock += 0.09;
      this.boy.throwing = 0.16;
      const amount = this.elapsed >= 20 - 1e-8 ? 12 : 6;
      const emit = (type, vx, vy) => this.candies.push(createCandy(type,
        this.boy.x + 8, this.boy.y + 5, vx, vy));
      for (let i = 0; i < amount; i++) {
        const r = this.random();
        const type = pickCandyType(r);
        const vx = (this.random() - 0.5) * 270;
        const vy = -65 - this.random() * 145;
        emit(type, vx, vy);
        if (type === 'blue') emit('blue', vx === 0 ? 20 : -vx, vy);
      }
    }
    for (const candy of this.candies) {
      if (candy.collected) continue;
      candy.life += dt;
      const motionDt = dt * CANDIES[candy.type].speed;
      const oldY = candy.y;
      candy.vy += 170 * motionDt;
      candy.x += candy.vx * motionDt;
      candy.y += candy.vy * motionDt;
      if (candy.x < 1 || candy.x > WIDTH - candy.size - 1) {
        candy.x = Math.max(1, Math.min(WIDTH - candy.size - 1, candy.x)); candy.vx *= -0.6;
      }
      if (candy.vy > 0) for (const s of surfaces) {
        if (candy.x + candy.size > s.x && candy.x < s.x + s.w && oldY <= s.y - candy.size && candy.y >= s.y - candy.size) {
          candy.y = s.y - candy.size;
          if (candy.type === 'gray') { candy.expired = true; break; }
          candy.vy = Math.abs(candy.vy) > 28 ? -candy.vy * 0.37 : 0;
          candy.vx *= 0.72;
          break;
        }
      }
      if (candy.expired) continue;
      // A small forgiving pickup area keeps single-pixel candy satisfying to collect.
      if (candy.x + candy.size > p.x - 2 && candy.x <= p.x + 18 && candy.y + candy.size > p.y - 2 && candy.y <= p.y + 18) this.collect(candy);
    }
    this.candies = this.candies.filter(c => !c.collected && !c.expired && c.life < 8);
    for (const effect of this.effects) effect.life += dt;
    this.effects = this.effects.filter(e => e.life < 0.7);
  }
}
