import type { EnemyType } from './enemy-type';
import type { Terrain } from './terrain';

// One stage file, parsed (stages/README.md).
export interface Stage {
  terrain: Terrain;
  // The wave of enemies, in spawn order.
  enemies: EnemyType[];
}
