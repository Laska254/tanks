import type { Tank } from './tank';

// Index into `World.players`: 0 is the host, 1 the guest.
export type PlayerIndex = 0 | 1;

export interface Player {
  // Null while the player has no tank on the field.
  tank: Tank | null;
  score: number;
}
