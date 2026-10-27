import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Json } from './transport';
import { TrysteroTransport } from './trystero-transport';

type OnMessage = (message: Json, context: { peerId: string }) => void;
type Callbacks = { onJoinError: (details: object) => void };
type FakeConnection = { getStats: ReturnType<typeof vi.fn> };

// Stands in for the room Trystero would create, so tests can fire its events
// and see what the adapter sends.
type FakeRoom = {
  appId: string;
  roomId: string;
  callbacks: Callbacks;
  onPeerJoin: ((peer: string) => void) | null;
  onPeerLeave: ((peer: string) => void) | null;
  onMessage: OnMessage;
  send: ReturnType<typeof vi.fn>;
  leave: ReturnType<typeof vi.fn>;
  connections: Record<string, FakeConnection>;
  getPeers: () => Record<string, FakeConnection>;
  makeAction: (name: string, config: { onMessage: OnMessage }) => { send: FakeRoom['send'] };
};

const fake = vi.hoisted(() => ({ room: null as FakeRoom | null }));

vi.mock('trystero', () => ({
  selfId: 'me',
  joinRoom: ({ appId }: { appId: string }, roomId: string, callbacks: Callbacks): FakeRoom => {
    const room: FakeRoom = {
      appId,
      roomId,
      callbacks,
      onPeerJoin: null,
      onPeerLeave: null,
      onMessage: () => {},
      send: vi.fn(() => Promise.resolve()),
      leave: vi.fn(() => Promise.resolve()),
      connections: {},
      getPeers: () => room.connections,
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

  afterEach(() => {
    vi.restoreAllMocks();
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

  it('keeps calling the other listeners when one throws', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const second = vi.fn();
    transport.onPeerJoin(() => {
      throw new Error('boom');
    });
    transport.onPeerJoin(second);
    transport.join('ABCDE');

    room().onPeerJoin?.('p2');

    expect(second).toHaveBeenCalledWith('p2');
    expect(error).toHaveBeenCalledWith('Transport listener failed', new Error('boom'));
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

  it('logs a send that fails instead of leaving it unhandled', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    transport.join('ABCDE');
    room().send.mockRejectedValueOnce(new Error('peer disconnected'));

    transport.send('hi');

    await vi.waitFor(() =>
      expect(warn).toHaveBeenCalledWith('Trystero send failed', new Error('peer disconnected')),
    );
  });

  it('logs join errors', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    transport.join('ABCDE');
    const details = { error: 'x', appId: 'laska254-tanks', roomId: 'ABCDE', peerId: 'p2' };

    room().callbacks.onJoinError(details);

    expect(warn).toHaveBeenCalledWith('Trystero join error', details);
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

  it('ignores events from a room it has left', async () => {
    const cb = vi.fn();
    transport.onPeerJoin(cb);
    transport.onPeerLeave(cb);
    transport.onMessage(cb);
    transport.join('ABCDE');
    const old = room();
    await transport.leave();
    transport.join('ABCDE');

    old.onPeerJoin?.('p2');
    old.onMessage('late', { peerId: 'p2' });
    old.onPeerLeave?.('p2');

    expect(cb).not.toHaveBeenCalled();
  });

  it("reads a peer's connection path from its stats", async () => {
    transport.join('ABCDE');
    const stats = new Map<string, unknown>([
      ['T', { type: 'transport', selectedCandidatePairId: 'CP' }],
      ['CP', { type: 'candidate-pair', localCandidateId: 'L', remoteCandidateId: 'R' }],
      ['L', { type: 'local-candidate', candidateType: 'host' }],
      ['R', { type: 'remote-candidate', candidateType: 'srflx' }],
    ]);
    room().connections.p2 = { getStats: vi.fn(() => Promise.resolve(stats)) };

    await expect(transport.connectionPath('p2')).resolves.toBe('stun');
  });

  it('gives no connection path for an unknown peer, outside a room, or a closed connection', async () => {
    await expect(transport.connectionPath('p2')).resolves.toBeNull();
    transport.join('ABCDE');
    await expect(transport.connectionPath('p2')).resolves.toBeNull();

    room().connections.p2 = {
      getStats: vi.fn(() => Promise.reject(new DOMException('closed', 'InvalidStateError'))),
    };
    await expect(transport.connectionPath('p2')).resolves.toBeNull();
  });

  it('does nothing when leaving without a room', async () => {
    await expect(transport.leave()).resolves.toBeUndefined();
  });
});
