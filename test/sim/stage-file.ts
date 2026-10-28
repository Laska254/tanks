// Builds stage file text for tests (stages/README.md).

export const EMPTY = '.'.repeat(26);
const WALL_TOP = '...........BBBB...........';
const WALL_SIDES = '...........B..B...........';
export const WAVE = 'enemies: bbbbffffppppaaaabfpa';

// An empty stage with only the base's wall.
export function grid(): string[] {
  return [...Array<string>(23).fill(EMPTY), WALL_TOP, WALL_SIDES, WALL_SIDES];
}

export function put(rows: string[], x: number, y: number, char: string): string[] {
  return rows.map((row, i) => (i === y ? row.slice(0, x) + char + row.slice(x + 1) : row));
}

export function file(rows = grid(), wave = WAVE): string {
  return [...rows, wave, ''].join('\n');
}
