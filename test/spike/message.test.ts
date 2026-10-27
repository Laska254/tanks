import { describe, expect, it } from 'vitest';
import type { Json } from '../../src/net/transport';
import { parse } from '../../src/spike/message';

describe('parse', () => {
  it('reads pos, ping and pong, dropping extra keys', () => {
    expect(parse({ t: 'pos', x: 10, y: 20, extra: true })).toEqual({ t: 'pos', x: 10, y: 20 });
    expect(parse({ t: 'ping', at: 123.5, extra: 'x' })).toEqual({ t: 'ping', at: 123.5 });
    expect(parse({ t: 'pong', at: 123.5, extra: null })).toEqual({ t: 'pong', at: 123.5 });
  });

  it.each<[string, Json]>([
    ['null', null],
    ['an array', [{ t: 'ping', at: 1 }]],
    ['a string', 'ping'],
    ['an unknown t', { t: 'move', x: 1, y: 2 }],
    ['pos with a string x', { t: 'pos', x: '10', y: 20 }],
    ['pos without y', { t: 'pos', x: 10 }],
    ['ping without at', { t: 'ping' }],
  ])('rejects %s', (_, message) => {
    expect(parse(message)).toBeNull();
  });
});
