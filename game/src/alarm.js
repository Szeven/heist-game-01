// The Velvet Vault — alarm.js: the meter over the door.
// The alarm climbs while a camera holds the thief in frame, jumps when a
// guard sounds off, and drains while nobody sees her. At full it trips a
// lockdown: every guard runs for her, the room burns red, and when it passes
// the meter falls back to a wary half.
import { ALARM, CAMERA } from './config.js';

export function createAlarm() {
  return { value: 0, lockdown: false, lockdownSeconds: 0, maxValue: 0, lockdowns: 0 };
}

/**
 * Advance the meter. `cameraSeeing` counts the cameras on her this step,
 * `alerts` counts the guards who sounded off this step. Returns 'lockdown'
 * the moment the meter trips, or null.
 */
export function stepAlarm(alarm, dt, cameraSeeing, alerts) {
  if (alarm.lockdown) {
    alarm.lockdownSeconds -= dt;
    if (alarm.lockdownSeconds <= 0) {
      alarm.lockdown = false;
      alarm.value = ALARM.lockdownDropTo;
    }
    return null;
  }
  alarm.value += cameraSeeing * CAMERA.alarmPerSecond * dt;
  alarm.value += alerts * ALARM.alertBump;
  if (cameraSeeing === 0 && alerts === 0) {
    alarm.value = Math.max(0, alarm.value - ALARM.decayPerSecond * dt);
  }
  alarm.value = Math.min(ALARM.lockdownAt, alarm.value);
  alarm.maxValue = Math.max(alarm.maxValue, alarm.value);
  if (alarm.value >= ALARM.lockdownAt) {
    alarm.lockdown = true;
    alarm.lockdownSeconds = ALARM.lockdownSeconds;
    alarm.lockdowns += 1;
    return 'lockdown';
  }
  return null;
}
