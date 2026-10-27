import { seedRng, type RngState } from './rng';

export const TICKS_PER_SECOND = 60;

// Positions and speeds are whole numbers of sub-pixel units, 16 to a screen
// pixel. Speeds slower than a pixel per tick stay exact without fractions.
export const UNITS_PER_PIXEL = 16;

export type Direction = 'up' | 'down' | 'left' | 'right';

export type Tile = 'empty' | 'brick' | 'steel' | 'water' | 'trees' | 'ice';

// Row-major: the tile at column `x`, row `y` is `tiles[y * width + x]`.
export interface Terrain {
  width: number;
  height: number;
  tiles: Tile[];
}

export interface Tank {
  x: number;
  y: number;
  dir: Direction;
}

// Index into `World.players`: 0 is the host, 1 the guest.
export type PlayerIndex = 0 | 1;

export interface Player {
  // Null while the player has no tank on the field.
  tank: Tank | null;
  score: number;
}

export interface Bullet {
  x: number;
  y: number;
  dir: Direction;
  from: PlayerIndex | 'enemy';
}

export interface PowerUp {
  x: number;
  y: number;
}

// The base sits in the same spot on every stage, so the world only tracks
// whether it still stands. Bottom centre of the 26×26 grid of 8 px tiles
// (DESIGN.md §4): the 16 px base fills columns 12–13 of the last two rows.
const TILE = 8 * UNITS_PER_PIXEL;
export const BASE_POSITION = { x: 12 * TILE, y: 24 * TILE } as const;

export interface Base {
  destroyed: boolean;
}

export type Phase = 'playing' | 'over';

// The whole game, as plain JSON-safe data: no classes, Maps or undefined.
// Later issues add fields as their features need them.
export interface World {
  tick: number;
  phase: Phase;
  stage: number;
  terrain: Terrain;
  players: [Player, Player];
  enemies: Tank[];
  bullets: Bullet[];
  powerUps: PowerUp[];
  base: Base;
  rng: RngState;
}

export interface PlayerInput {
  move: Direction | null;
  fire: boolean;
  revive: boolean;
}

// One input per player, in `World.players` order.
export type Inputs = [PlayerInput, PlayerInput];

export interface NewWorld {
  seed: number;
  stage: number;
  terrain: Terrain;
}

export function createWorld({ seed, stage, terrain }: NewWorld): World {
  return {
    tick: 0,
    phase: 'playing',
    stage,
    terrain,
    players: [
      { tank: null, score: 0 },
      { tank: null, score: 0 },
    ],
    enemies: [],
    bullets: [],
    powerUps: [],
    base: { destroyed: false },
    rng: seedRng(seed),
  };
}
