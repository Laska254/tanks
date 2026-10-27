// No 0/O or 1/I, so a code read out loud or typed on a phone comes out right.
// 32 characters, so each random byte maps to one without bias.
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const LENGTH = 6;

export function newRoomCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(LENGTH));
  return Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join('');
}
