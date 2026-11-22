// The Velvet Vault — cameras.js: the wall-mounted security cameras.
// A camera sits still and sweeps its cone back and forth around its base
// angle. While the thief stands inside the cone with a clear line of sight,
// the camera feeds the alarm meter.
import { CAMERA } from './config.js';
import { hasLineOfSight, insideCone } from './vision.js';

export function createCamera(definition, random) {
  return {
    x: definition.x,
    y: definition.y,
    baseAngle: definition.baseAngle,
    sweep: definition.sweep,
    phase: (random ? random() : Math.random()) * Math.PI * 2,
    facing: definition.baseAngle,
    seeing: false,
  };
}

/** Sweep the cone; returns true while the camera has the thief in frame. */
export function stepCamera(camera, dt, thief, sightBlockers, smokes, elapsed) {
  camera.facing = camera.baseAngle + Math.sin(elapsed / CAMERA.sweepSeconds + camera.phase) * camera.sweep;
  camera.seeing =
    insideCone(camera.x, camera.y, camera.facing, CAMERA.visionHalfAngle, CAMERA.visionRange, thief.x, thief.y) &&
    hasLineOfSight(camera.x, camera.y, thief.x, thief.y, sightBlockers, smokes);
  return camera.seeing;
}
