// Anything JSON can carry. Every message goes over the wire as plain JSON.
export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

export type PeerId = string;

// Stops a callback registered with one of the `on…` methods.
export type Unsubscribe = () => void;

// How browsers in one room reach each other. The game only ever talks to this,
// so the networking library behind it (or the `?dev` loopback) can be swapped.
export interface Transport {
  // This browser's ID, the same one other peers see in their callbacks.
  readonly selfId: PeerId;
  join(roomId: string): void;
  leave(): Promise<void>;
  // Sends to one peer, or to every peer in the room when `to` is left out.
  send(message: Json, to?: PeerId): void;
  onMessage(cb: (message: Json, from: PeerId) => void): Unsubscribe;
  onPeerJoin(cb: (peer: PeerId) => void): Unsubscribe;
  onPeerLeave(cb: (peer: PeerId) => void): Unsubscribe;
}
