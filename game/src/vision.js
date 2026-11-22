// The Velvet Vault — vision.js: what a guard or a camera can see.
// A cone is a position, a facing angle, a half-angle and a range. A thief is
// seen when inside the cone, close enough, and the straight line from the eye
// to the thief crosses no wall, display case or pillar (velvet ropes are low:
// they block movement, never sight). Smoke clouds block sight too.
export function angleTo(fromX, fromY, toX, toY) {
  return Math.atan2(toY - fromY, toX - fromX);
}

function angleDifference(a, b) {
  let diff = a - b;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return diff;
}

/** True when (x, y) lies inside the cone (range and half-angle included). */
export function insideCone(eyeX, eyeY, facing, halfAngle, range, x, y) {
  const dx = x - eyeX;
  const dy = y - eyeY;
  const distance = Math.hypot(dx, dy);
  if (distance > range) return false;
  if (distance < 1) return true;
  return Math.abs(angleDifference(Math.atan2(dy, dx), facing)) <= halfAngle;
}

function segmentsCross(ax, ay, bx, by, cx, cy, dx, dy) {
  const d1 = (dx - cx) * (ay - cy) - (dy - cy) * (ax - cx);
  const d2 = (dx - cx) * (by - cy) - (dy - cy) * (bx - cx);
  const d3 = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  const d4 = (bx - ax) * (dy - ay) - (by - ay) * (dx - ax);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

function segmentHitsRect(x1, y1, x2, y2, rect) {
  if (x1 > rect.x && x1 < rect.x + rect.w && y1 > rect.y && y1 < rect.y + rect.h) return true;
  if (x2 > rect.x && x2 < rect.x + rect.w && y2 > rect.y && y2 < rect.y + rect.h) return true;
  const left = rect.x;
  const right = rect.x + rect.w;
  const top = rect.y;
  const bottom = rect.y + rect.h;
  return (
    segmentsCross(x1, y1, x2, y2, left, top, right, top) ||
    segmentsCross(x1, y1, x2, y2, right, top, right, bottom) ||
    segmentsCross(x1, y1, x2, y2, right, bottom, left, bottom) ||
    segmentsCross(x1, y1, x2, y2, left, bottom, left, top)
  );
}

/**
 * True when the line from (x1, y1) to (x2, y2) is clear: it crosses no
 * sight-blocking rectangle in `blockers` and stays out of every smoke cloud.
 */
export function hasLineOfSight(x1, y1, x2, y2, blockers, smokes) {
  for (const rect of blockers) {
    if (segmentHitsRect(x1, y1, x2, y2, rect)) return false;
  }
  for (const smoke of smokes) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSq = dx * dx + dy * dy;
    let t = lengthSq === 0 ? 0 : ((smoke.x - x1) * dx + (smoke.y - y1) * dy) / lengthSq;
    t = Math.max(0, Math.min(1, t));
    const closestX = x1 + dx * t;
    const closestY = y1 + dy * t;
    if (Math.hypot(smoke.x - closestX, smoke.y - closestY) < smoke.radius) return false;
  }
  return true;
}

/** The cone's far edge as two points, for drawing the sweep on the floor. */
export function coneEdgePoints(eyeX, eyeY, facing, halfAngle, range) {
  return [
    { x: eyeX + Math.cos(facing - halfAngle) * range, y: eyeY + Math.sin(facing - halfAngle) * range },
    { x: eyeX + Math.cos(facing + halfAngle) * range, y: eyeY + Math.sin(facing + halfAngle) * range },
  ];
}
