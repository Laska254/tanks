export type Tile = 'empty' | 'brick' | 'steel' | 'water' | 'trees' | 'ice';

// Row-major: the tile at column `x`, row `y` is `tiles[y * width + x]`.
export interface Terrain {
  width: number;
  height: number;
  tiles: Tile[];
}
