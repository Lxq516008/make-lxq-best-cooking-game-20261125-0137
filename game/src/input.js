// Wok Rush — keyboard and mouse input. The canvas reports clicks in logical
// coordinates; this module turns them into game actions and hands the renderer
// the hover position so buttons can light up.

import { LAYOUT, INGREDIENTS, binRect, ticketRect, burnerRect, pointIn } from './config.js';
import { SCREEN_TITLE, SCREEN_PLAY, SCREEN_PAUSED, SCREEN_OVER } from './world.js';

export class Input {
  constructor(canvas, hooks) {
    this.canvas = canvas;
    this.hooks = hooks;
    this.hover = { x: -1, y: -1 };
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    canvas.addEventListener('mousemove', (event) => {
      const point = this.toLogical(event);
      this.hover.x = point.x;
      this.hover.y = point.y;
    });
    canvas.addEventListener('mouseleave', () => {
      this.hover.x = -1;
      this.hover.y = -1;
    });
    canvas.addEventListener('click', (event) => {
      const point = this.toLogical(event);
      this.hooks.onClick(point.x, point.y);
    });
    window.addEventListener('keydown', (event) => {
      if (event.repeat) return;
      this.hooks.onKey(event.key);
    });
  }

  /** Map a pointer event to logical field coordinates, honouring the fit scale. */
  toLogical(event) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left - this.offsetX) / this.scale,
      y: (event.clientY - rect.top - this.offsetY) / this.scale,
    };
  }

  /** Called by the renderer each frame with the scale it used. */
  setTransform(scale, offsetX, offsetY) {
    this.scale = scale;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
  }
}

/** Which button the point is over, if any. Shared by input and the renderer. */
export function hitZone(world, x, y) {
  const screen = world.screen;
  if (screen === SCREEN_TITLE) {
    if (pointIn({ x: 490, y: 560, w: 300, h: 64 }, x, y)) return 'start';
    if (pointIn({ x: 1210, y: 12, w: 56, h: 40 }, x, y)) return 'mute';
    return null;
  }
  if (screen === SCREEN_OVER) {
    if (pointIn({ x: 490, y: 560, w: 300, h: 64 }, x, y)) return 'restart';
    if (pointIn({ x: 1210, y: 12, w: 56, h: 40 }, x, y)) return 'mute';
    return null;
  }
  if (screen === SCREEN_PAUSED) {
    if (pointIn({ x: 490, y: 400, w: 300, h: 64 }, x, y)) return 'resume';
    if (pointIn({ x: 490, y: 480, w: 300, h: 64 }, x, y)) return 'restart';
    if (pointIn({ x: 1210, y: 12, w: 56, h: 40 }, x, y)) return 'mute';
    return null;
  }
  // SCREEN_PLAY
  if (pointIn({ x: 1136, y: 12, w: 56, h: 40 }, x, y)) return 'pause';
  if (pointIn({ x: 1210, y: 12, w: 56, h: 40 }, x, y)) return 'mute';
  for (let index = 0; index < world.orders.length; index += 1) {
    if (pointIn(ticketRect(index), x, y)) return `order:${index}`;
  }
  for (let index = 0; index < world.burners.length; index += 1) {
    if (pointIn(burnerRect(index), x, y)) return `burner:${index}`;
  }
  if (pointIn(LAYOUT.serveButton, x, y)) return 'serve';
  if (pointIn(LAYOUT.trash, x, y)) return 'trash';
  for (let index = 0; index < INGREDIENTS.length; index += 1) {
    if (pointIn(binRect(index), x, y)) return `ingredient:${INGREDIENTS[index].id}`;
  }
  return null;
}

/** Handle one click, given the zone it hit. Returns true when it did something. */
export function handleClick(world, sounds, zone) {
  if (zone === null) return false;
  if (zone === 'mute') {
    sounds.muted = !sounds.muted;
    return true;
  }
  if (world.screen === SCREEN_TITLE && zone === 'start') {
    sounds.unlock();
    world.startShift();
    sounds.click();
    return true;
  }
  if (world.screen === SCREEN_OVER && zone === 'restart') {
    sounds.unlock();
    world.startShift();
    sounds.click();
    return true;
  }
  if (world.screen === SCREEN_PAUSED) {
    if (zone === 'resume') {
      world.screen = SCREEN_PLAY;
      sounds.click();
      return true;
    }
    if (zone === 'restart') {
      world.startShift();
      sounds.click();
      return true;
    }
    return false;
  }
  if (world.screen !== SCREEN_PLAY) return false;
  if (zone === 'pause') {
    world.screen = SCREEN_PAUSED;
    sounds.click();
    return true;
  }
  if (zone.startsWith('order:')) {
    world.selectOrder(Number(zone.slice(6)));
    sounds.click();
    return true;
  }
  if (zone.startsWith('burner:')) {
    const index = Number(zone.slice(7));
    const burner = world.burners[index];
    if (burner && burner.burnt) {
      world.clearBurnt(index);
      sounds.click();
      return true;
    }
    if (burner && burner.ready) {
      const event = world.takeReady(index);
      if (event === 0) sounds.add();
      else sounds.error();
      return true;
    }
    return false;
  }
  if (zone === 'serve') {
    const event = world.serve();
    if (event === 1) sounds.serve();
    else sounds.error();
    return true;
  }
  if (zone === 'trash') {
    world.trashPlate();
    sounds.click();
    return true;
  }
  if (zone.startsWith('ingredient:')) {
    const id = zone.slice(11);
    const before = world.burners.filter((burner) => burner.item !== null).length;
    const event = world.addIngredient(id);
    const after = world.burners.filter((burner) => burner.item !== null).length;
    if (after > before) sounds.cookStart();
    else if (event === 0) sounds.add();
    else sounds.error();
    return true;
  }
  return false;
}

/** Handle one key press. */
export function handleKey(world, sounds, key) {
  const lower = key.toLowerCase();
  if (lower === 'm') {
    sounds.muted = !sounds.muted;
    return;
  }
  if (world.screen === SCREEN_TITLE && (key === 'Enter' || key === ' ')) {
    sounds.unlock();
    world.startShift();
    sounds.click();
    return;
  }
  if (world.screen === SCREEN_OVER && (lower === 'r' || key === 'Enter' || key === ' ')) {
    sounds.unlock();
    world.startShift();
    sounds.click();
    return;
  }
  if (world.screen === SCREEN_PAUSED) {
    if (lower === 'p' || key === 'Escape') {
      world.screen = SCREEN_PLAY;
      sounds.click();
    } else if (lower === 'r') {
      world.startShift();
      sounds.click();
    }
    return;
  }
  if (world.screen !== SCREEN_PLAY) return;
  if (lower === 'p' || key === 'Escape') {
    world.screen = SCREEN_PAUSED;
    sounds.click();
    return;
  }
  if (lower === 'r') {
    world.startShift();
    sounds.click();
    return;
  }
  if (key === 'Enter' || lower === 's') {
    const event = world.serve();
    if (event === 1) sounds.serve();
    else sounds.error();
    return;
  }
  if (lower === 't') {
    world.trashPlate();
    sounds.click();
    return;
  }
  const ingredient = INGREDIENTS.find((item) => item.key === key);
  if (ingredient) {
    const before = world.burners.filter((burner) => burner.item !== null).length;
    const event = world.addIngredient(ingredient.id);
    const after = world.burners.filter((burner) => burner.item !== null).length;
    if (after > before) sounds.cookStart();
    else if (event === 0) sounds.add();
    else sounds.error();
  }
}
