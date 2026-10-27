import type { RngState } from '../rng';
import type { Base } from './base';
import type { Bullet } from './bullet';
import type { Player } from './player';
import type { PowerUp } from './power-up';
import type { Tank } from './tank';
import type { Terrain } from './terrain';

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

export interface NewWorld {
  seed: number;
  stage: number;
  terrain: Terrain;
}
