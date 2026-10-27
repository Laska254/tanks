import { describe, expect, it } from 'vitest';
import { fixedStep, MAX_TICKS_PER_FRAME } from './loop';

// Calls the frame callback at `fps` for `seconds` of fake time and counts ticks.
function countTicks(fps: number, seconds: number): number {
  let ticks = 0;
  const frame = fixedStep(() => ticks++);
  for (let i = 0; i <= fps * seconds; i++) frame(Math.round((i * 1000) / fps));
  return ticks;
}

describe('fixedStep', () => {
  it.each([30, 60, 75, 144, 240])('runs 60 ticks per second at %i fps', (fps) => {
    expect(countTicks(fps, 1)).toBe(60);
    expect(countTicks(fps, 10)).toBe(600);
  });

  it('runs no tick on the first frame', () => {
    let ticks = 0;
    fixedStep(() => ticks++)(5000);
    expect(ticks).toBe(0);
  });

  it('caps catch-up after a stall and drops the backlog', () => {
    let ticks = 0;
    const frame = fixedStep(() => ticks++);
    frame(0);
    frame(10_000);
    expect(ticks).toBe(MAX_TICKS_PER_FRAME);
    frame(10_017);
    expect(ticks).toBe(MAX_TICKS_PER_FRAME + 1);
  });
});
