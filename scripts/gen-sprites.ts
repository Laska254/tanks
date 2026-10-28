// Builds the sprite sheet: public/sprites.png, plus src/render/sprites.json
// mapping each frame name to its rectangle on the sheet. Run with `npm run sprites`.
// The same code always writes the same bytes, so both files are committed.
//
// Every frame is pixel art: one string per row, one PALETTE character per pixel.
// For now each frame is a placeholder box from placeholder(). Real art replaces
// a placeholder() call with a string array of the same size.
import { mkdirSync, writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import type { Direction } from '../src/sim/types/direction';
import type { EnemyType } from '../src/sim/types/enemy-type';

type Art = readonly string[];
type Rgba = readonly [r: number, g: number, b: number, a: number];

const PALETTE: Readonly<Record<string, Rgba>> = {
  '.': [0, 0, 0, 0], // transparent
  k: [0, 0, 0, 255], // outline, barrel
  w: [252, 252, 252, 255], // marks, font
  y: [232, 208, 32, 255], // player 1
  g: [0, 168, 68, 255], // player 2
  e: [188, 188, 188, 255], // enemy
  r: [216, 40, 0, 255], // bonus enemy
  A: [172, 124, 0, 255], // armor, 3 hits left
  B: [0, 136, 136, 255], // armor, 2 hits left
  C: [136, 20, 176, 255], // armor, 1 hit left
  b: [164, 68, 0, 255], // brick
  s: [124, 124, 124, 255], // steel
  u: [0, 88, 248, 255], // water
  t: [32, 80, 0, 255], // trees
  i: [200, 224, 248, 255], // ice
  h: [88, 88, 248, 255], // base
  d: [60, 60, 60, 255], // wreck
  o: [248, 120, 88, 255], // explosion
  c: [0, 232, 216, 255], // spawn, shield
  m: [216, 0, 204, 255], // power-up
};

const SHEET_WIDTH = 256;
const TILE = 8;
const TANK = 16;
const BIG_EXPLOSION = 32;
const TRACK_FRAMES = 2;
const STAR_LEVELS = 4;

const DIRECTIONS = ['up', 'right', 'down', 'left'] as const satisfies readonly Direction[];
const ENEMY_TYPES = ['basic', 'fast', 'power', 'armor'] as const satisfies readonly EnemyType[];
const ARMOR_DAMAGE = [
  ['hp3', 'A'],
  ['hp2', 'B'],
  ['hp1', 'C'],
] as const;
const POWER_UPS = ['helmet', 'clock', 'shovel', 'star', 'grenade', 'tank'] as const;
const FONT = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,:;!?-\'"/()';

interface Sprite {
  name: string;
  art: Art;
}

interface Marks {
  // Puts a barrel stub on this side.
  dir?: Direction;
  // Moves a dot along the top edge, so animations visibly cycle.
  frame?: number;
  // Draws this many dots along the bottom edge.
  level?: number;
}

// A box in `fill` with a dark outline. Marks tell directions and frames apart.
function placeholder(w: number, h: number, fill: string, { dir, frame, level }: Marks = {}): Art {
  const px = Array.from({ length: h }, (_, y) =>
    Array.from({ length: w }, (_, x) =>
      x === 0 || y === 0 || x === w - 1 || y === h - 1 ? 'k' : fill,
    ),
  );
  const set = (x: number, y: number, c: string) => {
    const row = px[y];
    if (row && x >= 0 && x < w) row[x] = c;
  };
  const [cx, cy] = [w / 2, h / 2];
  if (dir === 'up' || dir === 'down') {
    for (let y = dir === 'up' ? 0 : cy; y < (dir === 'up' ? cy : h); y++) set(cx - 1, y, 'k');
  } else if (dir) {
    for (let x = dir === 'left' ? 0 : cx; x < (dir === 'left' ? cx : w); x++) set(x, cy - 1, 'k');
  }
  if (frame !== undefined) set(2 + 2 * frame, 2, 'w');
  for (let i = 0; i < (level ?? 0); i++) set(2 + 2 * i, h - 3, 'w');
  return px.map((row) => row.join(''));
}

function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i);
}

function frames(prefix: string, count: number, art: (frame: number) => Art): Sprite[] {
  return range(count).map((frame) => ({ name: `${prefix}-${frame}`, art: art(frame) }));
}

function tank(prefix: string, fill: string, level?: number): Sprite[] {
  return DIRECTIONS.flatMap((dir) =>
    frames(`${prefix}-${dir}`, TRACK_FRAMES, (frame) =>
      placeholder(TANK, TANK, fill, { dir, frame, level }),
    ),
  );
}

const SPRITES: Sprite[] = [
  ...(['y', 'g'] as const).flatMap((fill, i) =>
    range(STAR_LEVELS).flatMap((level) => tank(`player${i + 1}-level${level}`, fill, level)),
  ),
  ...ENEMY_TYPES.flatMap((type) => [
    ...tank(`enemy-${type}`, 'e'),
    ...tank(`enemy-${type}-bonus`, 'r'),
  ]),
  ...ARMOR_DAMAGE.flatMap(([hp, fill]) => tank(`enemy-armor-${hp}`, fill)),
  { name: 'brick', art: placeholder(TILE, TILE, 'b') },
  { name: 'steel', art: placeholder(TILE, TILE, 's') },
  ...frames('water', 3, (frame) => placeholder(TILE, TILE, 'u', { frame })),
  { name: 'trees', art: placeholder(TILE, TILE, 't') },
  { name: 'ice', art: placeholder(TILE, TILE, 'i') },
  { name: 'base', art: placeholder(TANK, TANK, 'h') },
  { name: 'base-destroyed', art: placeholder(TANK, TANK, 'd') },
  ...DIRECTIONS.map((dir) => ({
    name: `bullet-${dir}`,
    art: dir === 'up' || dir === 'down' ? placeholder(3, 4, 'w') : placeholder(4, 3, 'w'),
  })),
  ...frames('explosion-small', 3, (frame) => placeholder(TANK, TANK, 'o', { frame })),
  ...frames('explosion-big', 2, (frame) =>
    placeholder(BIG_EXPLOSION, BIG_EXPLOSION, 'o', { frame }),
  ),
  ...frames('spawn', 4, (frame) => placeholder(TANK, TANK, 'c', { frame })),
  ...frames('shield', 2, (frame) => placeholder(TANK, TANK, 'c', { frame })),
  ...POWER_UPS.map((kind) => ({ name: `power-up-${kind}`, art: placeholder(TANK, TANK, 'm') })),
  { name: 'hud-enemy', art: placeholder(TILE, TILE, 'e') },
  { name: 'hud-life', art: placeholder(TILE, TILE, 'y') },
  { name: 'hud-flag', art: placeholder(TANK, TANK, 'r') },
  ...[...FONT].map((char) => ({ name: `font-${char}`, art: placeholder(TILE, TILE, 'w') })),
];

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

function size(sprite: Sprite): { w: number; h: number } {
  const w = sprite.art[0]?.length ?? 0;
  for (const [y, row] of sprite.art.entries()) {
    if (row.length !== w)
      throw new Error(`${sprite.name}: row ${y} is ${row.length} wide, expected ${w}`);
    for (const c of row)
      if (!(c in PALETTE)) throw new Error(`${sprite.name}: unknown colour '${c}'`);
  }
  return { w, h: sprite.art.length };
}

// Fills rows left to right in list order. Each row is as tall as its tallest frame.
function pack(sprites: Sprite[]): { rects: Map<string, Rect>; height: number } {
  const rects = new Map<string, Rect>();
  let [x, y, rowHeight] = [0, 0, 0];
  for (const sprite of sprites) {
    if (rects.has(sprite.name)) throw new Error(`${sprite.name}: duplicate name`);
    const { w, h } = size(sprite);
    if (x + w > SHEET_WIDTH) [x, y, rowHeight] = [0, y + rowHeight, 0];
    rects.set(sprite.name, { x, y, w, h });
    x += w;
    rowHeight = Math.max(rowHeight, h);
  }
  return { rects, height: y + rowHeight };
}

const { rects, height } = pack(SPRITES);
const png = new PNG({ width: SHEET_WIDTH, height });
for (const { name, art } of SPRITES) {
  const rect = rects.get(name)!;
  for (const [dy, row] of art.entries()) {
    for (const [dx, c] of [...row].entries()) {
      png.data.set(PALETTE[c]!, ((rect.y + dy) * SHEET_WIDTH + rect.x + dx) * 4);
    }
  }
}

// One frame per line, in the layout Prettier keeps.
const json = [...rects]
  .map(
    ([name, r]) =>
      `  ${JSON.stringify(name)}: { "x": ${r.x}, "y": ${r.y}, "w": ${r.w}, "h": ${r.h} }`,
  )
  .join(',\n');

for (const dir of ['../public/', '../src/render/']) {
  mkdirSync(new URL(dir, import.meta.url), { recursive: true });
}
writeFileSync(new URL('../public/sprites.png', import.meta.url), PNG.sync.write(png));
writeFileSync(new URL('../src/render/sprites.json', import.meta.url), `{\n${json}\n}\n`);
console.log(`Wrote ${rects.size} frames on a ${SHEET_WIDTH}×${height} sheet.`);
