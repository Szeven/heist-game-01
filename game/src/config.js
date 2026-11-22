// The Velvet Vault — config.js: every number the game tunes by, in one place.
// Field is the room's logical size in pixels; the renderer scales it to the
// window. STEP is the fixed simulation step (1/60 s).
export const FIELD = { width: 960, height: 640 };
export const HUD_HEIGHT = 56;
export const STEP = 1 / 60;
export const BEST_KEY = 'velvet-vault-best';

export const THIEF = { radius: 11, speed: 158, grabRange: 36, grabSeconds: 0.6 };
export const GUARD = {
  radius: 12,
  patrolSpeed: 56,
  chaseSpeed: 138,
  investigateSpeed: 84,
  visionRange: 192,
  visionHalfAngle: 0.62,
  catchDistance: 20,
  seeRate: 1.5,
  seeDecay: 2.2,
  chaseSeconds: 3.5,
  investigateSeconds: 4,
};
export const CAMERA = {
  radius: 10,
  visionRange: 252,
  visionHalfAngle: 0.5,
  alarmPerSecond: 22,
  sweepSeconds: 3.2,
};
export const ALARM = {
  alertBump: 30,
  decayPerSecond: 7,
  lockdownAt: 100,
  lockdownSeconds: 5,
  lockdownDropTo: 55,
};
export const TOOLS = {
  coinsPerLevel: 5,
  coinRange: 340,
  coinHearing: 290,
  smokePerLevel: 2,
  smokeRadius: 96,
  smokeSeconds: 4,
};
export const LIVES = 3;
export const RATINGS = { ghost: 500, shadow: 250, loud: 0 };
