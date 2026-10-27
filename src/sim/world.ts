import { seedRng } from './rng';
import type { NewWorld, World } from './types/world';

export const TICKS_PER_SECOND = 60;

// Positions and speeds are whole numbers of sub-pixel units, 16 to a screen
// pixel. Speeds slower than a pixel per tick stay exact without fractions.
export const UNITS_PER_PIXEL = 16;

// Bottom centre of the 26×26 grid of 8 px tiles (DESIGN.md §4): the 16 px
// base fills columns 12–13 of the last two rows, on every stage.
const TILE = 8 * UNITS_PER_PIXEL;
export const BASE_POSITION = { x: 12 * TILE, y: 24 * TILE } as const;

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
