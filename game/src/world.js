// The Velvet Vault — world.js: one room, simulated.
// Holds the thief, the guards, the cameras, the alarm, the loot and the
// getaway door, and steps them all in fixed 1/60 s slices. Events come back
// as a bit mask so the shell can ring a bell, flash the screen or end the run.
import { GUARD, STEP, THIEF, TOOLS } from './config.js';
import { LEVELS } from './levels.js';
import { createGuard, GUARD_CHASE, sendGuardToNoise, stepGuard } from './guards.js';
import { createCamera, stepCamera } from './cameras.js';
import { createThief, dropSmoke, nearestGrabbable, stepGrab, stepThief, tossCoin } from './thief.js';
import { createAlarm, stepAlarm } from './alarm.js';

export const EVENT_LOOT = 1;
export const EVENT_TARGET = 2;
export const EVENT_ALERT = 4;
export const EVENT_LOCKDOWN = 8;
export const EVENT_CAUGHT = 16;
export const EVENT_ROOM_CLEAR = 32;
export const EVENT_WIN = 64;

/** Fresh state for `levelIndex` (0-based). `random` seeds the cameras. */
export function createWorld(levelIndex, random) {
  const level = LEVELS[levelIndex];
  const pieces = level.loot.map((piece) => ({ ...piece, taken: false, isTarget: false }));
  const target = { ...level.target, taken: false, isTarget: true };
  const sightBlockers = [
    ...level.walls,
    ...level.cover.filter((rect) => rect.kind !== 'rope'),
  ];
  const solids = [...level.walls, ...level.cover];
  return {
    levelIndex,
    level,
    thief: createThief(level.spawn),
    guards: level.guards.map((definition) => createGuard(definition)),
    cameras: level.cameras.map((definition) => createCamera(definition, random)),
    alarm: createAlarm(),
    pieces: [...pieces, target],
    target,
    sightBlockers,
    solids,
    smokes: [],
    coinsInFlight: [],
    roomScore: 0,
    targetTaken: false,
    exitOpen: false,
    elapsed: 0,
    caught: false,
  };
}

/** Back to the room's start, loot restored, tools refilled, alarm quiet. */
export function resetRoom(world) {
  const fresh = createWorld(world.levelIndex, Math.random);
  world.thief = fresh.thief;
  world.guards = fresh.guards;
  world.cameras = fresh.cameras;
  world.alarm = fresh.alarm;
  world.pieces = fresh.pieces;
  world.target = fresh.target;
  world.smokes = [];
  world.coinsInFlight = [];
  world.roomScore = 0;
  world.targetTaken = false;
  world.exitOpen = false;
  world.elapsed = 0;
  world.caught = false;
}

/**
 * One fixed step. `input` is { moveX, moveY, grabbing, coinAt, smoke }:
 * coinAt is a {x, y} field point the player clicked this step (or null),
 * smoke is true the step the player drops a pellet. Returns an event mask.
 */
export function stepWorld(world, dt, input) {
  let events = 0;
  world.elapsed += dt;

  stepThief(world.thief, dt, input.moveX, input.moveY, world.solids);

  if (input.coinAt) {
    const coin = tossCoin(world.thief, input.coinAt.x, input.coinAt.y);
    if (coin) world.coinsInFlight.push(coin);
  }
  if (input.smoke) {
    const smoke = dropSmoke(world.thief);
    if (smoke) world.smokes.push(smoke);
  }

  for (let index = world.coinsInFlight.length - 1; index >= 0; index -= 1) {
    const coin = world.coinsInFlight[index];
    coin.seconds -= dt;
    if (coin.seconds <= 0) {
      for (const guard of world.guards) sendGuardToNoise(guard, coin.x, coin.y, TOOLS.coinHearing);
      world.coinsInFlight.splice(index, 1);
    }
  }
  for (let index = world.smokes.length - 1; index >= 0; index -= 1) {
    world.smokes[index].seconds -= dt;
    if (world.smokes[index].seconds <= 0) world.smokes.splice(index, 1);
  }

  const lifted = stepGrab(world.thief, dt, input.grabbing, world.pieces);
  if (lifted) {
    world.roomScore += lifted.value;
    if (lifted.isTarget) {
      world.targetTaken = true;
      world.exitOpen = true;
      events |= EVENT_TARGET;
    } else {
      events |= EVENT_LOOT;
    }
  }

  let cameraSeeing = 0;
  for (const camera of world.cameras) {
    if (stepCamera(camera, dt, world.thief, world.sightBlockers, world.smokes, world.elapsed)) cameraSeeing += 1;
  }

  let alerts = 0;
  for (const guard of world.guards) {
    const result = stepGuard(guard, dt, world.thief, world.sightBlockers, world.smokes, world.alarm.lockdown);
    if (result === 'alert') alerts += 1;
    if (result === 'caught') {
      world.caught = true;
      events |= EVENT_CAUGHT;
    }
  }
  if (alerts > 0) events |= EVENT_ALERT;

  const lockdown = stepAlarm(world.alarm, dt, cameraSeeing, alerts);
  if (lockdown === 'lockdown') {
    events |= EVENT_LOCKDOWN;
    for (const guard of world.guards) {
      if (guard.state !== GUARD_CHASE) {
        guard.state = GUARD_CHASE;
        guard.stateSeconds = GUARD.chaseSeconds;
        guard.chaseX = world.thief.x;
        guard.chaseY = world.thief.y;
      }
    }
  }

  if (world.exitOpen) {
    const exit = world.level.exit;
    if (
      world.thief.x > exit.x - THIEF.radius &&
      world.thief.x < exit.x + exit.w + THIEF.radius &&
      world.thief.y > exit.y - THIEF.radius &&
      world.thief.y < exit.y + exit.h + THIEF.radius
    ) {
      events |= world.levelIndex >= LEVELS.length - 1 ? EVENT_WIN : EVENT_ROOM_CLEAR;
    }
  }

  return events;
}

/** The piece the thief could lift right now, for the prompt under her feet. */
export function grabbableNow(world) {
  return nearestGrabbable(world.thief, world.pieces);
}

export { STEP };
