import { describe, expect, it } from 'vitest';
import { connectionPathFromStats, type ConnectionPath } from '../../src/net/connection-path';

// A getStats() report the way Chrome and Safari shape it: the transport entry
// names the selected pair.
function chromeStats(local: string, remote: string): Map<string, unknown> {
  return new Map<string, unknown>([
    ['T01', { type: 'transport', selectedCandidatePairId: 'CP1' }],
    ['CP0', { type: 'candidate-pair', localCandidateId: 'L0', remoteCandidateId: 'R0' }],
    ['CP1', { type: 'candidate-pair', localCandidateId: 'L1', remoteCandidateId: 'R1' }],
    ['L0', { type: 'local-candidate', candidateType: 'relay' }],
    ['R0', { type: 'remote-candidate', candidateType: 'relay' }],
    ['L1', { type: 'local-candidate', candidateType: local }],
    ['R1', { type: 'remote-candidate', candidateType: remote }],
  ]);
}

function firefoxPair(selected: boolean, localCandidateId: string, remoteCandidateId: string) {
  return { type: 'candidate-pair', selected, localCandidateId, remoteCandidateId };
}

describe('connectionPathFromStats', () => {
  it.each<[string, string, ConnectionPath]>([
    ['host', 'host', 'direct'],
    ['srflx', 'host', 'stun'],
    ['host', 'prflx', 'stun'],
    ['srflx', 'srflx', 'stun'],
    ['relay', 'srflx', 'relay'],
    ['host', 'relay', 'relay'],
  ])('reads %s + %s as %s', (local, remote, path) => {
    expect(connectionPathFromStats(chromeStats(local, remote))).toBe(path);
  });

  it("finds Firefox's selected pair, which has no transport entry", () => {
    const stats = new Map<string, unknown>([
      ['p0', firefoxPair(false, 'l0', 'r0')],
      ['p1', firefoxPair(true, 'l1', 'r1')],
      ['l0', { type: 'local-candidate', candidateType: 'host' }],
      ['r0', { type: 'remote-candidate', candidateType: 'host' }],
      ['l1', { type: 'local-candidate', candidateType: 'srflx' }],
      ['r1', { type: 'remote-candidate', candidateType: 'host' }],
    ]);
    expect(connectionPathFromStats(stats)).toBe('stun');
  });

  it('gives null before ICE has picked a pair', () => {
    const stats = chromeStats('host', 'host');
    stats.set('T01', { type: 'transport' });
    expect(connectionPathFromStats(stats)).toBeNull();
    expect(connectionPathFromStats(new Map())).toBeNull();
  });

  it('gives null when a candidate is missing or of an unknown type', () => {
    const missing = chromeStats('host', 'host');
    missing.delete('R1');
    expect(connectionPathFromStats(missing)).toBeNull();
    expect(connectionPathFromStats(chromeStats('host', 'mystery'))).toBeNull();
  });
});
