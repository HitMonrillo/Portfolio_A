import { PLAIN_WALL_COLOR, getCell, targetFor, type TargetDef } from './level';

export interface Player {
  x: number;
  y: number;
  /** Unit facing vector. */
  dirX: number;
  dirY: number;
  /** Camera plane, perpendicular to dir. Its length sets the field of view. */
  planeX: number;
  planeY: number;
}

export interface RayHit {
  /** Perpendicular distance, so walls render without fisheye distortion. */
  dist: number;
  cell: number;
  mapX: number;
  mapY: number;
  /** 0 = ray crossed a vertical grid line, 1 = horizontal. */
  side: 0 | 1;
}

const CEILING = '#0b0e15';
const FLOOR = '#242a37';
const FOG = [13, 16, 23] as const;
const MAX_STEPS = 128;
/** Wall height in world units. Above 1 the arena feels enclosed rather than vast. */
const WALL_HEIGHT = 2.2;

/**
 * Digital Differential Analyser: walk the ray cell by cell along the grid
 * lines it crosses, stopping at the first non-empty cell.
 */
export function castRay(
  posX: number,
  posY: number,
  rayDirX: number,
  rayDirY: number,
): RayHit | null {
  let mapX = Math.floor(posX);
  let mapY = Math.floor(posY);

  const deltaDistX = rayDirX === 0 ? Infinity : Math.abs(1 / rayDirX);
  const deltaDistY = rayDirY === 0 ? Infinity : Math.abs(1 / rayDirY);

  let stepX: number;
  let stepY: number;
  let sideDistX: number;
  let sideDistY: number;

  if (rayDirX < 0) {
    stepX = -1;
    sideDistX = (posX - mapX) * deltaDistX;
  } else {
    stepX = 1;
    sideDistX = (mapX + 1 - posX) * deltaDistX;
  }
  if (rayDirY < 0) {
    stepY = -1;
    sideDistY = (posY - mapY) * deltaDistY;
  } else {
    stepY = 1;
    sideDistY = (mapY + 1 - posY) * deltaDistY;
  }

  for (let i = 0; i < MAX_STEPS; i++) {
    let side: 0 | 1;
    if (sideDistX < sideDistY) {
      sideDistX += deltaDistX;
      mapX += stepX;
      side = 0;
    } else {
      sideDistY += deltaDistY;
      mapY += stepY;
      side = 1;
    }

    const cell = getCell(mapX, mapY);
    if (cell !== 0) {
      const dist = side === 0 ? sideDistX - deltaDistX : sideDistY - deltaDistY;
      return { dist, cell, mapX, mapY, side };
    }
  }
  return null;
}

/** The ray through the exact centre of the screen — i.e. the crosshair. */
export function castCentreRay(p: Player): RayHit | null {
  return castRay(p.x, p.y, p.dirX, p.dirY);
}

interface LabelSpan {
  def: TargetDef;
  minX: number;
  maxX: number;
  dist: number;
}

function shade(
  color: readonly [number, number, number],
  side: 0 | 1,
  dist: number,
  highlight: boolean,
): string {
  // Horizontal faces read darker, which is what gives flat walls their edges.
  let k = side === 1 ? 0.68 : 1;
  if (highlight) k *= 1.35;

  // Blend toward the fog colour with distance so the arena has depth.
  const fog = Math.min(1, dist / 22);
  const r = Math.round((color[0] * k) * (1 - fog) + FOG[0] * fog);
  const g = Math.round((color[1] * k) * (1 - fog) + FOG[1] * fog);
  const b = Math.round((color[2] * k) * (1 - fog) + FOG[2] * fog);
  return `rgb(${Math.min(255, r)},${Math.min(255, g)},${Math.min(255, b)})`;
}

export class Renderer {
  private ctx: CanvasRenderingContext2D;

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('2D canvas context unavailable');
    this.ctx = ctx;
    this.ctx.imageSmoothingEnabled = false;
  }

  /**
   * Render at a fixed internal width and let CSS scale it up. Keeps the frame
   * cost constant regardless of monitor size, and gives the chunky retro look.
   */
  resize(cssWidth: number, cssHeight: number, internalWidth = 640): void {
    const aspect = cssHeight / cssWidth;
    this.canvas.width = internalWidth;
    this.canvas.height = Math.max(1, Math.round(internalWidth * aspect));
    this.ctx.imageSmoothingEnabled = false;
  }

  render(p: Player, highlightId: string | null): void {
    const { ctx } = this;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.fillStyle = CEILING;
    ctx.fillRect(0, 0, w, h / 2);
    ctx.fillStyle = FLOOR;
    ctx.fillRect(0, h / 2, w, h / 2);

    const spans = new Map<string, LabelSpan>();

    for (let x = 0; x < w; x++) {
      // -1 at the left edge of the screen, +1 at the right.
      const cameraX = (2 * x) / w - 1;
      const rayDirX = p.dirX + p.planeX * cameraX;
      const rayDirY = p.dirY + p.planeY * cameraX;

      const hit = castRay(p.x, p.y, rayDirX, rayDirY);
      if (!hit || hit.dist <= 0) continue;

      const def = targetFor(hit.cell);
      const highlight = def !== null && def.id === highlightId;
      const color = def ? def.color : PLAIN_WALL_COLOR;

      // Wall height on screen is inversely proportional to distance.
      const lineHeight = (h * WALL_HEIGHT) / hit.dist;
      const drawStart = Math.max(0, Math.round(h / 2 - lineHeight / 2));
      const drawEnd = Math.min(h, Math.round(h / 2 + lineHeight / 2));

      ctx.fillStyle = shade(color, hit.side, hit.dist, highlight);
      ctx.fillRect(x, drawStart, 1, drawEnd - drawStart);

      if (def) {
        const existing = spans.get(def.id);
        if (!existing) {
          spans.set(def.id, { def, minX: x, maxX: x, dist: hit.dist });
        } else {
          existing.minX = Math.min(existing.minX, x);
          existing.maxX = Math.max(existing.maxX, x);
          existing.dist = Math.min(existing.dist, hit.dist);
        }
      }
    }

    this.drawLabels(spans, highlightId, h);
  }

  /**
   * Sign text is drawn as a screen-space overlay sized from the wall's
   * projected height, rather than as a wall texture. Far cheaper, and it
   * stays crisp at any distance.
   */
  private drawLabels(
    spans: Map<string, LabelSpan>,
    highlightId: string | null,
    h: number,
  ): void {
    const { ctx } = this;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const span of spans.values()) {
      const spanW = span.maxX - span.minX;
      const wallHeight = (h * WALL_HEIGHT) / span.dist;

      // Fit to the wall's height, but never overflow the visible span.
      const size = Math.min(
        wallHeight * 0.16,
        spanW / (span.def.label.length * 0.66),
      );
      if (size < 5) continue;

      const cx = (span.minX + span.maxX) / 2;
      // Sit the text above the vertical centre so it never hides the crosshair.
      const cy = h / 2 - wallHeight * 0.2;

      ctx.font = `bold ${size}px ui-monospace, "SF Mono", Menlo, monospace`;
      ctx.lineWidth = Math.max(1, size * 0.16);
      ctx.strokeStyle = 'rgba(0,0,0,0.75)';
      ctx.strokeText(span.def.label, cx, cy);
      ctx.fillStyle =
        span.def.id === highlightId ? '#ffffff' : 'rgba(240,244,255,0.88)';
      ctx.fillText(span.def.label, cx, cy);
    }
  }
}
