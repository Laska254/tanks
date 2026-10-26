# Tanks

**A browser remake of the classic NES tank game. Two friends on two devices defend the base together, online.**

> 🚧 **Status: early development.** Nothing is playable yet. Progress is tracked on the [project board](https://github.com/Laska254/tanks/projects) and in [milestones](https://github.com/Laska254/tanks/milestones).

Tanks is a fan remake inspired by *Battle City* (Namco, 1985), known to many in Eastern Europe as *Tank 1990*. It keeps what made the original great (destructible brick walls, an eagle to protect, waves of enemy tanks, power-ups) and adds the one thing it never had: **co-op over the internet**.

- **Online 2-player co-op.** One player hosts and shares a link, and the other joins.
- **Runs in the browser** on PC and phone. No install, no account.
- **No game server.** The two browsers connect directly to each other (WebRTC). The game itself is a static site on GitHub Pages.

## How it will work

1. Open the game and click **Host game**. A quick connection check makes sure your network can handle hosting.
2. Send your friend the link (or the short room code).
3. Your friend opens it and joins the lobby. You pick a stage and press **Start**.
4. Defend the eagle together. If your partner runs out of lives, you can **give them one of yours** to bring them back.

If either of you disconnects or switches tabs, the game pauses until you're both back.

## Planned for the first release

- 10 original stages, 4 enemy types, 6 power-ups
- Keyboard, gamepad, and on-screen touch controls (phones in landscape)
- Nicknames, per-player scores, and an end-of-stage tally screen
- Pause, auto-pause when a player is away, and resume after a disconnect or page refresh
- Connection-quality indicator, plus a debug overlay (`F3`) for testing

**Later:** spectator mode with emoji reactions, *Tank 1990* extras (the boat and the gun power-ups), versus mode, and a Polish translation.

## Controls (planned)

| Action | Keyboard | Touch |
|---|---|---|
| Move | Arrows / WASD | D-pad (left side) |
| Fire | Space / J | Fire button (right side) |
| Give a life to your partner | R | Revive button (shown when available) |
| Pause | P / Esc | Pause button |
| Debug overlay | F3 | n/a |

## Tech

TypeScript · Vite · HTML5 Canvas · WebRTC ([Trystero](https://github.com/dmotz/trystero)) · Vitest · GitHub Actions → GitHub Pages
