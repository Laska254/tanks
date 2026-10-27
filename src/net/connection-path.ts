// How this browser reaches a peer: straight across the LAN, through NAT with
// STUN's help, or bounced off a TURN relay.
export type ConnectionPath = 'direct' | 'stun' | 'relay';

export const CONNECTION_PATH_LABELS: Record<ConnectionPath, string> = {
  direct: 'direct (LAN)',
  stun: 'STUN (NAT traversal)',
  relay: 'relay (TURN)',
};

// What RTCPeerConnection.getStats() resolves to. Entries are read as unknown,
// since browsers disagree on which fields they fill in.
type Stats = ReadonlyMap<string, unknown>;
type Entry = Record<string, unknown>;

function isEntry(value: unknown): value is Entry {
  return typeof value === 'object' && value !== null;
}

function lookup(stats: Stats, id: unknown): Entry | null {
  if (typeof id !== 'string') return null;
  const entry = stats.get(id);
  if (!isEntry(entry)) return null;
  return entry;
}

// The candidate pair ICE settled on. Chrome and Safari name it on the
// transport entry; Firefox has no transport entry and flags the pair itself.
function selectedPair(stats: Stats): Entry | null {
  for (const entry of stats.values()) {
    if (!isEntry(entry)) continue;
    if (entry.type === 'transport') {
      const pair = lookup(stats, entry.selectedCandidatePairId);
      if (pair) return pair;
    }
    if (entry.type === 'candidate-pair' && entry.selected === true) return entry;
  }
  return null;
}

// Null until ICE has picked a pair.
export function connectionPathFromStats(stats: Stats): ConnectionPath | null {
  const pair = selectedPair(stats);
  if (!pair) return null;
  const types = [pair.localCandidateId, pair.remoteCandidateId].map(
    (id) => lookup(stats, id)?.candidateType,
  );
  if (types.includes('relay')) return 'relay';
  if (types.includes('srflx') || types.includes('prflx')) return 'stun';
  if (types.every((type) => type === 'host')) return 'direct';
  return null;
}
