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
  // Raw Mulberry32 outputs for seed 42: 2581720956, 1925393290, 3661312704.
  // A change here would break every saved or recorded run.
  it('matches canonical Mulberry32', () => {
    expect(draw(42, 3, 1000)).toEqual([601, 448, 852]);
  });

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
