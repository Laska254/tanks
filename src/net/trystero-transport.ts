// The only file allowed to import Trystero (enforced in eslint.config.js).
import { joinRoom, selfId, type MessageAction, type Room } from 'trystero';
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
    room.onPeerJoin = (peer) => this.joinListeners.forEach((cb) => cb(peer));
    room.onPeerLeave = (peer) => this.leaveListeners.forEach((cb) => cb(peer));
    const action = room.makeAction<Json>(ACTION, {
      onMessage: (message, { peerId }) =>
        this.messageListeners.forEach((cb) => cb(message, peerId)),
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
    void this.joined.action.send(message, { target: to ?? null });
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
}
