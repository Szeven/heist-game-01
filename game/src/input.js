// The Velvet Vault — input.js: keyboard and mouse.
// WASD or the arrow keys steer the thief; a mouse click tosses a coin at
// that spot on the floor; Q drops smoke; E or Space held lifts loot; Space
// or Enter confirms on the title and end screens; P pauses; M mutes.
import { FIELD, HUD_HEIGHT } from './config.js';

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_SMOKE = 4;
export const ACTION_MUTE = 8;

const MOVE_KEYS = {
  KeyW: { x: 0, y: -1 },
  ArrowUp: { x: 0, y: -1 },
  KeyA: { x: -1, y: 0 },
  ArrowLeft: { x: -1, y: 0 },
  KeyS: { x: 0, y: 1 },
  ArrowDown: { x: 0, y: 1 },
  KeyD: { x: 1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
};

export function createInput(canvas) {
  const held = new Set();
  let actions = 0;
  const clicks = [];

  function toField(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * FIELD.width;
    const y = ((clientY - rect.top) / rect.height) * (HUD_HEIGHT + FIELD.height) - HUD_HEIGHT;
    return { x, y };
  }

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    held.add(event.code);
    if (event.code === 'Space' || event.code === 'Enter') {
      actions |= ACTION_CONFIRM;
      event.preventDefault();
    } else if (event.code === 'KeyP' || event.code === 'Escape') {
      actions |= ACTION_PAUSE;
    } else if (event.code === 'KeyQ') {
      actions |= ACTION_SMOKE;
    } else if (event.code === 'KeyM') {
      actions |= ACTION_MUTE;
    }
  });
  window.addEventListener('keyup', (event) => {
    held.delete(event.code);
  });
  canvas.addEventListener('mousedown', (event) => {
    if (event.button === 0) clicks.push(toField(event.clientX, event.clientY));
    else if (event.button === 2) actions |= ACTION_SMOKE;
  });
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());
  window.addEventListener('blur', () => held.clear());

  return {
    /** Normalised move vector from the keys held this frame. */
    direction() {
      let x = 0;
      let y = 0;
      for (const code of held) {
        const vector = MOVE_KEYS[code];
        if (vector) {
          x += vector.x;
          y += vector.y;
        }
      }
      const length = Math.hypot(x, y);
      return length === 0 ? { x: 0, y: 0 } : { x: x / length, y: y / length };
    },
    /** True while the grab key (E or Space) is held down. */
    grabbing() {
      return held.has('KeyE') || held.has('Space');
    },
    /** One-shot actions since the last call, as a bit mask. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    /** Floor points clicked since the last call, oldest first. */
    takeClicks() {
      return clicks.splice(0, clicks.length);
    },
  };
}
