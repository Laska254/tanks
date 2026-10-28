import { describe, expect, it } from 'vitest';
import sprites from '../../src/render/sprites.json';

const DIRECTIONS = ['up', 'right', 'down', 'left'];

function names(prefix: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => `${prefix}-${i}`);
}

function tank(prefix: string): string[] {
  return DIRECTIONS.flatMap((dir) => names(`${prefix}-${dir}`, 2));
}

// Every frame #15 asks for, with its size in pixels.
const EXPECTED: [names: string[], w: number, h: number][] = [
  [
    ['player1', 'player2'].flatMap((player) =>
      [0, 1, 2, 3].flatMap((level) => tank(`${player}-level${level}`)),
    ),
    16,
    16,
  ],
  [
    ['basic', 'fast', 'power', 'armor'].flatMap((type) => [
      ...tank(`enemy-${type}`),
      ...tank(`enemy-${type}-bonus`),
    ]),
    16,
    16,
  ],
  [['hp3', 'hp2', 'hp1'].flatMap((hp) => tank(`enemy-armor-${hp}`)), 16, 16],
  [['brick', 'steel', ...names('water', 3), 'trees', 'ice'], 8, 8],
  [['base', 'base-destroyed'], 16, 16],
  [['bullet-up', 'bullet-down'], 3, 4],
  [['bullet-left', 'bullet-right'], 4, 3],
  [names('explosion-small', 3), 16, 16],
  [names('explosion-big', 2), 32, 32],
  [[...names('spawn', 4), ...names('shield', 2)], 16, 16],
  [
    ['helmet', 'clock', 'shovel', 'star', 'grenade', 'tank'].map((kind) => `power-up-${kind}`),
    16,
    16,
  ],
  [['hud-enemy', 'hud-life'], 8, 8],
  [['hud-flag'], 16, 16],
  [[...'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,:;!?-\'"/()'].map((char) => `font-${char}`), 8, 8],
];

const frames: Record<string, { x: number; y: number; w: number; h: number }> = sprites;

describe('sprites.json', () => {
  it.each(EXPECTED.flatMap(([list, w, h]) => list.map((name) => [name, w, h] as const)))(
    'has %s at %i×%i',
    (name, w, h) => {
      expect(frames[name]).toMatchObject({ w, h });
    },
  );

  it('has no two frames overlapping', () => {
    const rects = Object.values(frames);
    const overlaps = rects.filter((a, i) =>
      rects
        .slice(i + 1)
        .some((b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h),
    );
    expect(overlaps).toEqual([]);
  });
});
