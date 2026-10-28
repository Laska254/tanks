import { describe, expect, it } from 'vitest';
import { parseStage } from '../../src/sim/stage';
import { EMPTY, file, grid, put, WAVE } from './stage-file';

describe('parseStage', () => {
  it('reads every tile and the wave in order', () => {
    let rows = grid();
    ['B', 'S', 'W', 'T', 'I'].forEach((char, i) => (rows = put(rows, 3 + i, 5, char)));

    const stage = parseStage(file(rows));

    const tile = (x: number, y: number) => stage.terrain.tiles[y * 26 + x];
    expect(stage.terrain).toMatchObject({ width: 26, height: 26 });
    expect(stage.terrain.tiles).toHaveLength(26 * 26);
    expect([2, 3, 4, 5, 6, 7].map((x) => tile(x, 5))).toEqual([
      'empty',
      'brick',
      'steel',
      'water',
      'trees',
      'ice',
    ]);
    expect([tile(11, 23), tile(14, 25), tile(12, 24)]).toEqual(['brick', 'brick', 'empty']);
    expect(stage.enemies.slice(0, 4)).toEqual(['basic', 'basic', 'basic', 'basic']);
    expect(stage.enemies.slice(16)).toEqual(['basic', 'fast', 'power', 'armor']);
    expect(stage.enemies).toHaveLength(20);
  });

  it('accepts Windows line endings and a missing final newline', () => {
    const text = [...grid(), WAVE].join('\r\n');
    expect(parseStage(text)).toEqual(parseStage(file()));
  });

  it('accepts a byte order mark', () => {
    expect(parseStage(`\uFEFF${file()}`)).toEqual(parseStage(file()));
  });

  it.each([
    ['an empty file', '', 'line 1, column 1: expected 26 grid lines, found 0'],
    [
      'too few grid lines',
      file(grid().slice(1)),
      'line 26, column 1: expected 26 grid lines, found 25',
    ],
    [
      'too many grid lines',
      file([...grid(), EMPTY]),
      "line 27, column 1: expected 'enemies: ' after the grid",
    ],
    [
      'a short line',
      file(put(grid(), 25, 4, '')),
      'line 5, column 26: expected 26 characters, found 25',
    ],
    [
      'a long line',
      file(put(grid(), 26, 4, '.')),
      'line 5, column 27: expected 26 characters, found 27',
    ],
    ['an unknown tile', file(put(grid(), 7, 2, 'x')), "line 3, column 8: unknown tile 'x'"],
  ])('rejects %s', (_, text, message) => {
    expect(() => parseStage(text)).toThrow(message);
  });

  it.each([
    ['the base', 13, 25, 'B', "line 26, column 14: the base must be '.', found 'B'"],
    ["the base's wall", 14, 24, 'S', "line 25, column 15: the base's wall must be 'B', found 'S'"],
    [
      'the top-left enemy spawn',
      1,
      1,
      'T',
      "line 2, column 2: the top-left enemy spawn must be '.', found 'T'",
    ],
    [
      'the top-centre enemy spawn',
      12,
      0,
      'W',
      "line 1, column 13: the top-centre enemy spawn must be '.', found 'W'",
    ],
    [
      'the top-right enemy spawn',
      25,
      0,
      'I',
      "line 1, column 26: the top-right enemy spawn must be '.', found 'I'",
    ],
    ["P1's spawn", 9, 25, 'B', "line 26, column 10: P1's spawn must be '.', found 'B'"],
    ["P2's spawn", 16, 24, 'S', "line 25, column 17: P2's spawn must be '.', found 'S'"],
  ])('rejects a blocked %s', (_, x, y, char, message) => {
    expect(() => parseStage(file(put(grid(), x, y, char)))).toThrow(message);
  });

  it.each([
    [
      'a missing wave',
      [...grid(), ''].join('\n'),
      "line 27, column 1: expected 'enemies: ' after the grid",
    ],
    [
      'too few enemies',
      file(grid(), WAVE.slice(0, -1)),
      'line 27, column 29: expected 20 enemies, found 19',
    ],
    [
      'too many enemies',
      file(grid(), `${WAVE}b`),
      'line 27, column 30: expected 20 enemies, found 21',
    ],
    [
      'an unknown enemy',
      file(grid(), WAVE.replace('fff', 'fxf')),
      "line 27, column 15: unknown enemy 'x'",
    ],
    [
      'a line after the wave',
      `${file()}b\n`,
      'line 28, column 1: unexpected line after the enemies',
    ],
    [
      'a line after a blank line after the wave',
      `${file()}\nb\n`,
      'line 29, column 1: unexpected line after the enemies',
    ],
  ])('rejects %s', (_, text, message) => {
    expect(() => parseStage(text)).toThrow(message);
  });
});
