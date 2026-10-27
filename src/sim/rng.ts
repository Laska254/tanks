// Mulberry32: a small, fast PRNG whose whole state is one 32-bit number, so
// it lives in the world and saves, loads and replays with it.
export type RngState = number;

export function seedRng(seed: number): RngState {
  return seed >>> 0;
}

// A whole number in [0, bound), plus the state to use next time.
// `bound` must be a positive integer below 2^21, so `value * bound` stays exact.
export function nextInt(state: RngState, bound: number): [number, RngState] {
  const next = (state + 0x6d2b79f5) >>> 0;
  let value = next;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  value = (value ^ (value >>> 14)) >>> 0;
  return [Math.floor((value * bound) / 2 ** 32), next];
}
