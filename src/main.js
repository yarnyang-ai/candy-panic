import { Game, CANDIES } from './core.js';
import { Renderer, drawTitle } from './art.js';

const $ = id => document.getElementById(id);
const game = new Game();
const renderer = new Renderer($('game'), game);
drawTitle($('title-art'));

let best = null;
try { const stored = localStorage.getItem('candy-rush-best'); const number = Number(stored); if (stored !== null && Number.isFinite(number)) best = number; } catch { /* Storage is optional. */ }
function renderBest() { $('best-score').textContent = best === null ? '—' : best.toLocaleString(); }
renderBest();

let paused = false;
let sound = true;
let audio = null;
let lastFrame = performance.now();
let visualTime = 0;
let goUntil = 0;
let lastCountdown = 4;
let previousPhase = 'start';
const held = new Set();
const touch = new Set();
const controls = ['left', 'right', 'jump', 'down'];
const shareMessage = () => `I scored ${game.score} pt in Candy Panic!!\nCan you beat my score?\n#CandyPanic`;
const gameUrl = () => location.protocol.startsWith('http') ? `${location.origin}${location.pathname}` : '';

function initAudio() {
  if (!sound) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume().catch(() => {});
  } catch { sound = false; updateSound(); }
}
function tone(frequency, length = 0.07, volume = 0.025, delay = 0) {
  if (!sound || !audio || audio.state !== 'running') return;
  const oscillator = audio.createOscillator(), gain = audio.createGain();
  const start = audio.currentTime + delay;
  oscillator.type = 'square'; oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(volume, start); gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
  oscillator.connect(gain); gain.connect(audio.destination);
  oscillator.start(start); oscillator.stop(start + length);
}
function updateSound() {
  $('sound-label').textContent = sound ? 'SOUND ON' : 'SOUND OFF';
  $('sound-button').setAttribute('aria-pressed', String(sound));
  $('sound-wave').setAttribute('d', sound ? 'M11 5q4 3 0 6m2-8q5 5 0 10' : 'm12 6 3 4m0-4-3 4');
}
updateSound();
function clearInputs() {
  held.clear(); touch.clear();
  document.querySelectorAll('[data-control]').forEach(b => b.classList.remove('pressed'));
}
function focusGame() { $('game').focus({ preventScroll: true }); }
function start() {
  clearInputs(); initAudio();
  game.start(); paused = false; lastCountdown = 4; previousPhase = 'countdown';
  goUntil = 0; lastFrame = performance.now();
  $('share-status').textContent = ''; $('share-fallback').hidden = true;
  $('start-screen').hidden = true; $('result-screen').hidden = true; $('pause-screen').hidden = true;
  $('countdown-screen').hidden = false; $('countdown-number').textContent = '3';
  $('hud').hidden = false; $('stage').classList.add('game-active');
  $('touch-controls').hidden = false;
  $('score').textContent = '0000'; updateHud(); focusGame();
  // Announce 3 immediately rather than waiting for the next animation frame.
  tone(440, 0.08); lastCountdown = 3;
}
function setPaused(value) {
  if (!['playing', 'countdown'].includes(game.phase)) return;
  paused = value; clearInputs();
  $('pause-screen').hidden = !paused;
  $('countdown-screen').hidden = paused || game.phase !== 'countdown';
  if (paused) { $('go-label').hidden = true; $('resume-button').focus({ preventScroll: true }); }
  else { lastFrame = performance.now(); initAudio(); focusGame(); }
}
function updateHud() {
  $('score').textContent = game.score < 0 ? `−${String(-game.score).padStart(3, '0')}` : String(game.score).padStart(4, '0');
  const tenths = Math.max(0, Math.ceil(game.remaining * 10 - 1e-7));
  const whole = Math.floor(tenths / 10), decimal = tenths % 10;
  $('timer').replaceChildren(document.createTextNode(String(whole).padStart(2, '0')), Object.assign(document.createElement('span'), { textContent: `.${decimal}` }));
  $('time-progress').style.transform = `scaleX(${game.remaining / 30})`;
  $('timer').parentElement.classList.toggle('urgent', game.remaining <= 5);
}
function showResults() {
  clearInputs();
  const isRecord = best === null || game.score > best;
  if (isRecord) {
    best = game.score;
    try { localStorage.setItem('candy-rush-best', String(best)); } catch { /* Private browsing remains playable. */ }
    renderBest();
  }
  $('hud').hidden = true; $('go-label').hidden = true; $('countdown-screen').hidden = true;
  $('stage').classList.remove('game-active');
  $('touch-controls').hidden = true;
  $('result-screen').hidden = false;
  const touchedBoy = game.endReason === 'kitty';
  $('result-title').textContent = touchedBoy ? 'GAME OVER' : 'RESULT';
  $('result-message').hidden = !touchedBoy;
  $('result-screen').classList.toggle('contact-failure', touchedBoy);
  $('result-score').textContent = game.score.toLocaleString();
  $('record-badge').textContent = isRecord ? 'NEW HIGH SCORE!' : `HIGH SCORE ${best.toLocaleString()} pt`;
  $('result-breakdown').replaceChildren(...Object.entries(CANDIES).map(([key, candy]) => {
    const item = document.createElement('span');
    item.title = `${candy.label}: ${game.counts[key]} collected / ${game.counts[key] * candy.points} pt`;
    item.setAttribute('aria-label', item.title);
    item.style.setProperty('--candy-color', candy.color);
    const dot = document.createElement('i'); dot.setAttribute('aria-hidden', 'true');
    dot.style.width = dot.style.height = `${candy.size * 5}px`;
    const count = document.createElement('span'); count.textContent = `×${game.counts[key]}`;
    item.append(dot, count); return item;
  }));
  const notes = touchedBoy ? [220, 165, 110] : [523, 659, 784, 1047];
  notes.forEach((note, i) => tone(note, 0.15, 0.025, i * 0.1));
  $('retry-button').focus({ preventScroll: true });
}
function home() {
  game.reset(); paused = false; clearInputs(); goUntil = 0; previousPhase = 'start';
  $('result-screen').hidden = true; $('start-screen').hidden = false;
  $('pause-screen').hidden = true; $('hud').hidden = true; $('go-label').hidden = true;
  $('stage').classList.remove('game-active'); $('start-button').focus({ preventScroll: true });
  $('touch-controls').hidden = true;
}

$('start-button').addEventListener('click', start);
$('retry-button').addEventListener('click', start);
$('home-button').addEventListener('click', home);
$('pause-button').addEventListener('click', () => setPaused(true));
$('resume-button').addEventListener('click', () => setPaused(false));
$('sound-button').addEventListener('click', () => { sound = !sound; updateSound(); initAudio(); tone(660); });

const gameKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'KeyA', 'KeyD', 'KeyW', 'KeyS', 'Escape', 'KeyP'];
const jumpKeys = ['ArrowUp', 'Space', 'KeyW'];
document.addEventListener('keydown', event => {
  // Preserve native keyboard behavior on buttons, links and the selectable share text.
  const interactive = event.target.closest('button,a,textarea,input,select');
  if (event.code === 'Enter' && game.phase === 'start' && !interactive) { event.preventDefault(); start(); return; }
  if (interactive && (event.code === 'Enter' || event.code === 'Space' || event.target.matches('textarea,input,select'))) return;
  if (gameKeys.includes(event.code) && ['countdown', 'playing'].includes(game.phase)) event.preventDefault();
  if (event.repeat) return;
  held.add(event.code);
  if (['Escape', 'KeyP'].includes(event.code)) { setPaused(!paused); return; }
  if (!paused && jumpKeys.includes(event.code)) game.jump();
  if (!paused && ['ArrowDown', 'KeyS'].includes(event.code)) game.drop();
});
document.addEventListener('keyup', event => held.delete(event.code));
window.addEventListener('blur', () => { clearInputs(); setPaused(true); });
document.addEventListener('visibilitychange', () => { if (document.hidden) { clearInputs(); setPaused(true); } });

for (const button of document.querySelectorAll('[data-control]')) {
  const control = button.dataset.control;
  if (!controls.includes(control)) continue;
  const release = () => { touch.delete(control); button.classList.remove('pressed'); };
  button.addEventListener('pointerdown', event => {
    event.preventDefault(); button.setPointerCapture(event.pointerId);
    touch.add(control); button.classList.add('pressed'); initAudio();
    if (control === 'jump' && !paused) game.jump();
    if (control === 'down' && !paused) game.drop();
  });
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('lostpointercapture', release);
  button.addEventListener('contextmenu', event => event.preventDefault());
}

async function copyResult() {
  const text = `${shareMessage()}${gameUrl() ? `\n${gameUrl()}` : ''}`;
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(text);
    $('share-status').textContent = 'Result copied!';
  } catch {
    const field = $('share-fallback'); field.value = text; field.hidden = false; field.focus({ preventScroll: true }); field.select();
    $('share-status').textContent = 'Select and copy the text below.';
  }
}
$('copy-button').addEventListener('click', copyResult);
$('x-share-button').addEventListener('click', () => {
  const url = new URL('https://twitter.com/intent/tweet');
  url.searchParams.set('text', shareMessage());
  if (gameUrl()) url.searchParams.set('url', gameUrl());
  window.open(url.href, '_blank', 'noopener,noreferrer');
  // Some browsers return null for noopener even when opening succeeds.
  $('share-status').textContent = 'Share your result in the X compose window.';
});

function frame(now) {
  const dt = Math.max(0, (now - lastFrame) / 1000);
  lastFrame = now;
  if (!paused) visualTime += Math.min(dt, 0.05);
  const demo = game.phase === 'start';
  if (!paused) {
    game.update(dt, {
      left: held.has('ArrowLeft') || held.has('KeyA') || touch.has('left'),
      right: held.has('ArrowRight') || held.has('KeyD') || touch.has('right'),
    });
  }
  if (game.phase === 'countdown' && !paused) {
    const number = Math.ceil(game.countdown);
    if (number !== lastCountdown) { $('countdown-number').textContent = number; lastCountdown = number; tone(440, 0.08); }
  }
  for (const event of game.events) {
    if (event.type === 'go') { $('countdown-screen').hidden = true; goUntil = now + 650; tone(880, 0.2); }
    if (event.type === 'jump') tone(270 + game.player.jumps * 110, 0.065, 0.012);
  }
  // One tone per frame keeps dense candy showers comfortable to hear.
  const catches = game.events.filter(e => e.type === 'collect');
  if (catches.length) {
    const points = Math.max(...catches.map(e => e.points));
    tone(points < 0 ? 130 : points === 10 ? 1047 : points === 5 ? 784 : 587, 0.045, 0.012);
  }
  game.events.length = 0;
  if (game.phase === 'result' && previousPhase !== 'result') showResults();
  previousPhase = game.phase;
  $('go-label').hidden = paused || now >= goUntil || game.phase !== 'playing';
  if (game.phase === 'playing' || game.phase === 'countdown') updateHud();
  renderer.draw(game, visualTime, demo);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
