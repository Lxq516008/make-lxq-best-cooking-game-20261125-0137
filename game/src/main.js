// Wok Rush — boot and the main loop. A fixed 60 Hz simulation step, a canvas
// renderer that scales the 1280x720 field to the window, and the wiring between
// input, the world and the sound bank. With ?shot=<name> in the URL the game
// stages one frozen scene for screenshots instead of playing.

import { STEP } from './config.js';
import { World, SCREEN_TITLE, SCREEN_PLAY, SCREEN_PAUSED, SCREEN_OVER, EVENT_WRONG, EVENT_EXPIRED, EVENT_OVER, EVENT_RUSH } from './world.js';
import { Renderer } from './render.js';
import { Input, hitZone, handleClick, handleKey } from './input.js';
import { SoundBank } from './audio.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = shotName ? 1 : (Date.now() % 2147483647);

const world = new World(seed);
const sounds = new SoundBank();
// A handle for testing and for the finalist review to poke at the live game.
window.__wokRush = { world, sounds };
window.__hitZone = (x, y) => hitZone(world, x, y);
const input = new Input(canvas, {
  onClick(x, y) {
    sounds.unlock();
    handleClick(world, sounds, hitZone(world, x, y));
  },
  onKey(key) {
    sounds.unlock();
    handleKey(world, sounds, key);
  },
});
const renderer = new Renderer(canvas, input);

function resize() {
  renderer.resize();
}
window.addEventListener('resize', resize);
resize();

function announce() {
  if (!status) return;
  if (world.screen === SCREEN_TITLE) status.textContent = 'Wok Rush. Press Enter to start your shift.';
  else if (world.screen === SCREEN_OVER) status.textContent = `Shift over. Score ${world.score}, ${world.served} dishes served. Press R to play again.`;
  else if (world.screen === SCREEN_PAUSED) status.textContent = 'Paused.';
  else status.textContent = `Score ${world.score}. ${Math.ceil(world.timeLeft)} seconds left in the shift. ${world.orders.length} orders on the board.`;
}

if (shotName) {
  // Screenshot mode: one staged frame, frozen, no simulation.
  stageShot(shotName, world);
  renderer.draw(world);
  document.title = `Wok Rush — shot ${shotName}`;
} else {
  let last = performance.now();
  let accumulator = 0;
  let lastScreen = world.screen;
  let lastTickSecond = -1;
  let lastReady = [false, false];

  function frame(now) {
    const elapsed = Math.min(0.25, (now - last) / 1000);
    last = now;
    if (world.screen === SCREEN_PLAY) {
      accumulator += elapsed;
      while (accumulator >= STEP) {
        accumulator -= STEP;
        const events = world.step(STEP);
        if (events & EVENT_OVER) sounds.fanfare();
        else if (events & EVENT_RUSH) sounds.rush();
        else if (events & EVENT_EXPIRED) sounds.error();
        else if (events & EVENT_WRONG) sounds.error();
        // A burner that just finished cooking rings its bell.
        world.burners.forEach((burner, index) => {
          if (burner.ready && !burner.burnt && !lastReady[index]) sounds.ding();
          lastReady[index] = burner.ready && !burner.burnt;
        });
        // Tick while an order is nearly out of time.
        const urgent = world.orders.find((order) => order.timeLeft <= 5);
        if (urgent) {
          const second = Math.ceil(urgent.timeLeft);
          if (second !== lastTickSecond) {
            lastTickSecond = second;
            sounds.tick();
          }
        } else {
          lastTickSecond = -1;
        }
      }
    }
    renderer.draw(world);
    if (world.screen !== lastScreen) {
      lastScreen = world.screen;
      announce();
    }
    requestAnimationFrame(frame);
  }
  announce();
  requestAnimationFrame(frame);
}
