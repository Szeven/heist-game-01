// The Velvet Vault — thief.js: Wren, the thief.
// Moves with the keys, slips around walls and cases, and carries two tools:
// coins to toss (a click lands one where it falls and pulls nearby guards
// over to look) and smoke pellets (a cloud that hides her from every eye).
// Loot is lifted by standing close and holding the grab key until the lift
// finishes; moving breaks it off.
import { THIEF, TOOLS } from './config.js';
import { moveWithCollision } from './guards.js';

export function createThief(spawn) {
  return {
    x: spawn.x,
    y: spawn.y,
    facing: -Math.PI / 2,
    coins: TOOLS.coinsPerLevel,
    smoke: TOOLS.smokePerLevel,
    grabTarget: null,
    grabProgress: 0,
    moving: false,
  };
}

/** Step the thief from a direction vector (-1..1 each axis) and the tools used. */
export function stepThief(thief, dt, moveX, moveY, solids) {
  const length = Math.hypot(moveX, moveY);
  thief.moving = length > 0.01;
  if (!thief.moving) return;
  const nx = moveX / length;
  const ny = moveY / length;
  thief.facing = Math.atan2(ny, nx);
  const moved = moveWithCollision(thief.x, thief.y, THIEF.radius, nx * THIEF.speed * dt, ny * THIEF.speed * dt, solids);
  thief.x = moved.x;
  thief.y = moved.y;
}

/** The nearest loot or target piece within grabbing reach, or null. */
export function nearestGrabbable(thief, pieces) {
  let best = null;
  let bestDistance = THIEF.grabRange;
  for (const piece of pieces) {
    if (piece.taken) continue;
    const distance = Math.hypot(piece.x - thief.x, piece.y - thief.y);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = piece;
    }
  }
  return best;
}

/**
 * Hold-to-lift: while the grab key is held and the thief stands still beside
 * a piece, progress climbs; moving or letting go drops it. Returns the piece
 * the moment its lift finishes, or null.
 */
export function stepGrab(thief, dt, grabbing, pieces) {
  const piece = nearestGrabbable(thief, pieces);
  if (!grabbing || piece === null || thief.moving) {
    thief.grabTarget = null;
    thief.grabProgress = 0;
    return null;
  }
  if (thief.grabTarget !== piece) {
    thief.grabTarget = piece;
    thief.grabProgress = 0;
  }
  thief.grabProgress += dt / THIEF.grabSeconds;
  if (thief.grabProgress >= 1) {
    piece.taken = true;
    thief.grabTarget = null;
    thief.grabProgress = 0;
    return piece;
  }
  return null;
}

/** Toss a coin at (x, y). Returns the landing spot, or null (no coins left). */
export function tossCoin(thief, x, y) {
  if (thief.coins <= 0) return null;
  thief.coins -= 1;
  return { x, y, seconds: 0.45, fromX: thief.x, fromY: thief.y };
}

/** Drop a smoke pellet at the thief's feet. Returns the cloud, or null. */
export function dropSmoke(thief) {
  if (thief.smoke <= 0) return null;
  thief.smoke -= 1;
  return { x: thief.x, y: thief.y, radius: TOOLS.smokeRadius, seconds: TOOLS.smokeSeconds };
}
