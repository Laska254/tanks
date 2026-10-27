import { describe, expect, it } from 'vitest';
import { newRoomCode } from './room-code';

describe('newRoomCode', () => {
  it('is 6 characters with no look-alikes', () => {
    for (let i = 0; i < 100; i++) {
      expect(newRoomCode()).toMatch(/^[2-9A-HJ-NP-Z]{6}$/);
    }
  });

  it('gives a different code each time', () => {
    const codes = new Set(Array.from({ length: 100 }, newRoomCode));
    expect(codes.size).toBe(100);
  });
});
