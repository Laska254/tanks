# Stages

Each stage is a plain text file named after its number: `01.txt`, `02.txt`, and so on, with no gaps. The game bundles every file here and checks them all when it loads. A mistake fails the tests, and the error gives the file, line and column.

## Format

The first 26 lines are the map, 26 characters each. One character is one 8×8 px tile, a quarter of a tank.

| Char | Tile  |
| ---- | ----- |
| `.`  | empty |
| `B`  | brick |
| `S`  | steel |
| `W`  | water |
| `T`  | trees |
| `I`  | ice   |

Line 27 lists the wave: `enemies: ` and then exactly 20 characters, one per enemy, in the order they enter.

| Char | Enemy |
| ---- | ----- |
| `b`  | basic |
| `f`  | fast  |
| `p`  | power |
| `a`  | armor |

Nothing else may follow, apart from blank lines.

## Fixed areas

Some tiles are the same on every stage, so the game always knows where the base and the spawn points are. Columns and rows count from 1.

| Area                      | Columns | Rows  | Must be |
| ------------------------- | ------- | ----- | ------- |
| Enemy spawn, top left     | 1–2     | 1–2   | `.`     |
| Enemy spawn, top centre   | 13–14   | 1–2   | `.`     |
| Enemy spawn, top right    | 25–26   | 1–2   | `.`     |
| P1 spawn                  | 9–10    | 25–26 | `.`     |
| P2 spawn                  | 17–18   | 25–26 | `.`     |
| Base (eagle)              | 13–14   | 25–26 | `.`     |
| Base wall, top            | 12–15   | 24    | `B`     |
| Base wall, left and right | 12, 15  | 25–26 | `B`     |

So the last three lines of every map have the wall in the middle:

```
...........BBBB...........
...........B..B...........
...........B..B...........
```

## Paths to the base

Every enemy and player spawn needs a path to the base wide enough for a 2×2 tank. Brick counts as open, since it can be shot away. Steel and water block. A sealed spawn fails the tests, and the error names the spawn's top-left tile, counted from 0: `{ x: 0, y: 0 }` is the top-left enemy spawn.
