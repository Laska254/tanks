import { parseStage } from '../sim/stage';
import type { Stage } from '../sim/types/stage';

// Parses stage files given as { path: text }, in stage order. Files are named
// 01.txt, 02.txt, … with no gaps, so stage N is always at index N - 1.
export function loadStages(files: Record<string, string>): Stage[] {
  const paths = Object.keys(files).sort();
  return paths.map((path, i) => {
    const name = path.split('/').at(-1);
    const expected = `${String(i + 1).padStart(2, '0')}.txt`;
    if (name !== expected) throw new Error(`stages/${expected} is missing, found ${path}`);
    try {
      return parseStage(files[path]!);
    } catch (error) {
      throw new Error(`stages/${name}: ${(error as Error).message}`, { cause: error });
    }
  });
}

// Every stages/NN.txt, bundled into the build as text.
export const STAGES = loadStages(
  import.meta.glob<string>('../../stages/*.txt', { query: '?raw', import: 'default', eager: true }),
);
