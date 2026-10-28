import { seedRng } from './rng';
import { BASE_TILE } from './stage';
import type { NewWorld, World } from './types/world';

export const TICKS_PER_SECOND = 60;

// Positions and speeds are whole numbers of sub-pixel units, 16 to a screen
// pixel. Speeds slower than a pixel per tick stay exact without fractions.
export const UNITS_PER_PIXEL = 16;

// The 16 px base sits on the same 8 px tiles on every stage (DESIGN.md §4).
const TILE = 8 * UNITS_PER_PIXEL;
export const BASE_POSITION = { x: BASE_TILE.x * TILE, y: BASE_TILE.y * TILE } as const;

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
