import { parseStage } from '../sim/stage';
import type { Stage } from '../sim/types/stage';

const NAME = /^\d{2}\.txt$/;

function fileName(path: string): string {
  return path.split('/').at(-1)!;
}

// Parses stage files given as { path: text }, in stage order. Files are named
// 01.txt, 02.txt, … with no gaps, so stage N is always at index N - 1.
export function loadStages(files: Record<string, string>): Stage[] {
  const paths = Object.keys(files).sort();
  for (const name of paths.map(fileName)) {
    if (!NAME.test(name)) throw new Error(`stages/${name}: expected a name like 01.txt`);
  }
  return paths.map((path, i) => {
    const name = fileName(path);
    const expected = `${String(i + 1).padStart(2, '0')}.txt`;
    if (name !== expected) throw new Error(`stages/${expected} is missing, found stages/${name}`);
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
