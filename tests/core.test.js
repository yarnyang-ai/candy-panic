import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, createCandy, WIDTH, FLOOR } from '../src/core.js';

test('three seconds of countdown leave a full thirty-second round', () => {
  const game = new Game(() => 0.5);
  game.start();
  game.update(2.99);
  assert.equal(game.phase, 'countdown');
  assert.equal(game.remaining, 30);
  game.update(0.01);
  assert.equal(game.phase, 'playing');
  assert.equal(game.remaining, 30);
  game.update(29.9);
  assert.ok(Math.abs(game.remaining - 0.1) < 0.00001);
  game.update(0.1);
  assert.equal(game.phase, 'result');
  assert.equal(game.remaining, 0);
});

test('countdown overshoot consumes only the part after GO', () => {
  const game = new Game();
  game.start();
  game.update(3.2);
  assert.equal(game.phase, 'playing');
  assert.equal(game.remaining, 29.8);
});

test('each color contributes the requested points exactly once', () => {
  const game = new Game(); game.start(); game.update(3);
  for (const color of ['blue', 'orange', 'red', 'gray']) {
    const candy = createCandy(color, 200, 100);
    assert.equal(game.collect(candy), true);
    assert.equal(game.collect(candy), false);
  }
  assert.equal(game.score, 6);
  assert.deepEqual(game.counts, { blue: 1, orange: 1, red: 1, gray: 1 });
});

test('gray can produce a negative score, and expired rounds reject collection', () => {
  const game = new Game(); game.start(); game.update(3);
  game.collect(createCandy('gray', 0, 0));
  assert.equal(game.score, -10);
  game.update(30);
  const finalScore = game.score;
  assert.equal(game.collect(createCandy('red', 0, 0)), false);
  assert.equal(game.score, finalScore);
});

test('two jumps are allowed, a third is rejected, landing restores jumps', () => {
  const game = new Game(); game.start(); game.update(3);
  assert.equal(game.jump(), true);
  assert.equal(game.jump(), true);
  assert.equal(game.jump(), false);
  for (let i = 0; i < 180; i++) game.update(1 / 60);
  assert.equal(game.player.y, FLOOR - 16);
  assert.equal(game.player.jumps, 0);
  assert.equal(game.jump(), true);
});

test('player stays inside the arena and lands on floating platforms', () => {
  const game = new Game(); game.start(); game.update(3);
  game.player.x = 1;
  for (let i = 0; i < 60; i++) game.update(1 / 60, { left: true });
  assert.equal(game.player.x, 2);
  game.player.x = WIDTH - 17;
  for (let i = 0; i < 60; i++) game.update(1 / 60, { right: true });
  assert.equal(game.player.x, WIDTH - 18);
  const platform = game.platforms[0];
  game.player.x = platform.x + 8; game.player.y = platform.y - 20; game.player.vy = 70;
  for (let i = 0; i < 10; i++) game.update(1 / 60);
  assert.equal(game.player.y, platform.y - 16);
});

test('touching candy collects once during actual simulation', () => {
  const game = new Game(); game.start(); game.update(3);
  game.candies = [createCandy('red', game.player.x + 8, game.player.y + 8)];
  game.update(1 / 60);
  assert.equal(game.score, 10);
  game.update(1 / 60);
  assert.equal(game.counts.red, 1);
});

test('dropping through a floating platform clears it and lands on the next surface', () => {
  const game = new Game(() => 0.5, () => 0); game.start(); game.update(3);
  const upper = game.platforms[3], lower = game.platforms[0];
  Object.assign(game.player, { x: 48, y: upper.y - 16, vy: 0, grounded: true });
  assert.equal(game.drop(), true);
  assert.equal(game.player.grounded, false);
  game.update(0.1);
  assert.ok(game.player.y + 16 > upper.y);
  game.update(0.6);
  assert.equal(game.player.y, lower.y - 16);
  assert.equal(game.player.grounded, true);
  assert.equal(game.drop(), true);
  game.update(0.7);
  assert.equal(game.player.y, FLOOR - 16);
  assert.equal(game.player.grounded, true);
});

test('drop ignores ground, airborne, countdown and finished states', () => {
  const game = new Game(); game.start();
  const platform = game.platforms[0];
  Object.assign(game.player, { x: 48, y: platform.y - 16, grounded: true });
  assert.equal(game.drop(), false);
  game.update(3);
  game.player.grounded = false;
  assert.equal(game.drop(), false);
  Object.assign(game.player, { y: FLOOR - 16, grounded: true });
  assert.equal(game.drop(), false);
  assert.equal(game.player.y, FLOOR - 16);
  Object.assign(game.player, { y: platform.y - 16 });
  game.finish('time');
  assert.equal(game.drop(), false);
});

test('a candy touching the player after the deadline cannot change the result', () => {
  const game = new Game(); game.start(); game.update(3);
  game.remaining = 0.001;
  game.candies = [createCandy('red', game.player.x + 8, game.player.y + 8)];
  game.update(0.1);
  assert.equal(game.phase, 'result');
  const score = game.score;
  game.update(1);
  assert.equal(game.score, score);
});

test('restarting clears scores, collected counts and old candy', () => {
  const game = new Game(); game.start(); game.update(3);
  game.collect(createCandy('red', 0, 0));
  game.candies.push(createCandy('blue', 120, 20));
  game.start();
  assert.equal(game.score, 0);
  assert.equal(game.candies.length, 0);
  assert.deepEqual(game.counts, { blue: 0, orange: 0, red: 0, gray: 0 });
  assert.equal(game.remaining, 30);
});

test('red and stone are 3×3, orange is 2×2, and red moves as slowly as stone', () => {
  const game = new Game(); game.start(); game.update(3);
  const stone = createCandy('gray', 330, 50, 80, 20);
  const candy = createCandy('blue', 330, 50, 80, 20);
  const red = createCandy('red', 330, 50, 80, 20);
  const orange = createCandy('orange', 330, 50, 80, 20);
  game.candies = [stone, candy, red, orange];
  game.update(0.1);
  assert.equal(stone.size, 3);
  assert.equal(red.size, 3);
  assert.equal(orange.size, 2);
  assert.equal(candy.size, 1);
  assert.ok(Math.abs(stone.x - 334) < 0.00001);
  assert.ok(Math.abs(candy.x - 338) < 0.00001);
  assert.ok(stone.y < candy.y);
  assert.equal(red.x, stone.x);
  assert.equal(red.y, stone.y);
});

test('stone disappears on contact with the ground or a platform without scoring', () => {
  for (const [x, surfaceY] of [[330, FLOOR], [60, 199]]) {
    const game = new Game(); game.start(); game.update(3);
    const stone = createCandy('gray', x, surfaceY - 3, 0, 200);
    game.candies = [stone];
    game.update(1 / 60);
    assert.equal(game.candies.includes(stone), false);
    assert.equal(game.collect(stone), false);
    assert.equal(game.score, 0);
  }
});

test('regular candy still bounces after landing', () => {
  const game = new Game(); game.start(); game.update(3);
  const candy = createCandy('blue', 330, FLOOR - 2, 0, 200);
  game.candies = [candy]; game.update(1 / 60);
  assert.equal(game.candies.includes(candy), true);
  assert.ok(candy.vy < 0);
});

test('each throw doubles from six to twelve when only ten seconds remain', () => {
  const game = new Game(() => 0.5); game.start(); game.update(3);
  game.update(1 / 60);
  assert.equal(game.candies.length, 12);
  game.update(20 - 1 / 60);
  assert.ok(Math.abs(game.remaining - 10) < 0.00001);
  game.candies = [];
  game.update(0.09);
  assert.equal(game.candies.length, 12);
});

test('a large update crossing the ten-second boundary doubles only later throws', () => {
  const game = new Game(() => 0.5); game.start(); game.update(3);
  game.update(19.9);
  game.candies = [];
  game.update(0.3);
  assert.equal(game.candies.length, 30); // One 6-item throw, then two 12-item throws.
});

test('stone uses half its former probability, 11 out of 200 uniform draws', () => {
  let calls = 0;
  const game = new Game(() => {
    const call = calls++;
    if (call % 3 !== 0) return 0.5;
    const index = Math.floor(call / 3);
    return index < 200 ? (index + 0.5) / 200 : 0.5;
  });
  game.start(); game.update(3); game.update(3);
  assert.equal(game.candies.filter(c => c.type === 'gray').length, 11);
});

test('both jump heights increase by 1.5 times, rather than multiplying velocity by 1.5', () => {
  for (const [jumps, expectedRise] of [[1, 55.8], [2, 44.39]]) {
    const game = new Game(); game.start(); game.update(3);
    game.player.x = 330;
    for (let i = 0; i < jumps; i++) game.jump();
    let highest = game.player.y;
    for (let i = 0; i < 400; i++) {
      game.update(1 / 600);
      highest = Math.min(highest, game.player.y);
    }
    const rise = FLOOR - 16 - highest;
    assert.ok(Math.abs(rise - expectedRise) < 0.4, `jump ${jumps} rose ${rise}`);
  }
});

test('boy announces the next platform 0.8 seconds before his five-second departure', () => {
  const game = new Game(() => 0.5, () => 0); game.start(); game.update(3);
  game.update(4.19);
  assert.equal(game.boy.warning, false);
  assert.equal(game.boy.platformIndex, 1);
  game.update(0.02);
  assert.equal(game.boy.warning, true);
  assert.equal(game.boy.targetPlatformIndex, 2);
  assert.equal(game.boy.y, 134);
});

test('boy jumps smoothly to a different platform and lands on it', () => {
  const game = new Game(() => 0.5, () => 0); game.start(); game.update(3);
  game.update(5.35);
  assert.equal(game.boy.moving, true);
  assert.ok(game.boy.x > 290 && game.boy.x < 340);
  assert.ok(game.boy.y < 134);
  game.update(0.35);
  assert.equal(game.boy.moving, false);
  assert.equal(game.boy.warning, false);
  assert.equal(game.boy.platformIndex, 2);
  assert.equal(game.boy.targetPlatformIndex, 3);
  assert.equal(game.boy.y, 180);
  assert.ok(game.boy.x >= 356 && game.boy.x + 16 <= 440);
});

test('controlled random jumps can visit all five floating platforms', () => {
  const game = new Game(() => 0.5, () => 0); game.start(); game.update(3);
  let lastTime = 0;
  for (const [time, index, y] of [[5.7,2,180], [10.7,3,119], [15.7,4,113], [20.7,0,183], [25.7,1,134]]) {
    game.update(time - lastTime); lastTime = time;
    assert.equal(game.boy.platformIndex, index);
    assert.equal(game.boy.y, y);
    const platform = game.platforms[index];
    assert.ok(game.boy.x >= platform.x && game.boy.x + 16 <= platform.x + platform.w);
  }
});

test('new candy originates from the boy after he relocates', () => {
  const game = new Game(() => 0.5, () => 0); game.start(); game.update(3); game.update(5.8);
  game.candies = []; game.spawnClock = 0;
  game.update(1 / 60);
  assert.equal(game.candies.length, 6);
  for (const candy of game.candies) {
    assert.ok(Math.abs(candy.x - game.boy.x - 8) < 1);
    assert.ok(candy.x > 356);
    assert.ok(candy.y > 170 && candy.y < 190);
  }
});

test('boy movement is consistent across large updates and starts fresh on replay', () => {
  const large = new Game(() => 0.5, () => 0), small = new Game(() => 0.5, () => 0);
  for (const game of [large, small]) { game.start(); game.update(3); }
  large.update(5.35);
  for (let i = 0; i < 321; i++) small.update(1 / 60);
  assert.equal(large.boy.moving, small.boy.moving);
  assert.ok(Math.abs(large.boy.x - small.boy.x) < 0.00001);
  assert.ok(Math.abs(large.boy.y - small.boy.y) < 0.00001);
  large.start();
  assert.equal(large.boy.x, 232);
  assert.equal(large.boy.y, 134);
  assert.equal(large.boy.platformIndex, 1);
  assert.equal(large.boy.targetPlatformIndex, 2);
  assert.equal(large.boy.moving, false);
  assert.equal(large.boy.warning, false);
});

test('random destinations include every floating platform except the current one', () => {
  const destinations = [0, 0.25, 0.5, 0.75].map(draw => {
    const game = new Game(() => 0.5, () => draw); game.start();
    return game.boy.targetPlatformIndex;
  });
  assert.deepEqual(destinations, [2, 3, 4, 0]);
});

test('the announced random destination remains fixed until the boy lands', () => {
  const draws = [0.75, 0];
  const game = new Game(() => 0.5, () => draws.shift() ?? 0.5);
  game.start(); game.update(3); game.update(4.3);
  assert.equal(game.boy.targetPlatformIndex, 0);
  for (let i = 0; i < 10; i++) {
    game.update(0.02);
    assert.equal(game.boy.targetPlatformIndex, 0);
  }
  game.update(0.85);
  assert.equal(game.boy.moving, true);
  assert.equal(game.boy.targetPlatformIndex, 0);
  const { targetX, targetY } = game.boy;
  game.update(0.35);
  assert.equal(game.boy.platformIndex, 0);
  assert.ok(Math.abs(game.boy.x - targetX) < 0.00001);
  assert.equal(game.boy.y, targetY);
  assert.equal(game.boy.targetPlatformIndex, 1);
});

test('touching the boy ends the round immediately before collecting more candy', () => {
  const game = new Game(() => 0.5); game.start(); game.update(3);
  game.collect(createCandy('orange', 0, 0));
  game.player.x = game.boy.x; game.player.y = game.boy.y;
  game.candies = [createCandy('red', game.player.x + 8, game.player.y + 8)];
  game.update(1);
  assert.equal(game.phase, 'result');
  assert.equal(game.endReason, 'kitty');
  assert.equal(game.score, 5);
  assert.equal(game.counts.red, 0);
  assert.ok(game.elapsed < 0.02);
  assert.ok(game.remaining > 29.98);
  assert.equal(game.events.filter(e => e.type === 'finish').length, 1);
});

test('a contact game over freezes the score, timer, characters and finish event', () => {
  const game = new Game(); game.start(); game.update(3);
  game.player.x = game.boy.x; game.player.y = game.boy.y; game.update(1 / 60);
  const { score, remaining, elapsed } = game;
  const position = { ...game.player };
  game.update(20, { right: true });
  assert.equal(game.jump(), false);
  assert.equal(game.collect(createCandy('red', 0, 0)), false);
  assert.equal(game.score, score);
  assert.equal(game.remaining, remaining);
  assert.equal(game.elapsed, elapsed);
  assert.deepEqual(game.player, position);
  assert.equal(game.events.filter(e => e.type === 'finish').length, 1);
});

test('passing beside the boy without body contact does not end the game', () => {
  const game = new Game(); game.start(); game.update(3);
  game.player.x = game.boy.x + 15; game.player.y = game.boy.y;
  game.update(1 / 60);
  assert.equal(game.phase, 'playing');
  assert.equal(game.endReason, null);
});

test('contact with the boy during his jump also ends the game', () => {
  const game = new Game(() => 0.5); game.start(); game.update(3); game.update(5.3);
  assert.equal(game.boy.moving, true);
  game.player.x = game.boy.x; game.player.y = game.boy.y;
  game.update(0.02);
  assert.equal(game.phase, 'result');
  assert.equal(game.endReason, 'kitty');
});

test('countdown ignores contact, and replay clears the contact game over', () => {
  const game = new Game(); game.start();
  game.player.x = game.boy.x; game.player.y = game.boy.y;
  game.update(2);
  assert.equal(game.phase, 'countdown');
  assert.equal(game.endReason, null);
  game.update(1.02);
  assert.equal(game.endReason, 'kitty');
  game.start();
  assert.equal(game.endReason, null);
  assert.equal(game.score, 0);
  assert.equal(game.remaining, 30);
  game.update(3);
  assert.equal(game.phase, 'playing');
});

test('normal time-up has its own reason and cannot turn into a contact failure later', () => {
  const game = new Game(() => 0.5); game.start(); game.update(3); game.update(30);
  assert.equal(game.endReason, 'time');
  assert.equal(game.remaining, 0);
  game.player.x = game.boy.x; game.player.y = game.boy.y;
  game.update(1);
  assert.equal(game.endReason, 'time');
});

