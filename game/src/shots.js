// Wok Rush — the screenshot scenes behind ?shot=cover|assembly|serve|end.
// Each one builds a fixed game state directly (orders, plate, burners, timer,
// score), so the frame is what a real game looks like at that moment and the
// same shot always gives the same frame. The game is frozen on that frame:
// the main loop draws once and does not advance the simulation.

import { SCREEN_PLAY, SCREEN_OVER } from './world.js';

function setOrder(world, id, recipeId, timeLeft, timeMax) {
  world.orders.push({ id, recipeId, timeLeft, timeMax, born: 0 });
}

/**
 * Stage the named scene on `world` and return the screen to draw.
 * Any other name stages the cover.
 */
export function stageShot(name, world) {
  world.reset();
  if (name === 'end') {
    world.screen = SCREEN_OVER;
    world.score = 1240;
    world.coins = 124;
    world.served = 11;
    world.mistakes = 2;
    world.expired = 1;
    world.combo = 0;
    world.bestCombo = 5;
    world.best = 1240;
    return { screen: SCREEN_OVER };
  }
  world.screen = SCREEN_PLAY;
  if (name === 'assembly') {
    world.elapsed = 20;
    world.timeLeft = 100;
    world.score = 150;
    world.coins = 15;
    world.combo = 1;
    setOrder(world, 1, 'burger', 38, 50);
    setOrder(world, 2, 'noodles', 22, 44);
    world.selectedOrder = 0;
    world.plate = ['bun', 'patty', 'lettuce', 'tomato'];
    world.burners[0] = { item: 'patty', progress: 0.6, ready: false, burnLeft: 0, burnt: false };
    return { screen: SCREEN_PLAY };
  }
  if (name === 'serve') {
    world.elapsed = 52;
    world.timeLeft = 68;
    world.score = 480;
    world.coins = 48;
    world.combo = 3;
    setOrder(world, 1, 'burger', 12, 50);
    setOrder(world, 2, 'salad', 30, 44);
    world.selectedOrder = 0;
    world.plate = ['bun', 'patty', 'lettuce', 'tomato', 'cheese'];
    world.burners[0] = { item: 'noodles', progress: 1, ready: true, burnLeft: 3.5, burnt: false };
    world.servedFlash = 1;
    world.floaters.push({ x: 700, y: 380, text: '+185', color: '#2e7d32', life: 1.4 });
    return { screen: SCREEN_PLAY };
  }
  // Cover: as much of the game as possible in one frame.
  world.elapsed = 35;
  world.timeLeft = 85;
  world.score = 320;
  world.coins = 32;
  world.combo = 3;
  setOrder(world, 1, 'burger', 32, 50);
  setOrder(world, 2, 'noodles', 18, 44);
  setOrder(world, 3, 'salad', 40, 48);
  world.selectedOrder = 0;
  world.plate = ['bun', 'patty', 'lettuce'];
  world.burners[0] = { item: 'patty', progress: 0.6, ready: false, burnLeft: 0, burnt: false };
  world.burners[1] = { item: 'noodles', progress: 1, ready: true, burnLeft: 3.5, burnt: false };
  world.servedFlash = 1;
  world.floaters.push({ x: 700, y: 380, text: '+140', color: '#2e7d32', life: 1.4 });
  return { screen: SCREEN_PLAY };
}
