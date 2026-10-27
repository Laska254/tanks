import type { Direction } from './direction';
import type { PlayerIndex } from './player';

export interface Bullet {
  x: number;
  y: number;
  dir: Direction;
  from: PlayerIndex | 'enemy';
}
