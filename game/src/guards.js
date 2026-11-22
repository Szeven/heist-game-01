// The Velvet Vault — guards.js: the patrolmen.
// A guard walks a loop of waypoints, facing where he walks. When he can see
// the thief his suspicion climbs; at full suspicion he sounds the alarm and
// gives chase. A tossed coin pulls him off his route to investigate the noise.
// In a lockdown every guard runs for the thief's last known spot.
import { GUARD } from './config.js';
import { angleTo, hasLineOfSight, insideCone } from './vision.js';

export const GUARD_PATROL = 'patrol';
export const GUARD_INVESTIGATE = 'investigate';
export const GUARD_CHASE = 'chase';

export function createGuard(definition) {
  const first = definition.waypoints[0];
  const second = definition.waypoints[1] ?? first;
  return {
    x: first.x,
    y: first.y,
    facing: angleTo(first.x, first.y, second.x, second.y),
    waypointIndex: 1 % definition.waypoints.length,
    waypoints: definition.waypoints,
    state: GUARD_PATROL,
    see: 0,
    stateSeconds: 0,
    investigateX: 0,
    investigateY: 0,
    chaseX: 0,
    chaseY: 0,
    alerted: false,
  };
}

/** Move a point toward a target without passing through a solid rectangle. */
export function moveWithCollision(x, y, radius, dx, dy, solids) {
  let nextX = x + dx;
  for (const solid of solids) {
    if (nextX + radius > solid.x && nextX - radius < solid.x + solid.w && y + radius > solid.y && y - radius < solid.y + solid.h) {
      nextX = dx > 0 ? solid.x - radius : solid.x + solid.w + radius;
    }
  }
  let nextY = y + dy;
  for (const solid of solids) {
    if (nextX + radius > solid.x && nextX - radius < solid.x + solid.w && nextY + radius > solid.y && nextY - radius < solid.y + solid.h) {
      nextY = dy > 0 ? solid.y - radius : solid.y + solid.h + radius;
    }
  }
  return { x: nextX, y: nextY };
}

/** True when this guard can see the thief right now. */
export function guardSeesThief(guard, thief, sightBlockers, smokes) {
  if (!insideCone(guard.x, guard.y, guard.facing, GUARD.visionHalfAngle, GUARD.visionRange, thief.x, thief.y)) return false;
  return hasLineOfSight(guard.x, guard.y, thief.x, thief.y, sightBlockers, smokes);
}

function stepToward(guard, targetX, targetY, speed, dt, solids) {
  const dx = targetX - guard.x;
  const dy = targetY - guard.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 2) return true;
  const step = Math.min(distance, speed * dt);
  guard.facing = Math.atan2(dy, dx);
  const moved = moveWithCollision(guard.x, guard.y, GUARD.radius, (dx / distance) * step, (dy / distance) * step, solids);
  guard.x = moved.x;
  guard.y = moved.y;
  return distance <= step + 1;
}

/**
 * Advance one guard. Returns 'alert' the moment his suspicion fills (the
 * world turns that into an alarm bump and a chase), 'caught' when he reaches
 * the thief, or null.
 */
export function stepGuard(guard, dt, thief, sightBlockers, smokes, lockdown) {
  const solids = sightBlockers;
  const sees = guardSeesThief(guard, thief, sightBlockers, smokes);
  guard.see = sees
    ? Math.min(1, guard.see + GUARD.seeRate * dt)
    : Math.max(0, guard.see - GUARD.seeDecay * dt);

  if (guard.see >= 1 && guard.state !== GUARD_CHASE) {
    guard.state = GUARD_CHASE;
    guard.stateSeconds = GUARD.chaseSeconds;
    guard.chaseX = thief.x;
    guard.chaseY = thief.y;
    guard.alerted = true;
    return 'alert';
  }

  if (guard.state === GUARD_CHASE) {
    guard.stateSeconds -= dt;
    if (lockdown) {
      guard.chaseX = thief.x;
      guard.chaseY = thief.y;
    }
    stepToward(guard, guard.chaseX, guard.chaseY, GUARD.chaseSpeed * (lockdown ? 1.25 : 1), dt, solids);
    if (Math.hypot(thief.x - guard.x, thief.y - guard.y) < GUARD.catchDistance) return 'caught';
    if (guard.stateSeconds <= 0) {
      guard.state = GUARD_PATROL;
      guard.see = 0;
    }
    return null;
  }

  if (guard.state === GUARD_INVESTIGATE) {
    guard.stateSeconds -= dt;
    const arrived = stepToward(guard, guard.investigateX, guard.investigateY, GUARD.investigateSpeed, dt, solids);
    if (arrived || guard.stateSeconds <= 0) {
      guard.state = GUARD_PATROL;
      guard.stateSeconds = 0;
    }
    return null;
  }

  // Patrol: walk the loop, pausing a beat at each waypoint to look around.
  const target = guard.waypoints[guard.waypointIndex];
  const arrived = stepToward(guard, target.x, target.y, GUARD.patrolSpeed, dt, solids);
  if (arrived) {
    guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
  }
  return null;
}

/** Send a guard to look at a noise (a tossed coin landing). */
export function sendGuardToNoise(guard, x, y, hearingRange) {
  if (guard.state === GUARD_CHASE) return;
  if (Math.hypot(guard.x - x, guard.y - y) > hearingRange) return;
  guard.state = GUARD_INVESTIGATE;
  guard.investigateX = x;
  guard.investigateY = y;
  guard.stateSeconds = GUARD.investigateSeconds;
  guard.see = 0;
}
