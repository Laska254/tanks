import type { EnemyType } from './types/enemy-type';
import type { Stage } from './types/stage';
import type { Tile } from './types/terrain';

// A stage is a square grid of 8 px tiles, the original's quarter-block size.
export const STAGE_SIZE = 26;
export const WAVE_SIZE = 20;

// Tile positions of the top-left corner of each 2×2-tile area that is the
// same on every stage (DESIGN.md §4).
export const BASE_TILE = { x: 12, y: 24 } as const;
export const ENEMY_SPAWN_TILES = [
  { x: 0, y: 0 },
  { x: 12, y: 0 },
  { x: 24, y: 0 },
] as const;
// In `World.players` order.
export const PLAYER_SPAWN_TILES = [
  { x: 8, y: 24 },
  { x: 16, y: 24 },
] as const;

// The brick wall round the base: the row above it and a column on each side.
const WALL_TILES = [
  ...[-1, 0, 1, 2].map((dx) => ({ x: BASE_TILE.x + dx, y: BASE_TILE.y - 1 })),
  ...[0, 1].flatMap((dy) => [
    { x: BASE_TILE.x - 1, y: BASE_TILE.y + dy },
    { x: BASE_TILE.x + 2, y: BASE_TILE.y + dy },
  ]),
];

const TILES = new Map<string, Tile>([
  ['.', 'empty'],
  ['B', 'brick'],
  ['S', 'steel'],
  ['W', 'water'],
  ['T', 'trees'],
  ['I', 'ice'],
]);

const ENEMIES = new Map<string, EnemyType>([
  ['b', 'basic'],
  ['f', 'fast'],
  ['p', 'power'],
  ['a', 'armor'],
]);

const ENEMIES_PREFIX = 'enemies: ';

interface Area {
  name: string;
  tiles: readonly { x: number; y: number }[];
  char: '.' | 'B';
}

function square({ x, y }: { x: number; y: number }) {
  return [
    { x, y },
    { x: x + 1, y },
    { x, y: y + 1 },
    { x: x + 1, y: y + 1 },
  ];
}

const FIXED_AREAS: Area[] = [
  { name: 'the base', tiles: square(BASE_TILE), char: '.' },
  { name: "the base's wall", tiles: WALL_TILES, char: 'B' },
  { name: 'the top-left enemy spawn', tiles: square(ENEMY_SPAWN_TILES[0]), char: '.' },
  { name: 'the top-centre enemy spawn', tiles: square(ENEMY_SPAWN_TILES[1]), char: '.' },
  { name: 'the top-right enemy spawn', tiles: square(ENEMY_SPAWN_TILES[2]), char: '.' },
  { name: "P1's spawn", tiles: square(PLAYER_SPAWN_TILES[0]), char: '.' },
  { name: "P2's spawn", tiles: square(PLAYER_SPAWN_TILES[1]), char: '.' },
];

// Lines and columns count from 1, as in an editor.
function fail(line: number, column: number, message: string): never {
  throw new Error(`line ${line}, column ${column}: ${message}`);
}

// Reads a stage file (stages/README.md). Throws on the first mistake, saying
// where it is.
export function parseStage(text: string): Stage {
  // Some Windows editors start the file with a byte order mark.
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/);
  while (lines.at(-1) === '') lines.pop();

  const grid = lines.slice(0, STAGE_SIZE);
  const tiles: Tile[] = [];
  for (let y = 0; y < STAGE_SIZE; y++) {
    const row = grid[y];
    if (row === undefined || row.startsWith(ENEMIES_PREFIX)) {
      fail(y + 1, 1, `expected ${STAGE_SIZE} grid lines, found ${y}`);
    }
    if (row.length !== STAGE_SIZE) {
      const column = Math.min(row.length, STAGE_SIZE) + 1;
      fail(y + 1, column, `expected ${STAGE_SIZE} characters, found ${row.length}`);
    }
    for (let x = 0; x < STAGE_SIZE; x++) {
      const char = row[x]!;
      const tile = TILES.get(char);
      if (tile === undefined) fail(y + 1, x + 1, `unknown tile '${char}'`);
      tiles.push(tile);
    }
  }

  for (const { name, tiles: areaTiles, char } of FIXED_AREAS) {
    for (const { x, y } of areaTiles) {
      const found = grid[y]![x]!;
      if (found !== char) fail(y + 1, x + 1, `${name} must be '${char}', found '${found}'`);
    }
  }

  const waveLine = STAGE_SIZE + 1;
  const wave = lines[STAGE_SIZE];
  if (wave === undefined || !wave.startsWith(ENEMIES_PREFIX)) {
    fail(waveLine, 1, `expected '${ENEMIES_PREFIX}' after the grid`);
  }
  const codes = wave.slice(ENEMIES_PREFIX.length);
  const enemies = [...codes].map((code, i) => {
    const enemy = ENEMIES.get(code);
    if (enemy === undefined) {
      fail(waveLine, ENEMIES_PREFIX.length + i + 1, `unknown enemy '${code}'`);
    }
    return enemy;
  });
  if (enemies.length !== WAVE_SIZE) {
    const column = ENEMIES_PREFIX.length + Math.min(enemies.length, WAVE_SIZE) + 1;
    fail(waveLine, column, `expected ${WAVE_SIZE} enemies, found ${enemies.length}`);
  }

  const extra = lines.findIndex((line, i) => i > STAGE_SIZE && line !== '');
  if (extra !== -1) fail(extra + 1, 1, 'unexpected line after the enemies');

  return { terrain: { width: STAGE_SIZE, height: STAGE_SIZE, tiles }, enemies };
}
