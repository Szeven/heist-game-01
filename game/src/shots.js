// The Velvet Vault — shots.js: the four frames the entry is judged by.
// Each scene is a real world state, staged deterministically from a seed and
// painted by the same renderer the game uses — a short game, honestly caught:
// the cover shows the thief mid-room with a guard cone, a camera cone, the
// target glowing and the alarm half full, all in one frame.
import { createRandom } from './random.js';
import { createWorld } from './world.js';
import { SCREEN_PLAY, SCREEN_WIN } from './render.js';

/** Place a guard at a spot, facing an angle, with a set suspicion. */
function poseGuard(guard, x, y, facing, see) {
  guard.x = x;
  guard.y = y;
  guard.facing = facing;
  guard.see = see;
}

/** Aim a camera at a fixed angle for the frame. */
function poseCamera(camera, facing, seeing) {
  camera.facing = facing;
  camera.seeing = seeing;
}

/**
 * Stage the named scene and return the view the renderer paints: the world,
 * the screen, and the score lines for the getaway frame.
 */
export function stageShot(name, seed) {
  const random = createRandom(seed);
  if (name === 'vault') {
    const world = createWorld(2, random);
    world.elapsed = 64;
    world.thief.x = 430;
    world.thief.y = 318;
    world.thief.facing = 0.3;
    world.pieces[0].taken = true;
    world.roomScore = 400;
    world.alarm.value = 55;
    world.alarm.maxValue = 55;
    poseGuard(world.guards[0], 330, 150, Math.PI / 2, 0);
    poseGuard(world.guards[1], 620, 490, -Math.PI / 2, 0.6);
    poseGuard(world.guards[2], 760, 300, Math.PI, 0);
    poseCamera(world.cameras[0], Math.PI / 2 + 0.4, false);
    poseCamera(world.cameras[1], Math.PI - 0.3, false);
    return { world, screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'caught') {
    const world = createWorld(1, random);
    world.elapsed = 48;
    world.thief.x = 470;
    world.thief.y = 330;
    world.thief.facing = Math.PI;
    world.pieces[0].taken = true;
    world.roomScore = 200;
    world.alarm.value = 97;
    world.alarm.maxValue = 100;
    world.alarm.lockdown = true;
    world.alarm.lockdownSeconds = 3.2;
    world.alarm.lockdowns = 1;
    poseGuard(world.guards[0], 520, 300, Math.PI * 0.75, 1);
    poseGuard(world.guards[1], 250, 260, 0.4, 0.2);
    poseGuard(world.guards[2], 710, 420, -Math.PI * 0.7, 0);
    poseCamera(world.cameras[0], Math.PI / 3 + 0.3, true);
    poseCamera(world.cameras[1], -Math.PI * 0.65, false);
    return { world, screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'getaway') {
    const world = createWorld(2, random);
    world.elapsed = 12;
    return {
      world,
      screen: SCREEN_WIN,
      best: 0,
      finalScore: 2850,
      winRows: ['Loot lifted — $2,100', 'Speed bonus — $250', 'Rating: Ghost — $500'],
    };
  }
  // Cover: room 1, mid-heist, everything in one frame.
  const world = createWorld(0, random);
  world.elapsed = 26;
  world.thief.x = 430;
  world.thief.y = 380;
  world.thief.facing = -0.5;
  world.pieces[0].taken = true;
  world.roomScore = 150;
  world.alarm.value = 38;
  world.alarm.maxValue = 38;
  poseGuard(world.guards[0], 520, 200, Math.PI / 2 + 0.3, 0.45);
  poseGuard(world.guards[1], 700, 470, -Math.PI / 2, 0);
  poseCamera(world.cameras[0], Math.PI / 2 - 0.5, false);
  return { world, screen: SCREEN_PLAY, best: 0 };
}
