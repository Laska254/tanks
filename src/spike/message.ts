import type { Json } from '../net/transport';

export type Message =
  { t: 'pos'; x: number; y: number } | { t: 'ping'; at: number } | { t: 'pong'; at: number };

// Peers are other people's browsers, so check every message's shape.
export function parse(message: Json): Message | null {
  if (typeof message !== 'object' || message === null || Array.isArray(message)) return null;
  const { t, x, y, at } = message;
  if (t === 'pos' && typeof x === 'number' && typeof y === 'number') return { t, x, y };
  if ((t === 'ping' || t === 'pong') && typeof at === 'number') return { t, at };
  return null;
}
