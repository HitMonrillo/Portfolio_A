import { inject } from '@vercel/analytics';

import { Input } from './input';
import { SPAWN, isWalkable, targetFor, type TargetId } from './level';
import { Panels } from './panels';
import { Renderer, castCentreRay, type Player } from './raycaster';

// Vercel Web Analytics. The endpoint only exists on Vercel, so this is a
// no-op locally rather than an error.
inject();

const MOVE_SPEED = 3.2; // grid cells per second
const TURN_SPEED = 2.4; // radians per second, keyboard turning
const MOUSE_SENSITIVITY = 0.0022; // radians per pixel of movementX
const RADIUS = 0.28; // player collision radius
const SHOOT_RANGE = 30;

function required<T extends Element>(selector: string): T {
  const el = document.querySelector<T>(selector);
  if (!el) throw new Error(`Arena markup is missing ${selector}`);
  return el;
}

const canvas = required<HTMLCanvasElement>('#view');
const hint = required<HTMLElement>('#hint');
const lockPrompt = required<HTMLElement>('#lock-prompt');
const crosshair = required<HTMLElement>('#crosshair');
const stage = required<HTMLElement>('#stage');

const player: Player = {
  x: SPAWN.x,
  y: SPAWN.y,
  dirX: SPAWN.dirX,
  dirY: SPAWN.dirY,
  // Perpendicular to dir; its length of 0.66 gives roughly a 66° field of view.
  planeX: -SPAWN.dirY * 0.66,
  planeY: SPAWN.dirX * 0.66,
};

const hasFinePointer = window.matchMedia('(pointer: fine)').matches;

const renderer = new Renderer(canvas);
const panels = new Panels(() => {
  // Closing a panel hands control straight back to the game.
  if (hasFinePointer) input.requestLock();
});

const input = new Input(canvas, {
  onShoot: shoot,
  onLockChange: (locked) => {
    lockPrompt.hidden = locked;
  },
});

function rotate(angle: number): void {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dirX = player.dirX * cos - player.dirY * sin;
  player.dirY = player.dirX * sin + player.dirY * cos;
  player.dirX = dirX;
  const planeX = player.planeX * cos - player.planeY * sin;
  player.planeY = player.planeX * sin + player.planeY * cos;
  player.planeX = planeX;
}

/**
 * Axis-separated collision, so sliding along a wall feels right instead of
 * stopping dead the moment either component is blocked.
 */
function move(dx: number, dy: number): void {
  if (dx !== 0) {
    const edge = player.x + Math.sign(dx) * RADIUS + dx;
    if (
      isWalkable(edge, player.y - RADIUS) &&
      isWalkable(edge, player.y + RADIUS)
    ) {
      player.x += dx;
    }
  }
  if (dy !== 0) {
    const edge = player.y + Math.sign(dy) * RADIUS + dy;
    if (
      isWalkable(player.x - RADIUS, edge) &&
      isWalkable(player.x + RADIUS, edge)
    ) {
      player.y += dy;
    }
  }
}

/** What the crosshair is currently resting on, if it is a sign. */
function targetUnderCrosshair(): TargetId | null {
  const hit = castCentreRay(player);
  if (!hit || hit.dist > SHOOT_RANGE) return null;
  return targetFor(hit.cell)?.id ?? null;
}

function shoot(): void {
  if (panels.isOpen) return;
  stage.classList.add('firing');
  window.setTimeout(() => stage.classList.remove('firing'), 90);

  const id = targetUnderCrosshair();
  if (!id) return;
  input.releaseLock();
  panels.open(id);
}

function update(dt: number): void {
  if (panels.isOpen) return;

  const yaw = input.takeYaw();
  if (yaw !== 0) rotate(yaw * MOUSE_SENSITIVITY);
  if (input.isDown('turnLeft')) rotate(-TURN_SPEED * dt);
  if (input.isDown('turnRight')) rotate(TURN_SPEED * dt);

  let forward = 0;
  let strafe = 0;
  if (input.isDown('forward')) forward += 1;
  if (input.isDown('back')) forward -= 1;
  if (input.isDown('strafeLeft')) strafe -= 1;
  if (input.isDown('strafeRight')) strafe += 1;
  if (forward === 0 && strafe === 0) return;

  // Normalise so moving diagonally is not faster than moving straight.
  const len = Math.hypot(forward, strafe);
  const step = (MOVE_SPEED * dt) / len;
  move(
    (player.dirX * forward + player.planeX * strafe) * step,
    (player.dirY * forward + player.planeY * strafe) * step,
  );
}

let lastHint: string | null = null;

function updateHint(id: TargetId | null): void {
  const text = id ? `Click to open ${id.toUpperCase()}` : '';
  if (text === lastHint) return;
  lastHint = text;
  hint.textContent = text;
  hint.hidden = !text;
  crosshair.classList.toggle('on-target', id !== null);
}

let last = performance.now();

function frame(now: number): void {
  // Clamp so a backgrounded tab does not teleport the player on return.
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  update(dt);
  const id = panels.isOpen ? null : targetUnderCrosshair();
  updateHint(id);
  renderer.render(player, id);

  requestAnimationFrame(frame);
}

const resize = (): void => {
  const rect = stage.getBoundingClientRect();
  renderer.resize(rect.width, rect.height);
};

new ResizeObserver(resize).observe(stage);
resize();

if (!hasFinePointer) {
  document.querySelector<HTMLElement>('#touch-notice')?.removeAttribute('hidden');
  lockPrompt.hidden = true;
}

requestAnimationFrame(frame);
