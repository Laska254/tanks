import { TICKS_PER_SECOND } from '../sim/world';

const MS_PER_SECOND = 1000;

// After a stall (a background tab, a slow frame) the loop runs at most this
// many ticks in one frame and drops the rest of the backlog, so the game
// slows down for a moment instead of racing to catch up.
export const MAX_TICKS_PER_FRAME = 5;

// Returns a frame callback that takes the current time in ms and calls `tick`
// once for every 1/60 s that has passed since the previous frame.
export function fixedStep(tick: () => void): (now: number) => void {
  let last: number | null = null;
  // Elapsed time in ms × TICKS_PER_SECOND, so one tick costs exactly
  // MS_PER_SECOND and no rounding builds up from 1000 / 60.
  let owed = 0;

  return (now) => {
    if (last !== null) owed += (now - last) * TICKS_PER_SECOND;
    last = now;

    const cap = MAX_TICKS_PER_FRAME * MS_PER_SECOND;
    if (owed > cap) owed = cap;

    while (owed >= MS_PER_SECOND) {
      owed -= MS_PER_SECOND;
      tick();
    }
  };
}

// Drives `tick` from the browser's animation frames. Returns a stop function.
export function startLoop(tick: () => void): () => void {
  const frame = fixedStep(tick);
  let id = 0;
  const onFrame = (now: number) => {
    frame(now);
    id = requestAnimationFrame(onFrame);
  };
  id = requestAnimationFrame(onFrame);
  return () => cancelAnimationFrame(id);
}
