// The only file allowed to import Trystero (enforced in eslint.config.js).
import { joinRoom, selfId, type MessageAction, type Room } from 'trystero';
import { connectionPathFromStats, type ConnectionPath } from './connection-path';
import type { Json, PeerId, Transport, Unsubscribe } from './transport';

// Only peers with the same app ID can find each other.
const APP_ID = 'laska254-tanks';
// Every message rides on this one Trystero action.
const ACTION = 'msg';

type Joined = { room: Room; action: MessageAction<Json> };

function subscribe<T>(listeners: Set<T>, cb: T): Unsubscribe {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

// Calls every listener, even when one throws, so a bug in one can't starve the rest.
function emit<A extends unknown[]>(listeners: Set<(...args: A) => void>, ...args: A): void {
  for (const cb of listeners) {
    try {
      cb(...args);
    } catch (error) {
      console.error('Transport listener failed', error);
    }
  }
}

// WebRTC data channels, with Trystero's default Nostr strategy for signaling.
export class TrysteroTransport implements Transport {
  readonly selfId: PeerId = selfId;
  private joined: Joined | null = null;
  private readonly messageListeners = new Set<(message: Json, from: PeerId) => void>();
  private readonly joinListeners = new Set<(peer: PeerId) => void>();
  private readonly leaveListeners = new Set<(peer: PeerId) => void>();

  join(roomId: string): void {
    if (this.joined) throw new Error('Already in a room');
    const room = joinRoom({ appId: APP_ID }, roomId, {
      onJoinError: (details) => console.warn('Trystero join error', details),
    });
    // Trystero keeps delivering a room's events for a moment after leave().
    // Drop them, so they never mix into a room joined straight after.
    const isCurrent = () => this.joined?.room === room;
    room.onPeerJoin = (peer) => {
      if (isCurrent()) emit(this.joinListeners, peer);
    };
    room.onPeerLeave = (peer) => {
      if (isCurrent()) emit(this.leaveListeners, peer);
    };
    const action = room.makeAction<Json>(ACTION, {
      onMessage: (message, { peerId }) => {
        if (isCurrent()) emit(this.messageListeners, message, peerId);
      },
    });
    this.joined = { room, action };
  }

  async leave(): Promise<void> {
    const joined = this.joined;
    this.joined = null;
    await joined?.room.leave();
  }

  send(message: Json, to?: PeerId): void {
    if (!this.joined) throw new Error('Not in a room');
    // Rejects when a peer drops mid-send. peerLeave reports that, so just log it.
    this.joined.action
      .send(message, { target: to ?? null })
      .catch((error: unknown) => console.warn('Trystero send failed', error));
  }

  onMessage(cb: (message: Json, from: PeerId) => void): Unsubscribe {
    return subscribe(this.messageListeners, cb);
  }

  onPeerJoin(cb: (peer: PeerId) => void): Unsubscribe {
    return subscribe(this.joinListeners, cb);
  }

  onPeerLeave(cb: (peer: PeerId) => void): Unsubscribe {
    return subscribe(this.leaveListeners, cb);
  }

  async connectionPath(peer: PeerId): Promise<ConnectionPath | null> {
    const connection = this.joined?.room.getPeers()[peer];
    if (!connection) return null;
    try {
      return connectionPathFromStats(await connection.getStats());
    } catch (error) {
      // getStats() throws InvalidStateError once the connection has closed.
      // Anything else is unexpected, so log it.
      if (!(error instanceof DOMException && error.name === 'InvalidStateError')) {
        console.warn('Trystero getStats failed', error);
      }
      return null;
    }
  }
}
