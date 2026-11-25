// Wok Rush — every tuning number, colour, recipe and layout box in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales it to the
// window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** One shift lasts this long, in seconds. */
export const SHIFT_SECONDS = 120;

/** Seconds an order may wait before it walks out. Shrinks as the shift goes on. */
export const ORDER_TIME = { start: 50, end: 30 };

/** Seconds between new orders arriving. Shrinks as the shift goes on. */
export const ORDER_INTERVAL = { start: 13, end: 7 };

/** At most this many order tickets on the board at once. */
export const MAX_ORDERS = 3;

/** A raw patty or portion of noodles takes this long on a burner, in seconds. */
export const COOK_SECONDS = 4;
/** After it is done, this many seconds before it burns. */
export const BURN_SECONDS = 5;

/** Points for a served dish, before the time bonus and combo. */
export const SERVE_POINTS = 100;
/** Bonus points per second still left on the order's timer. */
export const TIME_BONUS_PER_SECOND = 2;
/** A wrong dish or a walked-out order costs this many points. */
export const MISTAKE_POINTS = 25;
/** Combo multiplier grows this much per consecutive clean serve, capped. */
export const COMBO_STEP = 0.25;
export const COMBO_MAX = 2;

/** Stars on the end screen at these scores. */
export const STAR_SCORES = [400, 900, 1500];

export const BEST_KEY = 'wok-rush.best';

/** Ingredients. `cooks` means the raw form must spend time on a burner first. */
export const INGREDIENTS = [
  { id: 'bun', name: 'Bun', key: '1', color: '#e8b06a', cooks: false },
  { id: 'patty', name: 'Patty', key: '2', color: '#8a5a3b', cooks: true, cookedName: 'Patty' },
  { id: 'lettuce', name: 'Lettuce', key: '3', color: '#5fbf5a', cooks: false },
  { id: 'tomato', name: 'Tomato', key: '4', color: '#e5534b', cooks: false },
  { id: 'cheese', name: 'Cheese', key: '5', color: '#f2c94c', cooks: false },
  { id: 'egg', name: 'Egg', key: '6', color: '#fdf3d8', cooks: false },
  { id: 'noodles', name: 'Noodles', key: '7', color: '#f0c040', cooks: true, cookedName: 'Noodles' },
];

/** The menu: each dish is a set of ingredient ids. Cooked forms count as their id. */
export const RECIPES = [
  {
    id: 'burger', name: 'Classic Burger', short: 'BURGER',
    ingredients: ['bun', 'patty', 'lettuce', 'tomato', 'cheese'],
    color: '#e8b06a', points: 100,
  },
  {
    id: 'noodles', name: 'Noodle Bowl', short: 'NOODLES',
    ingredients: ['noodles', 'egg', 'tomato'],
    color: '#f0c040', points: 90,
  },
  {
    id: 'salad', name: 'Garden Salad', short: 'SALAD',
    ingredients: ['lettuce', 'tomato', 'cheese', 'egg'],
    color: '#5fbf5a', points: 80,
  },
  {
    id: 'omelette', name: 'Cheesy Omelette', short: 'OMELETTE',
    ingredients: ['egg', 'cheese', 'tomato'],
    color: '#f2c94c', points: 70,
  },
];

export const PALETTE = {
  // Bright, saturated, cheerful — the casual-games look: deep purple chrome,
  // sunny warm kitchen, hot orange and gold accents, thick dark outlines.
  wall: '#ffe3a1',
  wallTop: '#ffb347',
  floor: '#ff9a56',
  floorDark: '#f27d38',
  counter: '#8a5a3b',
  counterTop: '#b57748',
  steel: '#c9d1d9',
  steelDark: '#9aa5b1',
  board: '#4a2067',
  boardPaper: '#fff8e7',
  text: '#2b2118',
  textLight: '#fff8e7',
  muted: '#8b7d6b',
  accent: '#ff5a3c',
  green: '#22c55e',
  gold: '#ffc93c',
  panel: '#fff6d8',
  panelEdge: '#5b2a86',
  plate: '#ffffff',
  shadow: 'rgba(43,33,24,0.25)',
  purple: '#5b2a86',
  purpleDark: '#3d1a5c',
  orange: '#ff8c42',
  teal: '#14b8a6',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Layout boxes, in logical pixels. The renderer draws everything in these. */
export const LAYOUT = {
  // Top bar.
  topBar: { x: 0, y: 0, w: 1280, h: 64 },
  // Order board on the right.
  board: { x: 984, y: 76, w: 280, h: 296 },
  // Stove with two burners, left.
  stove: { x: 24, y: 388, w: 300, h: 180 },
  burnerA: { x: 48, y: 428, w: 116, h: 96 },
  burnerB: { x: 184, y: 428, w: 116, h: 96 },
  // Assembly plate in the middle.
  plate: { x: 560, y: 420, w: 200, h: 140 },
  // Serving window, right of the plate.
  serveWindow: { x: 800, y: 400, w: 160, h: 160 },
  // Ingredient bins along the counter.
  bins: { x: 24, y: 596, w: 1232, h: 108 },
  // Trash and serve buttons, under the plate and the serving window.
  trash: { x: 600, y: 566, w: 120, h: 40 },
  serveButton: { x: 800, y: 566, w: 160, h: 40 },
};

/** Deterministic random numbers (mulberry32) so staged screenshots repeat. */
export function makeRandom(seed) {
  let a = seed >>> 0;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The seven ingredient bins across the bottom counter. */
export function binRect(index) {
  const gap = 12;
  const width = 160;
  return { x: 24 + index * (width + gap), y: 600, w: width, h: 100 };
}

/** One order ticket on the board, by its position on the board. */
export function ticketRect(index) {
  return { x: 996, y: 122 + index * 88, w: 256, h: 78 };
}

/** One burner pan on the stove. */
export function burnerRect(index) {
  return index === 0 ? LAYOUT.burnerA : LAYOUT.burnerB;
}

export function pointIn(rect, x, y) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}
