// The Velvet Vault — main.js: boot and the one loop.
// Input is read every frame, the world advances in fixed 1/60 s steps
// (several in a slow frame, none in a fast one), and the renderer paints what
// is there. The game moves between title, play, paused, caught, room-clear,
// getaway and game-over screens.
//
// ?seed=N fixes the camera sweep. ?shot=cover|vault|caught|getaway (with
// &seed=N) stages that scene instead of running the loop, paints it twice
// and sets window.__shotReady for a screenshot.
import { BEST_KEY, LIVES, RATINGS, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_ALERT, EVENT_CAUGHT, EVENT_LOCKDOWN, EVENT_LOOT, EVENT_ROOM_CLEAR, EVENT_TARGET, EVENT_WIN, resetRoom, stepWorld } from './world.js';
import { ACTION_CONFIRM, ACTION_MUTE, ACTION_PAUSE, ACTION_SMOKE, createInput } from './input.js';
import { createRenderer, SCREEN_CAUGHT, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_ROOM_CLEAR, SCREEN_TITLE, SCREEN_WIN } from './render.js';
import { stageShot } from './shots.js';
import { createAudio, playAlert, playCaught, playCoin, playLockdown, playPickup, playWin } from './audio.js';

/** The longest frame the loop catches up on; a longer stall is dropped. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const renderer = createRenderer(canvas);
const audio = createAudio();
const random = createRandom(seed);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best then lasts this visit only.
  }
}

function runShot(name) {
  const view = stageShot(name, seed);
  view.best = readBest();
  view.lives = LIVES;
  view.totalScore = 0;
  let painted = 0;
  function paint() {
    renderer.draw(view);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let world = createWorld(0, random);
  let best = readBest();
  let lives = LIVES;
  let totalScore = 0;
  let lootBanked = 0;
  let speedBonus = 0;
  let maxAlarm = 0;
  let lockdowns = 0;
  let accumulator = 0;
  let last = performance.now();
  let pendingSmoke = false;
  let caughtLine = '';
  let clearLine = '';
  let overLine = '';
  let winRows = [];
  let finalScore = 0;

  function announce(message) {
    status.textContent = message;
  }

  function startRun() {
    world = createWorld(0, random);
    lives = LIVES;
    totalScore = 0;
    lootBanked = 0;
    speedBonus = 0;
    maxAlarm = 0;
    lockdowns = 0;
    accumulator = 0;
    pendingSmoke = false;
    input.takeClicks();
    screen = SCREEN_PLAY;
    announce('Playing. Lift the Moonlit Portrait, then reach the exit.');
  }

  function bankRoom() {
    const bonus = Math.max(0, Math.round((world.level.parSeconds - world.elapsed) * 5));
    speedBonus += bonus;
    lootBanked += world.roomScore;
    totalScore = lootBanked + speedBonus;
  }

  function roomRating() {
    if (lockdowns === 0 && maxAlarm < 50) return 'Ghost';
    if (lockdowns === 0) return 'Shadow';
    return 'Loud';
  }

  function finishRun() {
    const rating = roomRating();
    const ratingBonus = RATINGS[rating.toLowerCase()];
    finalScore = totalScore + ratingBonus;
    winRows = [
      `Loot lifted — $${lootBanked.toLocaleString('en-US')}`,
      `Speed bonus — $${speedBonus.toLocaleString('en-US')}`,
      `Rating: ${rating} — $${ratingBonus.toLocaleString('en-US')}`,
    ];
    if (finalScore > best) {
      best = finalScore;
      saveBest(best);
    }
    screen = SCREEN_WIN;
    playWin(audio);
    announce(`Getaway! Final score $${finalScore}. Rating ${rating}.`);
  }

  function handleEvents(events) {
    if (events & EVENT_LOOT) playPickup(audio);
    if (events & EVENT_TARGET) {
      playPickup(audio);
      announce(`Target lifted: ${world.target.label}. Reach the glowing EXIT.`);
    }
    if (events & EVENT_ALERT) playAlert(audio);
    if (events & EVENT_LOCKDOWN) {
      lockdowns += 1;
      playLockdown(audio);
      announce('Lockdown! Every guard is coming for you.');
    }
    if (events & EVENT_CAUGHT) {
      lives -= 1;
      playCaught(audio);
      if (lives > 0) {
        caughtLine = `A guard caught you. ${lives} ${lives === 1 ? 'life' : 'lives'} left — the room resets.`;
        screen = SCREEN_CAUGHT;
        announce(caughtLine);
      } else {
        overLine = `Three strikes. The gallery keeps its gold — $${totalScore.toLocaleString('en-US')} banked.`;
        screen = SCREEN_OVER;
        announce(overLine);
      }
      return;
    }
    if (events & EVENT_ROOM_CLEAR) {
      bankRoom();
      clearLine = `The ${world.target.label} is yours — $${totalScore.toLocaleString('en-US')} banked so far.`;
      screen = SCREEN_ROOM_CLEAR;
      announce(clearLine);
      return;
    }
    if (events & EVENT_WIN) {
      bankRoom();
      finishRun();
    }
  }

  function step() {
    const move = input.direction();
    const clicks = input.takeClicks();
    const coinsBefore = world.thief.coins;
    const smoke = pendingSmoke;
    pendingSmoke = false;
    const events = stepWorld(world, STEP, {
      moveX: move.x,
      moveY: move.y,
      grabbing: input.grabbing(),
      coinAt: clicks.length > 0 ? clicks[clicks.length - 1] : null,
      smoke,
    });
    if (world.thief.coins < coinsBefore) playCoin(audio);
    maxAlarm = Math.max(maxAlarm, world.alarm.maxValue);
    handleEvents(events);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) audio.enabled = !audio.enabled;
    if (actions & ACTION_SMOKE) pendingSmoke = true;
    if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
    } else if (actions & ACTION_CONFIRM && screen === SCREEN_TITLE) {
      startRun();
    } else if (actions & ACTION_CONFIRM && screen === SCREEN_CAUGHT) {
      resetRoom(world);
      accumulator = 0;
      screen = SCREEN_PLAY;
      announce('Playing. The room resets — try a quieter route.');
    } else if (actions & ACTION_CONFIRM && screen === SCREEN_ROOM_CLEAR) {
      world = createWorld(world.levelIndex + 1, random);
      accumulator = 0;
      screen = SCREEN_PLAY;
      announce(`Playing. ${world.level.name}. Lift the ${world.target.label}.`);
    } else if (actions & ACTION_CONFIRM && (screen === SCREEN_WIN || screen === SCREEN_OVER)) {
      startRun();
    }
    if (screen === SCREEN_PLAY) {
      while (accumulator >= STEP && screen === SCREEN_PLAY) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw({
      world,
      screen,
      best,
      totalScore,
      lives,
      caughtLine,
      clearLine,
      overLine,
      winRows,
      finalScore,
    });
  }

  // Leaving the tab pauses a running game rather than letting guards close in unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('The Velvet Vault. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
