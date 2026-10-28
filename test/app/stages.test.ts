import { describe, expect, it } from 'vitest';
import { loadStages, STAGES } from '../../src/app/stages';
import { BASE_TILE, ENEMY_SPAWN_TILES, PLAYER_SPAWN_TILES, parseStage } from '../../src/sim/stage';
import type { Terrain } from '../../src/sim/types/terrain';
import { file, grid, put } from '../sim/stage-file';

const TANK_TILES = 2;
const FOOTPRINT = Array.from({ length: TANK_TILES }, (_, i) => i);

// Whether a 2×2-tile tank starting at `from` can drive onto the base. Tanks
// turn on the tile grid, so every whole-tile position counts. Brick, the
// base's wall included, can be shot away, so only steel and water block.
function reachesBase(terrain: Terrain, from: { x: number; y: number }): boolean {
  const open = (x: number, y: number) =>
    FOOTPRINT.every((dy) =>
      FOOTPRINT.every((dx) => {
        const tile = terrain.tiles[(y + dy) * terrain.width + x + dx];
        return tile !== 'steel' && tile !== 'water';
      }),
    );
  const maxX = terrain.width - TANK_TILES;
  const maxY = terrain.height - TANK_TILES;
  const seen = new Set([`${from.x},${from.y}`]);
  const queue = [from];
  for (const { x, y } of queue) {
    if (x === BASE_TILE.x && y === BASE_TILE.y) return true;
    for (const next of [
      { x: x + 1, y },
      { x: x - 1, y },
      { x, y: y + 1 },
      { x, y: y - 1 },
    ]) {
      const key = `${next.x},${next.y}`;
      if (next.x < 0 || next.y < 0 || next.x > maxX || next.y > maxY || seen.has(key)) continue;
      if (!open(next.x, next.y)) continue;
      seen.add(key);
      queue.push(next);
    }
  }
  return false;
}

function stageFile(firstEnemy: string): string {
  return file(grid(), `enemies: ${firstEnemy}${'b'.repeat(19)}`);
}

describe('loadStages', () => {
  it('orders stages by file number', () => {
    const stages = loadStages({
      '../../stages/02.txt': stageFile('f'),
      '../../stages/01.txt': stageFile('a'),
    });
    expect(stages.map((stage) => stage.enemies[0])).toEqual(['armor', 'fast']);
  });

  it('rejects a gap in the numbering', () => {
    const files = { '../../stages/01.txt': stageFile('b'), '../../stages/03.txt': stageFile('b') };
    expect(() => loadStages(files)).toThrow('stages/02.txt is missing, found stages/03.txt');
  });

  it('rejects a file not named like 01.txt', () => {
    const files = {
      '../../stages/01.txt': stageFile('b'),
      '../../stages/01-draft.txt': stageFile('b'),
    };
    expect(() => loadStages(files)).toThrow('stages/01-draft.txt: expected a name like 01.txt');
  });

  it('names the file in a parse error', () => {
    const files = { '../../stages/01.txt': stageFile('x') };
    expect(() => loadStages(files)).toThrow("stages/01.txt: line 27, column 10: unknown enemy 'x'");
  });

  // Importing STAGES already parses every file in stages/, so a broken one
  // fails this file. The count catches a glob that matches nothing.
  it('loads the real stage files', () => {
    expect(STAGES).toHaveLength(1);
  });
});

describe('the real stages', () => {
  const spawns = [...ENEMY_SPAWN_TILES, ...PLAYER_SPAWN_TILES];

  it.each(STAGES.map((stage, i) => [i + 1, stage] as const))(
    'stage %i lets every spawn reach the base',
    (_, stage) => {
      expect(spawns.filter((spawn) => !reachesBase(stage.terrain, spawn))).toEqual([]);
    },
  );
});

describe('reachesBase', () => {
  it.each(['S', 'W'])('notices a spawn sealed off by %s', (char) => {
    let rows = grid();
    for (const [x, y] of [
      [2, 0],
      [2, 1],
      [0, 2],
      [1, 2],
      [2, 2],
    ] as const) {
      rows = put(rows, x, y, char);
    }
    const { terrain } = parseStage(file(rows));
    expect(reachesBase(terrain, ENEMY_SPAWN_TILES[0])).toBe(false);
    expect(reachesBase(terrain, ENEMY_SPAWN_TILES[1])).toBe(true);
  });
});
