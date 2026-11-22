// The Velvet Vault — levels.js: the three rooms of the Marlow Gallery.
// Each room is one burglary: a walled floor with display cases and pillars
// (block sight and movement), velvet ropes (block movement only, never sight),
// side loot, one target piece, guards on patrol loops, sweeping cameras, a
// spawn point and a getaway door that opens once the target is lifted.
//
// Kinds: 'wall' and 'case' and 'pillar' block sight; 'rope' does not.
export const LEVELS = [
  {
    name: 'Room 1 — The Grand Hall',
    target: { x: 852, y: 92, label: 'Moonlit Portrait', value: 500 },
    spawn: { x: 48, y: 604 },
    exit: { x: 872, y: 28, w: 56, h: 26 },
    parSeconds: 75,
    walls: [
      { x: 0, y: 0, w: 960, h: 24 },
      { x: 0, y: 616, w: 960, h: 24 },
      { x: 0, y: 0, w: 24, h: 640 },
      { x: 936, y: 0, w: 24, h: 640 },
    ],
    cover: [
      { kind: 'case', x: 300, y: 180, w: 120, h: 70 },
      { kind: 'case', x: 540, y: 380, w: 120, h: 70 },
      { kind: 'pillar', x: 462, y: 282, w: 36, h: 36 },
      { kind: 'rope', x: 200, y: 420, w: 160, h: 10 },
      { kind: 'rope', x: 600, y: 150, w: 160, h: 10 },
    ],
    loot: [
      { x: 140, y: 520, label: 'Gold Vase', value: 150 },
      { x: 830, y: 540, label: 'Jade Statue', value: 250 },
    ],
    guards: [
      { waypoints: [{ x: 200, y: 150 }, { x: 700, y: 150 }, { x: 700, y: 480 }, { x: 200, y: 480 }] },
      { waypoints: [{ x: 760, y: 360 }, { x: 760, y: 540 }, { x: 420, y: 540 }, { x: 420, y: 360 }] },
    ],
    cameras: [{ x: 480, y: 26, baseAngle: Math.PI / 2, sweep: 0.85 }],
  },
  {
    name: 'Room 2 — The Gilded Corridor',
    target: { x: 480, y: 82, label: 'The Gilded Idol', value: 600 },
    spawn: { x: 80, y: 580 },
    exit: { x: 880, y: 28, w: 56, h: 26 },
    parSeconds: 90,
    walls: [
      { x: 0, y: 0, w: 960, h: 24 },
      { x: 0, y: 616, w: 960, h: 24 },
      { x: 0, y: 0, w: 24, h: 640 },
      { x: 936, y: 0, w: 24, h: 640 },
      { x: 480, y: 24, w: 20, h: 180 },
      { x: 480, y: 436, w: 20, h: 180 },
    ],
    cover: [
      { kind: 'case', x: 180, y: 140, w: 110, h: 60 },
      { kind: 'case', x: 670, y: 140, w: 110, h: 60 },
      { kind: 'case', x: 180, y: 440, w: 110, h: 60 },
      { kind: 'case', x: 670, y: 440, w: 110, h: 60 },
      { kind: 'pillar', x: 330, y: 300, w: 32, h: 32 },
      { kind: 'pillar', x: 600, y: 300, w: 32, h: 32 },
      { kind: 'rope', x: 330, y: 180, w: 140, h: 10 },
      { kind: 'rope', x: 490, y: 450, w: 140, h: 10 },
    ],
    loot: [
      { x: 120, y: 320, label: 'Silver Mirror', value: 200 },
      { x: 840, y: 320, label: 'Ruby Tiara', value: 300 },
    ],
    guards: [
      { waypoints: [{ x: 120, y: 90 }, { x: 430, y: 90 }, { x: 430, y: 260 }, { x: 120, y: 260 }] },
      { waypoints: [{ x: 530, y: 90 }, { x: 840, y: 90 }, { x: 840, y: 260 }, { x: 530, y: 260 }] },
      { waypoints: [{ x: 480, y: 240 }, { x: 480, y: 400 }, { x: 700, y: 400 }, { x: 700, y: 240 }] },
    ],
    cameras: [
      { x: 60, y: 26, baseAngle: Math.PI / 3, sweep: 0.7 },
      { x: 900, y: 614, baseAngle: -Math.PI * 0.65, sweep: 0.7 },
    ],
  },
  {
    name: 'Room 3 — The Vault',
    target: { x: 480, y: 310, label: 'The Starlight Opal', value: 1000 },
    spawn: { x: 80, y: 580 },
    exit: { x: 440, y: 600, w: 80, h: 40 },
    parSeconds: 110,
    walls: [
      { x: 0, y: 0, w: 960, h: 24 },
      { x: 0, y: 616, w: 960, h: 24 },
      { x: 0, y: 0, w: 24, h: 640 },
      { x: 936, y: 0, w: 24, h: 640 },
      { x: 380, y: 220, w: 70, h: 20 },
      { x: 510, y: 220, w: 70, h: 20 },
      { x: 380, y: 400, w: 70, h: 20 },
      { x: 510, y: 400, w: 70, h: 20 },
      { x: 380, y: 220, w: 20, h: 200 },
      { x: 560, y: 220, w: 20, h: 200 },
    ],
    cover: [
      { kind: 'case', x: 150, y: 150, w: 110, h: 60 },
      { kind: 'case', x: 700, y: 150, w: 110, h: 60 },
      { kind: 'case', x: 150, y: 430, w: 110, h: 60 },
      { kind: 'case', x: 700, y: 430, w: 110, h: 60 },
      { kind: 'pillar', x: 300, y: 320, w: 32, h: 32 },
      { kind: 'pillar', x: 628, y: 320, w: 32, h: 32 },
      { kind: 'rope', x: 250, y: 220, w: 120, h: 10 },
      { kind: 'rope', x: 590, y: 400, w: 120, h: 10 },
    ],
    loot: [
      { x: 120, y: 90, label: 'Emerald Brooch', value: 400 },
      { x: 840, y: 550, label: 'Sapphire Ring', value: 350 },
    ],
    guards: [
      { waypoints: [{ x: 300, y: 150 }, { x: 660, y: 150 }] },
      { waypoints: [{ x: 300, y: 490 }, { x: 660, y: 490 }] },
      { waypoints: [{ x: 850, y: 180 }, { x: 850, y: 460 }] },
    ],
    cameras: [
      { x: 480, y: 26, baseAngle: Math.PI / 2, sweep: 0.9 },
      { x: 934, y: 320, baseAngle: Math.PI, sweep: 0.7 },
    ],
  },
];
