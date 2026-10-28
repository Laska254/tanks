import { describe, expect, it } from 'vitest';
import { loadStages, STAGES } from '../../src/app/stages';

const EMPTY = '.'.repeat(26);
const WALL_SIDES = '...........B..B...........';
const GRID = [
  ...Array<string>(23).fill(EMPTY),
  '...........BBBB...........',
  WALL_SIDES,
  WALL_SIDES,
];

function stageFile(firstEnemy: string): string {
  return [...GRID, `enemies: ${firstEnemy}${'b'.repeat(19)}`].join('\n');
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
    expect(() => loadStages(files)).toThrow('stages/02.txt is missing');
  });

  it('names the file in a parse error', () => {
    const files = { '../../stages/01.txt': stageFile('x') };
    expect(() => loadStages(files)).toThrow("stages/01.txt: line 27, column 10: unknown enemy 'x'");
  });

  // Importing STAGES already parses every file in stages/, so a broken one
  // fails this file. Until #14 adds stage 1, the list is empty.
  it('loads the real stage files', () => {
    expect(STAGES.every((stage) => stage.enemies.length === 20)).toBe(true);
  });
});
