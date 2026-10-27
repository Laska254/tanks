// The base sits in the same spot on every stage (`BASE_POSITION`), so the
// world only tracks whether it still stands.
export interface Base {
  destroyed: boolean;
}
