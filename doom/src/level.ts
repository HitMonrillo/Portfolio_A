export type TargetId = 'experience' | 'projects' | 'contact' | 'about';

export interface TargetDef {
  id: TargetId;
  label: string;
  /** Base wall colour, RGB 0-255. */
  color: [number, number, number];
}

/**
 * The map is authored as text so the layout stays readable and editable.
 *   #  solid wall        .  open floor
 *   E  Experience sign   P  Projects sign
 *   C  Contact sign      A  About sign
 *
 * It is one open arena rather than a maze: a recruiter should be able to see
 * every sign from the spawn point without having to navigate anywhere.
 */
const MAP_ROWS = [
  '#####EEEEE#####',
  '#.............#',
  '#.............#',
  '#...#.....#...#',
  '#.............#',
  'P.............A',
  'P.............A',
  'P.............A',
  '#.............#',
  '#...#.....#...#',
  '#.............#',
  '#.............#',
  '#####CCCCC#####',
];

const LEGEND: Record<string, number> = {
  '.': 0,
  '#': 1,
  E: 2,
  P: 3,
  C: 4,
  A: 5,
};

export const TARGET_CELLS: Record<number, TargetDef> = {
  2: { id: 'experience', label: 'EXPERIENCE', color: [214, 158, 46] },
  3: { id: 'projects', label: 'PROJECTS', color: [56, 178, 172] },
  4: { id: 'contact', label: 'CONTACT', color: [188, 96, 176] },
  5: { id: 'about', label: 'ABOUT', color: [86, 166, 96] },
};

export const PLAIN_WALL_COLOR: [number, number, number] = [112, 122, 144];

export const MAP_H = MAP_ROWS.length;
export const MAP_W = MAP_ROWS[0].length;

const GRID: number[] = new Array(MAP_W * MAP_H);
for (let y = 0; y < MAP_H; y++) {
  const row = MAP_ROWS[y];
  if (row.length !== MAP_W) {
    throw new Error(`Map row ${y} is ${row.length} wide, expected ${MAP_W}`);
  }
  for (let x = 0; x < MAP_W; x++) {
    GRID[y * MAP_W + x] = LEGEND[row[x]] ?? 1;
  }
}

/** Cells outside the map read as solid so rays always terminate. */
export function getCell(x: number, y: number): number {
  if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return 1;
  return GRID[y * MAP_W + x];
}

export function isWalkable(x: number, y: number): boolean {
  return getCell(Math.floor(x), Math.floor(y)) === 0;
}

export function targetFor(cell: number): TargetDef | null {
  return TARGET_CELLS[cell] ?? null;
}

/** Centre of the arena, facing the Experience sign to the north. */
export const SPAWN = { x: MAP_W / 2, y: MAP_H / 2, dirX: 0, dirY: -1 };
