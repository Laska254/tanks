import type { Direction } from './direction';

export interface PlayerInput {
  move: Direction | null;
  fire: boolean;
  revive: boolean;
}

// One input per player, in `World.players` order.
export type Inputs = [PlayerInput, PlayerInput];
