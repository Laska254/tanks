import { describe, expect, it } from 'vitest';
import { nextInt, seedRng, type RngState } from './rng';

function draw(seed: number, count: number, bound: number): number[] {
  let state: RngState = seedRng(seed);
  const values: number[] = [];
  for (let i = 0; i < count; i++) {
    const [value, next] = nextInt(state, bound);
    values.push(value);
    state = next;
  }
  return values;
}

describe('nextInt', () => {
  it('gives the same sequence for the same seed', () => {
    expect(draw(42, 100, 1000)).toEqual(draw(42, 100, 1000));
  });

  it('gives a different sequence for another seed', () => {
    expect(draw(42, 100, 1000)).not.toEqual(draw(43, 100, 1000));
  });

  it('stays in range and reaches every value', () => {
    const values = draw(7, 1000, 6);
    expect(values.every((value) => Number.isInteger(value) && value >= 0 && value < 6)).toBe(true);
    expect(new Set(values).size).toBe(6);
  });
});
