import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fixedStep, MAX_TICKS_PER_FRAME, startLoop } from './loop';

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

describe('startLoop', () => {
  // Stands in for the browser's animation frames: callbacks wait in a queue
  // until the test runs them with `flushFrame`.
  let queue: Map<number, FrameRequestCallback>;
  let nextId: number;

  beforeEach(() => {
    queue = new Map();
    nextId = 1;
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      const id = nextId;
      nextId++;
      queue.set(id, cb);
      return id;
    });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => queue.delete(id));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function flushFrame(now: number) {
    const callbacks = [...queue.values()];
    queue.clear();
    for (const cb of callbacks) cb(now);
  }

  it('ticks on frames 1/60 s apart', () => {
    let ticks = 0;
    startLoop(() => ticks++);
    for (let i = 0; i <= 60; i++) flushFrame(Math.round((i * 1000) / 60));
    expect(ticks).toBe(60);
  });

  it('schedules nothing more once stopped', () => {
    const stop = startLoop(() => {});
    flushFrame(0);
    stop();
    expect(queue.size).toBe(0);
  });

  it('schedules nothing more when stopped from inside a tick', () => {
    let ticks = 0;
    const stop = startLoop(() => {
      ticks++;
      stop();
    });
    flushFrame(0);
    flushFrame(17);
    expect(ticks).toBe(1);
    expect(queue.size).toBe(0);
  });
});
