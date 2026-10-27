import type { Inputs, World } from './world';

// Advances the game by exactly one tick (1/60 s). Returns a new world and
// leaves `world` untouched, so callers can keep the old one for snapshots.
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- read once tanks move (#20)
export function step(world: World, inputs: Inputs): World {
  const next = structuredClone(world);
  next.tick++;
  return next;
}
