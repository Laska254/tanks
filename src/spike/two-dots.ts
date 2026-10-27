// Networking spike (#8, #9): every device in a room moves a dot and sees the
// others, with the RTT and connection path to each.
// Throwaway; the real game replaces this page.
import { CONNECTION_PATH_LABELS, type ConnectionPath } from '../net/connection-path';
import type { PeerId } from '../net/transport';
import { TrysteroTransport } from '../net/trystero-transport';
import { parse } from './message';
import { newRoomCode } from './room-code';

const WIDTH = 256;
const HEIGHT = 240;
const RADIUS = 4;
// Logical pixels per second.
const SPEED = 90;
// About 20 position updates per second.
const SEND_INTERVAL_MS = 50;
const PING_INTERVAL_MS = 1000;
// ICE can switch paths after connecting, so this keeps checking.
const PATH_INTERVAL_MS = 2000;
// Longest frame step, so a tab coming back from the background doesn't jump the dot.
const MAX_FRAME_MS = 100;
const BACKGROUND_COLOR = '#000';
const SELF_COLOR = '#f5c542';
const PEER_COLORS = ['#4cd964', '#5ac8fa', '#ff6b6b', '#c38bff'];

const DIRECTIONS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  KeyA: [-1, 0],
  KeyD: [1, 0],
  KeyW: [0, -1],
  KeyS: [0, 1],
};

type Dot = { x: number; y: number };
type Peer = { color: string; dot: Dot | null; rtt: number | null; path: ConnectionPath | null };
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function formatRtt(rtt: number | null): string {
  if (rtt === null) return '…';
  return `${rtt} ms`;
}

function formatPeer(peer: Peer): string {
  const rtt = `RTT ${formatRtt(peer.rtt)}`;
  if (peer.path === null) return rtt;
  return `${rtt} via ${CONNECTION_PATH_LABELS[peer.path]}`;
}

export function startSpike(app: HTMLElement): void {
  app.innerHTML = `
    <div class="spike">
      <p class="spike-room"><button type="button">Create room</button></p>
      <p class="spike-status"></p>
      <canvas width="${WIDTH}" height="${HEIGHT}" hidden></canvas>
    </div>`;
  const room = app.querySelector<HTMLElement>('.spike-room')!;
  const createButton = room.querySelector('button')!;
  const status = app.querySelector<HTMLElement>('.spike-status')!;
  const canvas = app.querySelector('canvas')!;

  // Codes are uppercase, but phones type lowercase into the address bar.
  const code = new URLSearchParams(location.search).get('room')?.trim().toUpperCase();
  if (code) {
    join(code);
  } else {
    createButton.addEventListener('click', () => {
      const newCode = newRoomCode();
      const url = new URL(location.href);
      url.searchParams.set('room', newCode);
      history.replaceState(null, '', url);
      join(newCode);
    });
  }

  function join(roomCode: string): void {
    showLink();
    canvas.hidden = false;
    const transport = new TrysteroTransport();
    const me: Dot = { x: WIDTH / 2, y: HEIGHT / 2 };
    const peers = new Map<PeerId, Peer>();
    let state = 'connecting';
    let colorIndex = 0;

    function renderStatus(): void {
      let text = `Room ${roomCode} · ${state} · peers: ${peers.size}`;
      if (peers.size) {
        text += ` · ${[...peers.values()].map(formatPeer).join(' | ')}`;
      }
      status.textContent = text;
    }

    transport.onPeerJoin((peer) => {
      const color = PEER_COLORS[colorIndex % PEER_COLORS.length]!;
      colorIndex++;
      peers.set(peer, { color, dot: null, rtt: null, path: null });
      state = 'connected';
      renderStatus();
    });
    transport.onPeerLeave((peer) => {
      peers.delete(peer);
      if (peers.size === 0) state = 'peer left';
      renderStatus();
    });
    transport.onMessage((raw, from) => {
      const message = parse(raw);
      const peer = peers.get(from);
      if (!message || !peer) return;
      if (message.t === 'pos') {
        peer.dot = { x: message.x, y: message.y };
      } else if (message.t === 'ping') {
        transport.send({ t: 'pong', at: message.at }, from);
      } else {
        peer.rtt = Math.round(performance.now() - message.at);
        renderStatus();
      }
    });
    transport.join(roomCode);
    // Leave on close, so the other side sees "peer left" at once.
    addEventListener('pagehide', () => void transport.leave());
    // Back from the back/forward cache, the room is already left: join it afresh.
    addEventListener('pageshow', (event) => {
      if (event.persisted) location.reload();
    });
    renderStatus();

    setInterval(() => {
      if (peers.size) transport.send({ t: 'pos', x: Math.round(me.x), y: Math.round(me.y) });
    }, SEND_INTERVAL_MS);
    setInterval(() => {
      if (peers.size) transport.send({ t: 'ping', at: performance.now() });
    }, PING_INTERVAL_MS);
    setInterval(() => {
      for (const id of peers.keys()) {
        void transport.connectionPath(id).then((path) => {
          const peer = peers.get(id);
          if (!peer) return;
          peer.path = path;
          renderStatus();
        });
      }
    }, PATH_INTERVAL_MS);

    const held = new Set<string>();
    addEventListener('keydown', (event) => {
      // Leave shortcuts like Ctrl+A and Ctrl+S to the browser.
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (!(event.code in DIRECTIONS)) return;
      held.add(event.code);
      event.preventDefault();
    });
    addEventListener('keyup', (event) => held.delete(event.code));
    addEventListener('blur', () => held.clear());

    // Touch, drag or click: the dot jumps to the finger.
    function moveTo(event: PointerEvent): void {
      const rect = canvas.getBoundingClientRect();
      me.x = clamp(((event.clientX - rect.left) / rect.width) * WIDTH, RADIUS, WIDTH - RADIUS);
      me.y = clamp(((event.clientY - rect.top) / rect.height) * HEIGHT, RADIUS, HEIGHT - RADIUS);
    }
    canvas.addEventListener('pointerdown', (event) => {
      canvas.setPointerCapture(event.pointerId);
      moveTo(event);
    });
    canvas.addEventListener('pointermove', (event) => {
      if (event.buttons) moveTo(event);
    });

    const ctx = canvas.getContext('2d')!;
    function drawDot(dot: Dot, color: string): void {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }

    let last = performance.now();
    function frame(now: number): void {
      const seconds = Math.min(now - last, MAX_FRAME_MS) / 1000;
      last = now;
      let dx = 0;
      let dy = 0;
      for (const key of held) {
        const [x, y] = DIRECTIONS[key]!;
        dx += x;
        dy += y;
      }
      me.x = clamp(me.x + dx * SPEED * seconds, RADIUS, WIDTH - RADIUS);
      me.y = clamp(me.y + dy * SPEED * seconds, RADIUS, HEIGHT - RADIUS);

      ctx.fillStyle = BACKGROUND_COLOR;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      for (const peer of peers.values()) if (peer.dot) drawDot(peer.dot, peer.color);
      drawDot(me, SELF_COLOR);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  // Replaces the Create button with the room link and a Copy button.
  function showLink(): void {
    const link = document.createElement('input');
    link.readOnly = true;
    link.value = location.href;
    const copy = document.createElement('button');
    copy.type = 'button';
    copy.textContent = 'Copy';
    copy.addEventListener('click', () => {
      navigator.clipboard.writeText(link.value).then(
        () => (copy.textContent = 'Copied'),
        () => link.select(),
      );
    });
    room.replaceChildren(link, copy);
  }
}
