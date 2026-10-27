import { describe, expect, it } from 'vitest';
import { nextInt, seedRng } from './rng';
import { step } from './step';
import { createWorld, UNITS_PER_PIXEL, type Direction, type Inputs, type World } from './world';

function testWorld(): World {
  const world = createWorld({
    seed: 1234,
    stage: 1,
    terrain: { width: 2, height: 2, tiles: ['empty', 'brick', 'steel', 'water'] },
    base: { x: 0, y: 16 * UNITS_PER_PIXEL },
  });
  world.players[0].tank = { x: 0, y: 0, dir: 'up' };
  world.enemies.push({ x: 32, y: 48, dir: 'down' });
  world.bullets.push({ x: 5, y: 9, dir: 'left', from: 1 });
  world.powerUps.push({ x: 64, y: 64 });
  return world;
}

const MOVES: (Direction | null)[] = [null, 'up', 'down', 'left', 'right'];

// A long, varied input sequence that is the same on every run.
function inputSequence(length: number): Inputs[] {
  let rng = seedRng(99);
  const roll = (bound: number) => {
    const [value, next] = nextInt(rng, bound);
    rng = next;
    return value;
  };
  return Array.from({ length }, () => {
    const input = () => ({ move: MOVES[roll(MOVES.length)]!, fire: roll(2) === 1, revive: false });
    return [input(), input()];
  });
}

function run(world: World, inputs: Inputs[]): World {
  return inputs.reduce(step, world);
}

describe('step', () => {
  it('advances the tick by one', () => {
    expect(step(testWorld(), inputSequence(1)[0]!).tick).toBe(1);
  });

  it('gives an identical world for the same start and inputs', () => {
    const inputs = inputSequence(600);
    expect(run(testWorld(), inputs)).toStrictEqual(run(testWorld(), inputs));
  });

  it('leaves the world it was given untouched', () => {
    const world = testWorld();
    const before = structuredClone(world);
    run(world, inputSequence(60));
    expect(world).toEqual(before);
  });
});

describe('World', () => {
  it('survives a JSON round trip', () => {
    const world = run(testWorld(), inputSequence(60));
    expect(JSON.parse(JSON.stringify(world))).toStrictEqual(world);
  });
});
