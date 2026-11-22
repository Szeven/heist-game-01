// The Velvet Vault — render.js: everything the eye sees.
// One canvas, drawn in layers: marble floor and gold spotlights, walls and
// cover, the guards' and cameras' vision cones, the loot's glow, the thief
// and the guards, the smoke, then the HUD bar and the screen over it.
// The palette is a night museum: deep blue shadow, warm gold light, and red
// only where danger is — so safe cover, danger and loot read at a glance.
import { CAMERA, FIELD, GUARD, HUD_HEIGHT } from './config.js';
import { coneEdgePoints } from './vision.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_ROOM_CLEAR = 'room-clear';
export const SCREEN_WIN = 'win';
export const SCREEN_OVER = 'over';

const VIEW_WIDTH = FIELD.width;
const VIEW_HEIGHT = HUD_HEIGHT + FIELD.height;

const GOLD = '#e8b64c';
const GOLD_DIM = '#8a6d2f';
const INK = '#0b0e18';
const FLOOR_A = '#171b2b';
const FLOOR_B = '#1b2138';
const WALL = '#2b3150';
const WALL_EDGE = '#4a5480';
const CONE_GUARD = 'rgba(255, 190, 60, 0.20)';
const CONE_GUARD_HOT = 'rgba(255, 80, 40, 0.34)';
const CONE_CAMERA = 'rgba(255, 70, 70, 0.16)';
const CONE_CAMERA_HOT = 'rgba(255, 40, 40, 0.38)';

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  function resize() {
    const scale = Math.min(window.innerWidth / VIEW_WIDTH, window.innerHeight / VIEW_HEIGHT);
    canvas.width = Math.round(VIEW_WIDTH * scale);
    canvas.height = Math.round(VIEW_HEIGHT * scale);
  }
  resize();
  window.addEventListener('resize', resize);
  return {
    draw(view) {
      resize();
      const scale = canvas.width / VIEW_WIDTH;
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      drawScene(ctx, view);
    },
  };
}

function drawScene(ctx, view) {
  const { world } = view;
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  if (world) {
    drawFloor(ctx, world);
    drawCover(ctx, world);
    drawExit(ctx, world);
    drawLoot(ctx, world);
    drawCones(ctx, world);
    drawSmoke(ctx, world);
    drawGuards(ctx, world);
    drawThief(ctx, world);
    drawCoins(ctx, world);
  }
  drawHud(ctx, view);
  if (view.screen === SCREEN_TITLE) drawTitle(ctx, view);
  if (view.screen === SCREEN_PAUSED) drawPanel(ctx, 'PAUSED', 'P — resume · M — sound');
  if (view.screen === SCREEN_CAUGHT) drawPanel(ctx, 'CAUGHT!', view.caughtLine);
  if (view.screen === SCREEN_ROOM_CLEAR) drawPanel(ctx, 'ROOM CLEAR', view.clearLine);
  if (view.screen === SCREEN_WIN) drawWin(ctx, view);
  if (view.screen === SCREEN_OVER) drawPanel(ctx, 'THE GALLERY WINS', view.overLine);
  if (world && world.alarm.lockdown) {
    ctx.fillStyle = 'rgba(255, 30, 30, 0.08)';
    ctx.fillRect(0, HUD_HEIGHT, FIELD.width, FIELD.height);
  }
}

function drawFloor(ctx, world) {
  for (let ty = 0; ty < FIELD.height / 48; ty += 1) {
    for (let tx = 0; tx < FIELD.width / 48; tx += 1) {
      ctx.fillStyle = (tx + ty) % 2 === 0 ? FLOOR_A : FLOOR_B;
      ctx.fillRect(tx * 48, HUD_HEIGHT + ty * 48, 48, 48);
    }
  }
  // Warm pools of light where the loot sits.
  for (const piece of world.pieces) {
    if (piece.taken) continue;
    const glow = ctx.createRadialGradient(piece.x, HUD_HEIGHT + piece.y, 4, piece.x, HUD_HEIGHT + piece.y, 90);
    glow.addColorStop(0, 'rgba(232, 182, 76, 0.28)');
    glow.addColorStop(1, 'rgba(232, 182, 76, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(piece.x - 90, HUD_HEIGHT + piece.y - 90, 180, 180);
  }
  for (const wall of world.level.walls) {
    ctx.fillStyle = WALL;
    ctx.fillRect(wall.x, HUD_HEIGHT + wall.y, wall.w, wall.h);
    ctx.fillStyle = WALL_EDGE;
    ctx.fillRect(wall.x, HUD_HEIGHT + wall.y, wall.w, 2);
  }
}

function drawCover(ctx, world) {
  for (const rect of world.level.cover) {
    const y = HUD_HEIGHT + rect.y;
    if (rect.kind === 'case') {
      ctx.fillStyle = '#232a4a';
      ctx.fillRect(rect.x, y, rect.w, rect.h);
      ctx.strokeStyle = GOLD_DIM;
      ctx.lineWidth = 3;
      ctx.strokeRect(rect.x + 2, y + 2, rect.w - 4, rect.h - 4);
      ctx.fillStyle = '#3d4a7a';
      ctx.fillRect(rect.x + rect.w / 2 - 14, y + 12, 28, rect.h - 24);
      ctx.fillStyle = '#7d8fc9';
      ctx.fillRect(rect.x + rect.w / 2 - 8, y + 18, 16, rect.h - 36);
    } else if (rect.kind === 'pillar') {
      ctx.fillStyle = '#39406a';
      ctx.beginPath();
      ctx.arc(rect.x + rect.w / 2, y + rect.h / 2, rect.w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#565e94';
      ctx.beginPath();
      ctx.arc(rect.x + rect.w / 2 - 4, y + rect.h / 2 - 4, rect.w / 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Velvet rope: low, blocks feet, never sight.
      ctx.strokeStyle = '#a1233a';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(rect.x, y + rect.h / 2);
      ctx.quadraticCurveTo(rect.x + rect.w / 2, y + rect.h / 2 + 8, rect.x + rect.w, y + rect.h / 2);
      ctx.stroke();
      ctx.fillStyle = GOLD;
      ctx.beginPath();
      ctx.arc(rect.x, y + rect.h / 2, 4, 0, Math.PI * 2);
      ctx.arc(rect.x + rect.w, y + rect.h / 2, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawExit(ctx, world) {
  const exit = world.level.exit;
  const y = HUD_HEIGHT + exit.y;
  ctx.fillStyle = world.exitOpen ? '#1f7a44' : '#5a1f28';
  ctx.fillRect(exit.x, y, exit.w, exit.h);
  ctx.fillStyle = world.exitOpen ? '#7dffa8' : '#ff8a7a';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(world.exitOpen ? 'EXIT' : 'LOCKED', exit.x + exit.w / 2, y + exit.h / 2);
  if (world.exitOpen) {
    ctx.strokeStyle = 'rgba(125, 255, 168, 0.7)';
    ctx.lineWidth = 2;
    ctx.strokeRect(exit.x - 4, y - 4, exit.w + 8, exit.h + 8);
  }
}

function drawLoot(ctx, world) {
  for (const piece of world.pieces) {
    if (piece.taken) continue;
    const y = HUD_HEIGHT + piece.y;
    const pulse = 1 + Math.sin(world.elapsed * 3 + piece.x) * 0.08;
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.arc(piece.x, y, (piece.isTarget ? 13 : 9) * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    ctx.arc(piece.x - 3, y - 3, 3.5, 0, Math.PI * 2);
    ctx.fill();
    if (piece.isTarget) {
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(piece.x, y, 20 * pulse, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = '#f5d98a';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(piece.label, piece.x, y - (piece.isTarget ? 26 : 18));
  }
}

function drawCone(ctx, x, y, facing, halfAngle, range, fill, edge) {
  const [a, b] = coneEdgePoints(x, y, facing, halfAngle, range);
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(a.x, a.y);
  ctx.arc(x, y, range, facing - halfAngle, facing + halfAngle);
  ctx.lineTo(b.x, b.y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawCones(ctx, world) {
  for (const camera of world.cameras) {
    drawCone(
      ctx, camera.x, HUD_HEIGHT + camera.y, camera.facing, CAMERA.visionHalfAngle, CAMERA.visionRange,
      camera.seeing ? CONE_CAMERA_HOT : CONE_CAMERA, 'rgba(255, 90, 90, 0.45)',
    );
    ctx.fillStyle = '#3a3f5e';
    ctx.fillRect(camera.x - 8, HUD_HEIGHT + camera.y - 6, 16, 12);
    ctx.fillStyle = camera.seeing ? '#ff4040' : '#ff7070';
    ctx.beginPath();
    ctx.arc(camera.x, HUD_HEIGHT + camera.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const guard of world.guards) {
    const hot = guard.see > 0.05 || guard.state === 'chase';
    drawCone(
      ctx, guard.x, HUD_HEIGHT + guard.y, guard.facing, GUARD.visionHalfAngle, GUARD.visionRange,
      hot ? CONE_GUARD_HOT : CONE_GUARD, 'rgba(255, 190, 60, 0.5)',
    );
  }
}

function drawSmoke(ctx, world) {
  for (const smoke of world.smokes) {
    const fade = Math.min(1, smoke.seconds / 1.2);
    ctx.fillStyle = `rgba(180, 190, 210, ${0.34 * fade})`;
    ctx.beginPath();
    ctx.arc(smoke.x, HUD_HEIGHT + smoke.y, smoke.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(220, 228, 240, ${0.22 * fade})`;
    ctx.beginPath();
    ctx.arc(smoke.x - 18, HUD_HEIGHT + smoke.y + 10, smoke.radius * 0.55, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGuards(ctx, world) {
  for (const guard of world.guards) {
    const y = HUD_HEIGHT + guard.y;
    ctx.fillStyle = '#232a4a';
    ctx.beginPath();
    ctx.arc(guard.x, y, GUARD.radius + 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = guard.state === 'chase' ? '#c93a2e' : '#31406e';
    ctx.beginPath();
    ctx.arc(guard.x, y, GUARD.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(guard.x, y);
    ctx.lineTo(guard.x + Math.cos(guard.facing) * (GUARD.radius + 5), y + Math.sin(guard.facing) * (GUARD.radius + 5));
    ctx.stroke();
    if (guard.see > 0.35) {
      ctx.fillStyle = guard.see >= 1 ? '#ff5040' : '#ffd34c';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(guard.see >= 1 ? '!' : '?', guard.x, y - GUARD.radius - 6);
    }
  }
}

function drawThief(ctx, world) {
  const thief = world.thief;
  const y = HUD_HEIGHT + thief.y;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(thief.x, y + 10, 11, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0f766e';
  ctx.beginPath();
  ctx.arc(thief.x, y, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2dd4bf';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(thief.x, y, 11, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(thief.x, y);
  ctx.lineTo(thief.x + Math.cos(thief.facing) * 15, y + Math.sin(thief.facing) * 15);
  ctx.stroke();
  if (thief.grabTarget) {
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(thief.x, y, 17, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * thief.grabProgress);
    ctx.stroke();
  }
}

function drawCoins(ctx, world) {
  for (const coin of world.coinsInFlight) {
    const t = 1 - coin.seconds / 0.45;
    const x = coin.fromX + (coin.x - coin.fromX) * t;
    const y = HUD_HEIGHT + coin.fromY + (coin.y - coin.fromY) * t - Math.sin(t * Math.PI) * 22;
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHud(ctx, view) {
  ctx.fillStyle = '#10142a';
  ctx.fillRect(0, 0, VIEW_WIDTH, HUD_HEIGHT);
  ctx.fillStyle = '#2b3150';
  ctx.fillRect(0, HUD_HEIGHT - 2, VIEW_WIDTH, 2);
  const world = view.world;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#e8e4d8';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(world ? world.level.name : 'The Velvet Vault', 14, 18);
  ctx.fillStyle = '#9aa3c7';
  ctx.font = '12px sans-serif';
  ctx.fillText(world && world.targetTaken ? 'Target lifted — reach the EXIT' : world ? `Lift: ${world.target.label}` : '', 14, 38);

  // Alarm meter, centre.
  const alarm = world ? world.alarm.value : 0;
  const meterX = 330;
  const meterW = 300;
  ctx.fillStyle = '#9aa3c7';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ALARM', meterX, 18);
  ctx.fillStyle = '#1a1f38';
  ctx.fillRect(meterX + 58, 10, meterW, 16);
  const alarmColor = world && world.alarm.lockdown ? '#ff2e2e' : alarm > 66 ? '#ff5a3c' : alarm > 33 ? '#ffb13c' : '#37c978';
  ctx.fillStyle = alarmColor;
  ctx.fillRect(meterX + 58, 10, Math.max(0, (meterW * alarm) / 100), 16);
  ctx.strokeStyle = '#4a5480';
  ctx.lineWidth = 1;
  ctx.strokeRect(meterX + 58, 10, meterW, 16);
  ctx.fillStyle = world && world.alarm.lockdown ? '#ff6b6b' : '#9aa3c7';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText(world && world.alarm.lockdown ? 'LOCKDOWN!' : `${Math.round(alarm)}%`, meterX + 58, 38);

  // Right side: loot, coins, smoke, lives, time.
  ctx.textAlign = 'right';
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(`$${(view.totalScore + (world ? world.roomScore : 0)).toLocaleString('en-US')}`, 946, 18);
  ctx.fillStyle = '#e8e4d8';
  ctx.font = '12px sans-serif';
  const tools = world ? `coins ${world.thief.coins} · smoke ${world.thief.smoke} · lives ${'◆'.repeat(view.lives)}${'◇'.repeat(Math.max(0, 3 - view.lives))}` : '';
  ctx.fillText(tools, 946, 38);
  ctx.textAlign = 'left';
  if (world) {
    ctx.fillStyle = '#9aa3c7';
    ctx.font = '12px sans-serif';
    ctx.fillText(`${Math.floor(world.elapsed / 60)}:${String(Math.floor(world.elapsed % 60)).padStart(2, '0')}`, meterX + 58 + meterW + 16, 18);
  }
}

function drawPanel(ctx, title, line) {
  ctx.fillStyle = 'rgba(8, 10, 22, 0.72)';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  ctx.fillStyle = '#e8e4d8';
  ctx.font = 'bold 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, VIEW_WIDTH / 2, VIEW_HEIGHT / 2 - 30);
  ctx.fillStyle = '#c8cde6';
  ctx.font = '16px sans-serif';
  ctx.fillText(line || '', VIEW_WIDTH / 2, VIEW_HEIGHT / 2 + 12);
  ctx.fillStyle = '#9aa3c7';
  ctx.font = '14px sans-serif';
  ctx.fillText('Space / click — continue', VIEW_WIDTH / 2, VIEW_HEIGHT / 2 + 44);
}

function drawTitle(ctx, view) {
  ctx.fillStyle = 'rgba(8, 10, 22, 0.78)';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 54px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('THE VELVET VAULT', VIEW_WIDTH / 2, 190);
  ctx.fillStyle = '#e8e4d8';
  ctx.font = '18px sans-serif';
  ctx.fillText('A midnight heist in the Marlow Gallery', VIEW_WIDTH / 2, 228);
  ctx.fillStyle = '#c8cde6';
  ctx.font = '15px sans-serif';
  ctx.fillText('WASD / arrows — move · click — toss a coin · Q — smoke · E / Space — lift loot', VIEW_WIDTH / 2, 300);
  ctx.fillText('Slip past the guards and their cones. Dodge the cameras. Lift the target,', VIEW_WIDTH / 2, 326);
  ctx.fillText('then reach the glowing EXIT before the alarm fills.', VIEW_WIDTH / 2, 348);
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('Press Space or click to begin', VIEW_WIDTH / 2, 412);
  if (view.best > 0) {
    ctx.fillStyle = '#9aa3c7';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Best getaway: $${view.best.toLocaleString('en-US')}`, VIEW_WIDTH / 2, 448);
  }
}

function drawWin(ctx, view) {
  ctx.fillStyle = 'rgba(8, 10, 22, 0.8)';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 44px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('THE GETAWAY', VIEW_WIDTH / 2, 170);
  ctx.fillStyle = '#e8e4d8';
  ctx.font = '18px sans-serif';
  ctx.fillText('The Starlight Opal is yours. The Marlow never knew you were there.', VIEW_WIDTH / 2, 210);
  ctx.font = '16px sans-serif';
  const rows = view.winRows || [];
  rows.forEach((row, index) => {
    ctx.fillText(row, VIEW_WIDTH / 2, 268 + index * 28);
  });
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(`$${view.finalScore.toLocaleString('en-US')}`, VIEW_WIDTH / 2, 268 + rows.length * 28 + 18);
  ctx.fillStyle = '#9aa3c7';
  ctx.font = '14px sans-serif';
  ctx.fillText('Space / click — play again', VIEW_WIDTH / 2, 268 + rows.length * 28 + 52);
}
