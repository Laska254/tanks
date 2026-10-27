import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Json } from './transport';
import { TrysteroTransport } from './trystero-transport';

type OnMessage = (message: Json, context: { peerId: string }) => void;

// Stands in for the room Trystero would create, so tests can fire its events
// and see what the adapter sends.
type FakeRoom = {
  appId: string;
  roomId: string;
  onPeerJoin: ((peer: string) => void) | null;
  onPeerLeave: ((peer: string) => void) | null;
  onMessage: OnMessage;
  send: ReturnType<typeof vi.fn>;
  leave: ReturnType<typeof vi.fn>;
  makeAction: (name: string, config: { onMessage: OnMessage }) => { send: FakeRoom['send'] };
};

const fake = vi.hoisted(() => ({ room: null as FakeRoom | null }));

vi.mock('trystero', () => ({
  selfId: 'me',
  joinRoom: ({ appId }: { appId: string }, roomId: string): FakeRoom => {
    const room: FakeRoom = {
      appId,
      roomId,
      onPeerJoin: null,
      onPeerLeave: null,
      onMessage: () => {},
      send: vi.fn(() => Promise.resolve()),
      leave: vi.fn(() => Promise.resolve()),
      makeAction: (_, { onMessage }) => {
        room.onMessage = onMessage;
        return { send: room.send };
      },
    };
    fake.room = room;
    return room;
  },
}));

function room() {
  if (!fake.room) throw new Error('no room joined');
  return fake.room;
}

describe('TrysteroTransport', () => {
  let transport: TrysteroTransport;

  beforeEach(() => {
    fake.room = null;
    transport = new TrysteroTransport();
  });

  it("uses Trystero's peer ID and the game's app ID", () => {
    transport.join('ABCDE');
    expect(transport.selfId).toBe('me');
    expect(room()).toMatchObject({ appId: 'laska254-tanks', roomId: 'ABCDE' });
  });

  it('passes peer joins, leaves and messages to every listener', () => {
    const seen: string[] = [];
    transport.onPeerJoin((peer) => seen.push(`join ${peer}`));
    transport.onPeerLeave((peer) => seen.push(`leave ${peer}`));
    transport.onMessage((message, from) => seen.push(`${JSON.stringify(message)} from ${from}`));
    transport.onMessage((_, from) => seen.push(`again from ${from}`));
    transport.join('ABCDE');

    room().onPeerJoin?.('p2');
    room().onMessage({ hello: [1, 2] }, { peerId: 'p2' });
    room().onPeerLeave?.('p2');

    expect(seen).toEqual(['join p2', '{"hello":[1,2]} from p2', 'again from p2', 'leave p2']);
  });

  it('stops calling a listener once unsubscribed', () => {
    const cb = vi.fn();
    const unsubscribe = transport.onMessage(cb);
    transport.join('ABCDE');
    unsubscribe();
    room().onMessage('hi', { peerId: 'p2' });
    expect(cb).not.toHaveBeenCalled();
  });

  it('sends to everyone, or to one peer', () => {
    transport.join('ABCDE');
    transport.send({ n: 1 });
    transport.send({ n: 2 }, 'p2');
    expect(room().send.mock.calls).toEqual([
      [{ n: 1 }, { target: null }],
      [{ n: 2 }, { target: 'p2' }],
    ]);
  });

  it('refuses to send outside a room, or to join twice', () => {
    expect(() => transport.send('hi')).toThrow('Not in a room');
    transport.join('ABCDE');
    expect(() => transport.join('FGHIJ')).toThrow('Already in a room');
  });

  it('leaves the room and can join another', async () => {
    transport.join('ABCDE');
    const first = room();
    await transport.leave();
    expect(first.leave).toHaveBeenCalledOnce();
    expect(() => transport.send('hi')).toThrow('Not in a room');

    transport.join('FGHIJ');
    expect(room().roomId).toBe('FGHIJ');
  });

  it('does nothing when leaving without a room', async () => {
    await expect(transport.leave()).resolves.toBeUndefined();
  });
});
