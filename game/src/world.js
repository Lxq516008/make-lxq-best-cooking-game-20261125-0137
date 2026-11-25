// Wok Rush — the game state and the rules: orders, the assembly plate, the two
// burners, serving, scoring, combos and the shift timer. Nothing here draws.

import {
  STEP, SHIFT_SECONDS, ORDER_TIME, ORDER_INTERVAL, MAX_ORDERS,
  COOK_SECONDS, BURN_SECONDS, TIME_BONUS_PER_SECOND,
  MISTAKE_POINTS, COMBO_STEP, COMBO_MAX, STAR_SCORES,
  INGREDIENTS, RECIPES, makeRandom,
} from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

export const EVENT_NONE = 0;
export const EVENT_SERVED = 1;
export const EVENT_WRONG = 2;
export const EVENT_EXPIRED = 4;
export const EVENT_OVER = 8;
export const EVENT_RUSH = 16;

/** A multiset compare: the plate matches a recipe when it holds exactly its ingredients. */
function matchesRecipe(plate, recipe) {
  if (plate.length !== recipe.ingredients.length) return false;
  const wanted = [...recipe.ingredients].sort();
  const got = [...plate].sort();
  for (let index = 0; index < wanted.length; index += 1) {
    if (wanted[index] !== got[index]) return false;
  }
  return true;
}

export function recipeOf(id) {
  return RECIPES.find((recipe) => recipe.id === id);
}

export function ingredientOf(id) {
  return INGREDIENTS.find((ingredient) => ingredient.id === id);
}

export class World {
  constructor(seed) {
    this.random = makeRandom(seed);
    this.reset();
  }

  reset() {
    this.screen = SCREEN_TITLE;
    this.timeLeft = SHIFT_SECONDS;
    this.elapsed = 0;
    this.score = 0;
    this.coins = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.served = 0;
    this.mistakes = 0;
    this.expired = 0;
    this.orders = [];
    this.plate = [];
    this.burners = [
      { item: null, progress: 0, ready: false, burnLeft: 0, burnt: false },
      { item: null, progress: 0, ready: false, burnLeft: 0, burnt: false },
    ];
    this.selectedOrder = 0;
    this.spawnIn = 2;
    this.nextOrderId = 1;
    this.rush = false;
    this.floaters = [];
    this.sparkles = [];
    this.platePop = 0;
    this.flash = null;
    this.servedFlash = 0;
    this.best = 0;
    try {
      this.best = Number(window.localStorage.getItem('wok-rush.best') ?? 0) || 0;
    } catch {
      this.best = 0;
    }
  }

  /** How far through the shift we are, 0 to 1: pressure grows with it. */
  progress() {
    return Math.min(1, this.elapsed / SHIFT_SECONDS);
  }

  orderTimeLimit() {
    return ORDER_TIME.start + (ORDER_TIME.end - ORDER_TIME.start) * this.progress();
  }

  spawnInterval() {
    return ORDER_INTERVAL.start + (ORDER_INTERVAL.end - ORDER_INTERVAL.start) * this.progress();
  }

  startShift() {
    this.reset();
    this.screen = SCREEN_PLAY;
    this.spawnOrder();
    this.spawnOrder();
  }

  spawnOrder() {
    if (this.orders.length >= MAX_ORDERS) return;
    const recipe = RECIPES[Math.floor(this.random() * RECIPES.length)];
    const limit = this.orderTimeLimit();
    this.orders.push({
      id: this.nextOrderId,
      recipeId: recipe.id,
      timeLeft: limit,
      timeMax: limit,
      born: this.elapsed,
    });
    this.nextOrderId += 1;
    if (this.selectedOrder >= this.orders.length) this.selectedOrder = 0;
  }

  selectOrder(index) {
    if (index >= 0 && index < this.orders.length) this.selectedOrder = index;
  }

  /** Put a raw ingredient on a free burner, or add a ready one to the plate. */
  addIngredient(id) {
    if (this.screen !== SCREEN_PLAY) return EVENT_NONE;
    const ingredient = ingredientOf(id);
    if (!ingredient) return EVENT_NONE;
    if (ingredient.cooks) {
      const burner = this.burners.find((item) => item.item === null);
      if (!burner) return EVENT_WRONG;
      burner.item = id;
      burner.progress = 0;
      burner.ready = false;
      burner.burnt = false;
      return EVENT_NONE;
    }
    return this.addToPlate(id);
  }

  /** A cooked item sitting ready on a burner goes onto the plate when clicked. */
  takeReady(burnerIndex) {
    const burner = this.burners[burnerIndex];
    if (!burner || !burner.ready || burner.burnt) return EVENT_NONE;
    const id = burner.item;
    burner.item = null;
    burner.ready = false;
    burner.progress = 0;
    return this.addToPlate(id);
  }

  /** Clear a burnt item off a burner. */
  clearBurnt(burnerIndex) {
    const burner = this.burners[burnerIndex];
    if (!burner || !burner.burnt) return EVENT_NONE;
    burner.item = null;
    burner.progress = 0;
    burner.ready = false;
    burner.burnt = false;
    return EVENT_NONE;
  }

  addToPlate(id) {
    if (this.plate.length >= 5) return EVENT_WRONG;
    this.plate.push(id);
    this.platePop = 0.28;
    return EVENT_NONE;
  }

  trashPlate() {
    if (this.plate.length === 0) return EVENT_NONE;
    this.plate = [];
    return EVENT_NONE;
  }

  /** Serve the plate to the selected order. Returns an event flag. */
  serve() {
    if (this.screen !== SCREEN_PLAY) return EVENT_NONE;
    if (this.plate.length === 0 || this.orders.length === 0) return EVENT_WRONG;
    const order = this.orders[this.selectedOrder] ?? this.orders[0];
    const recipe = recipeOf(order.recipeId);
    if (!matchesRecipe(this.plate, recipe)) {
      this.mistakes += 1;
      this.combo = 0;
      this.score = Math.max(0, this.score - MISTAKE_POINTS);
      this.plate = [];
      this.flash = { text: 'WRONG DISH  -25', color: '#e5534b', until: this.elapsed + 1.2 };
      this.floaters.push({ x: 660, y: 400, text: '-25', color: '#e5534b', life: 1.2 });
      return EVENT_WRONG;
    }
    const multiplier = 1 + Math.min(this.combo, 8) * COMBO_STEP;
    const capped = Math.min(multiplier, COMBO_MAX);
    const points = Math.round((recipe.points + order.timeLeft * TIME_BONUS_PER_SECOND) * capped);
    this.score += points;
    this.coins += Math.max(1, Math.round(points / 10));
    this.combo += 1;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    this.served += 1;
    this.plate = [];
    this.orders.splice(this.orders.indexOf(order), 1);
    if (this.selectedOrder >= this.orders.length) this.selectedOrder = Math.max(0, this.orders.length - 1);
    this.servedFlash = 1;
    this.floaters.push({ x: 880, y: 400, text: `+${points}`, color: '#2e7d32', life: 1.4 });
    // Coin sparkles burst out of the serving window.
    for (let index = 0; index < 16; index += 1) {
      const angle = this.random() * Math.PI * 2;
      const speed = 60 + this.random() * 140;
      this.sparkles.push({
        x: 880, y: 470,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 60,
        life: 0.7 + this.random() * 0.4, maxLife: 1.1,
        size: 4 + this.random() * 6,
        color: index % 3 === 0 ? '#ffffff' : index % 3 === 1 ? '#ffc93c' : '#ff8c42',
      });
    }
    if (this.combo >= 3) {
      this.floaters.push({ x: 880, y: 440, text: `COMBO x${capped.toFixed(2).replace(/0$/, '')}`, color: '#b8860b', life: 1.4 });
    }
    return EVENT_SERVED;
  }

  /** One fixed step of the simulation. `move` is unused here; input acts directly. */
  step(dt) {
    if (this.screen !== SCREEN_PLAY) return EVENT_NONE;
    let events = EVENT_NONE;
    this.elapsed += dt;
    this.timeLeft = Math.max(0, SHIFT_SECONDS - this.elapsed);

    if (!this.rush && this.elapsed >= SHIFT_SECONDS / 2) {
      this.rush = true;
      events |= EVENT_RUSH;
    }

    // New orders arrive faster as the shift goes on.
    this.spawnIn -= dt;
    if (this.spawnIn <= 0) {
      this.spawnOrder();
      this.spawnIn = this.spawnInterval() * (0.85 + this.random() * 0.3);
    }

    // Orders count down; an expired one walks out.
    for (let index = this.orders.length - 1; index >= 0; index -= 1) {
      const order = this.orders[index];
      order.timeLeft -= dt;
      if (order.timeLeft <= 0) {
        this.orders.splice(index, 1);
        this.expired += 1;
        this.mistakes += 1;
        this.combo = 0;
        this.score = Math.max(0, this.score - MISTAKE_POINTS);
        if (this.selectedOrder >= this.orders.length) this.selectedOrder = Math.max(0, this.orders.length - 1);
        this.flash = { text: 'ORDER WALKED OUT  -25', color: '#e5534b', until: this.elapsed + 1.2 };
        events |= EVENT_EXPIRED;
      }
    }

    // Burners cook, then burn.
    for (const burner of this.burners) {
      if (burner.item === null) continue;
      if (!burner.ready) {
        burner.progress += dt / COOK_SECONDS;
        if (burner.progress >= 1) {
          burner.progress = 1;
          burner.ready = true;
          burner.burnLeft = BURN_SECONDS;
        }
      } else if (!burner.burnt) {
        burner.burnLeft -= dt;
        if (burner.burnLeft <= 0) {
          burner.burnt = true;
        }
      }
    }

    for (let index = this.floaters.length - 1; index >= 0; index -= 1) {
      const floater = this.floaters[index];
      floater.life -= dt;
      floater.y -= 28 * dt;
      if (floater.life <= 0) this.floaters.splice(index, 1);
    }
    for (let index = this.sparkles.length - 1; index >= 0; index -= 1) {
      const sparkle = this.sparkles[index];
      sparkle.life -= dt;
      sparkle.x += sparkle.vx * dt;
      sparkle.y += sparkle.vy * dt;
      sparkle.vy += 260 * dt;
      if (sparkle.life <= 0) this.sparkles.splice(index, 1);
    }
    if (this.platePop > 0) this.platePop = Math.max(0, this.platePop - dt);
    if (this.servedFlash > 0) this.servedFlash = Math.max(0, this.servedFlash - dt * 2);

    if (this.timeLeft <= 0) {
      this.screen = SCREEN_OVER;
      if (this.score > this.best) {
        this.best = this.score;
        try {
          window.localStorage.setItem('wok-rush.best', String(this.best));
        } catch {
          // Storage may be unavailable; the best score is a nicety, not a rule.
        }
      }
      events |= EVENT_OVER;
    }
    return events;
  }

  /** Stars earned at the end of the shift, 0 to 3. */
  stars() {
    let count = 0;
    for (const threshold of STAR_SCORES) {
      if (this.score >= threshold) count += 1;
    }
    return count;
  }
}
