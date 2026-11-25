// Wok Rush — everything the player sees, drawn with the canvas 2D API: the
// kitchen, the order board, the stove, the counter bins, the assembly plate,
// the serving window, the title / pause / end screens. No images, no fonts
// loaded over the network: every picture here is drawn in code.

import { FIELD, FONT, PALETTE, LAYOUT, INGREDIENTS, MAX_ORDERS, binRect, ticketRect, burnerRect, pointIn } from './config.js';
import { SCREEN_TITLE, SCREEN_PLAY, SCREEN_PAUSED, SCREEN_OVER, recipeOf } from './world.js';

export { SCREEN_TITLE, SCREEN_PLAY, SCREEN_PAUSED, SCREEN_OVER };

function roundRect(ctx, x, y, w, h, radius) {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, value, x, y, size, color, weight, align) {
  ctx.fillStyle = color;
  ctx.font = `${weight ?? 700} ${size}px ${FONT}`;
  ctx.textAlign = align ?? 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
}

/**
 * A chunky casual-games card: soft shadow, bright fill, thick dark outline.
 * Everything the player touches is drawn this way so it reads at a glance.
 */
function card(ctx, x, y, w, h, radius, fill, outline, outlineWidth) {
  ctx.save();
  ctx.shadowColor = 'rgba(43,33,24,0.3)';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 5;
  ctx.fillStyle = fill;
  roundRect(ctx, x, y, w, h, radius);
  ctx.fill();
  ctx.restore();
  if (outline) {
    ctx.strokeStyle = outline;
    ctx.lineWidth = outlineWidth ?? 4;
    roundRect(ctx, x, y, w, h, radius);
    ctx.stroke();
  }
}

/** A simple happy face: two dot eyes, a smile and blush cheeks. */
function face(ctx, eyeSpread, eyeY, smileY, smileR, blushY) {
  ctx.fillStyle = '#2b2118';
  ctx.beginPath();
  ctx.arc(-eyeSpread, eyeY, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(eyeSpread, eyeY, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2b2118';
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0, smileY, smileR, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,120,120,0.75)';
  ctx.beginPath();
  ctx.arc(-eyeSpread - 8, blushY, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(eyeSpread + 8, blushY, 4, 0, Math.PI * 2);
  ctx.fill();
}

/** The face each ingredient wears, in its own local coordinates. */
function ingredientFace(ctx, id) {
  if (id === 'bun') face(ctx, 9, -6, 2, 6, 2);
  else if (id === 'patty') face(ctx, 10, -4, 3, 6, 4);
  else if (id === 'lettuce') face(ctx, 9, -2, 5, 6, 5);
  else if (id === 'tomato') face(ctx, 9, 0, 7, 7, 7);
  else if (id === 'cheese') face(ctx, 7, -2, 4, 6, 5);
  else if (id === 'egg') face(ctx, 10, -10, 12, 6, 4);
  else if (id === 'noodles') face(ctx, 9, 14, 19, 5, 20);
}

/** Draw one ingredient as vector art, centred at (x, y), about `size` wide. */
export function drawIngredient(ctx, id, x, y, size, cooked) {
  const s = size / 64;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  if (id === 'bun') {
    ctx.fillStyle = '#e8b06a';
    ctx.beginPath();
    ctx.arc(0, 6, 26, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#d99a4e';
    ctx.fillRect(-26, 4, 52, 8);
    ctx.fillStyle = '#fff3d6';
    for (const [dx, dy] of [[-12, -8], [0, -14], [12, -8], [-6, -2], [8, -3]]) {
      ctx.beginPath();
      ctx.ellipse(dx, dy, 3, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'patty') {
    ctx.fillStyle = cooked === false ? '#c98a6b' : '#7a4a2b';
    roundRect(ctx, -28, -14, 56, 28, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 3;
    for (const dx of [-16, 0, 16]) {
      ctx.beginPath();
      ctx.moveTo(dx, -10);
      ctx.lineTo(dx, 10);
      ctx.stroke();
    }
  } else if (id === 'lettuce') {
    ctx.fillStyle = '#5fbf5a';
    for (const [dx, dy, r] of [[-14, 4, 14], [0, -6, 16], [14, 4, 14], [0, 8, 15]]) {
      ctx.beginPath();
      ctx.arc(dx, dy, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = '#3e8f3a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-18, 2);
    ctx.quadraticCurveTo(0, 12, 18, 2);
    ctx.stroke();
  } else if (id === 'tomato') {
    ctx.fillStyle = '#e5534b';
    ctx.beginPath();
    ctx.arc(0, 2, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c73e36';
    ctx.beginPath();
    ctx.arc(-7, -5, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4caf50';
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(-10, -28);
    ctx.lineTo(-2, -18);
    ctx.lineTo(2, -28);
    ctx.lineTo(10, -20);
    ctx.closePath();
    ctx.fill();
  } else if (id === 'cheese') {
    ctx.fillStyle = '#f2c94c';
    ctx.beginPath();
    ctx.moveTo(-26, 14);
    ctx.lineTo(0, -20);
    ctx.lineTo(26, 14);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#d9a92e';
    for (const [dx, dy] of [[-8, 2], [6, 6], [-2, -6]]) {
      ctx.beginPath();
      ctx.arc(dx, dy, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'egg') {
    ctx.fillStyle = '#fdf3d8';
    for (const [dx, dy, r] of [[-12, 6, 13], [4, -8, 14], [12, 8, 12], [0, 6, 14]]) {
      ctx.beginPath();
      ctx.arc(dx, dy, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#f5a623';
    ctx.beginPath();
    ctx.arc(2, 2, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd76a';
    ctx.beginPath();
    ctx.arc(-1, -1, 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'noodles') {
    ctx.fillStyle = '#e8e8e8';
    ctx.beginPath();
    ctx.arc(0, 4, 26, 0, Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#f0c040';
    ctx.lineWidth = 4;
    for (let index = 0; index < 3; index += 1) {
      ctx.beginPath();
      ctx.moveTo(-18, -6 + index * 8);
      ctx.quadraticCurveTo(-9, -12 + index * 8, 0, -6 + index * 8);
      ctx.quadraticCurveTo(9, 0 + index * 8, 18, -6 + index * 8);
      ctx.stroke();
    }
    ctx.fillStyle = '#5fbf5a';
    ctx.beginPath();
    ctx.arc(14, -10, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  // Every ingredient is a little mascot with a happy face.
  ingredientFace(ctx, id);
  ctx.restore();
}

export class Renderer {
  constructor(canvas, input) {
    this.canvas = canvas;
    this.input = input;
    this.ctx = canvas.getContext('2d');
  }

  resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const scale = Math.min(width / FIELD.width, height / FIELD.height);
    const offsetX = (width - FIELD.width * scale) / 2;
    const offsetY = (height - FIELD.height * scale) / 2;
    const ratio = window.devicePixelRatio ?? 1;
    this.canvas.width = Math.round(width * ratio);
    this.canvas.height = Math.round(height * ratio);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.scale = scale;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.ratio = ratio;
    this.input.setTransform(scale * ratio, offsetX * ratio, offsetY * ratio);
  }

  draw(world) {
    const ctx = this.ctx;
    ctx.setTransform(this.ratio, 0, 0, this.ratio, 0, 0);
    ctx.fillStyle = '#1d1410';
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.setTransform(this.ratio * this.scale, 0, 0, this.ratio * this.scale, this.ratio * this.offsetX, this.ratio * this.offsetY);
    this.drawKitchen(ctx, world);
    if (world.screen === SCREEN_TITLE) this.drawTitle(ctx, world);
    else if (world.screen === SCREEN_OVER) this.drawOver(ctx, world);
    else {
      this.drawPlay(ctx, world);
      if (world.screen === SCREEN_PAUSED) this.drawPaused(ctx, world);
    }
  }

  drawKitchen(ctx, world) {
    // Wall, floor and counter.
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(0, 0, FIELD.width, 400);
    ctx.fillStyle = PALETTE.wallTop;
    ctx.fillRect(0, 0, FIELD.width, 24);
    ctx.fillStyle = PALETTE.floor;
    ctx.fillRect(0, 400, FIELD.width, 320);
    ctx.fillStyle = PALETTE.floorDark;
    for (let x = 0; x < FIELD.width; x += 160) {
      ctx.fillRect(x, 400, 4, 320);
    }
    // Counter band the bins sit on.
    ctx.fillStyle = PALETTE.counter;
    ctx.fillRect(0, 584, FIELD.width, 136);
    ctx.fillStyle = PALETTE.counterTop;
    ctx.fillRect(0, 584, FIELD.width, 12);
    // Teal tile band where the wall meets the floor, and a warm light glow.
    ctx.fillStyle = PALETTE.teal;
    ctx.fillRect(0, 388, FIELD.width, 12);
    const glow = ctx.createRadialGradient(640, 300, 60, 640, 300, 620);
    glow.addColorStop(0, 'rgba(255,220,120,0.20)');
    glow.addColorStop(1, 'rgba(255,220,120,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, FIELD.width, 584);
    // Wall tiles and a hanging shelf with pots.
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    for (let x = 40; x < FIELD.width; x += 120) {
      ctx.fillRect(x, 40, 100, 4);
    }
    ctx.fillStyle = '#6b4a2f';
    ctx.fillRect(60, 96, 220, 10);
    for (const [x, color] of [[80, '#c9d1d9'], [140, '#e8b06a'], [200, '#8a5a3b']]) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, 78, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x - 18, 78, 36, 6);
    }
    // Sink on the left wall.
    ctx.fillStyle = PALETTE.steel;
    roundRect(ctx, 340, 96, 120, 64, 10);
    ctx.fill();
    ctx.fillStyle = '#7fb3d5';
    roundRect(ctx, 352, 106, 96, 44, 8);
    ctx.fill();
    ctx.fillStyle = PALETTE.steelDark;
    ctx.fillRect(392, 78, 8, 24);
    ctx.fillRect(392, 78, 24, 8);
  }

  drawTopBar(ctx, world) {
    const bar = LAYOUT.topBar;
    ctx.fillStyle = PALETTE.purple;
    ctx.fillRect(bar.x, bar.y, bar.w, bar.h);
    ctx.fillStyle = PALETTE.purpleDark;
    ctx.fillRect(bar.x, bar.y + bar.h - 6, bar.w, 6);
    text(ctx, 'WOK RUSH', 24, 32, 30, '#ffd76a', 800);
    // Score and coins as chunky pills with a gold coin.
    card(ctx, 300, 12, 190, 40, 20, '#ffffff', PALETTE.purpleDark, 3);
    ctx.fillStyle = '#ffc93c';
    ctx.beginPath();
    ctx.arc(326, 32, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b8860b';
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, 'S', 326, 33, 14, '#b8860b', 800, 'center');
    text(ctx, `SCORE ${world.score}`, 346, 33, 19, '#2b2118', 800);
    card(ctx, 506, 12, 140, 40, 20, '#fff3d6', PALETTE.purpleDark, 3);
    ctx.fillStyle = '#ffc93c';
    ctx.beginPath();
    ctx.arc(530, 32, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b8860b';
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, '$', 530, 33, 14, '#b8860b', 800, 'center');
    text(ctx, `${world.coins}`, 550, 33, 19, '#2b2118', 800);
    // Shift timer, big and impossible to miss.
    const minutes = Math.floor(world.timeLeft / 60);
    const seconds = Math.floor(world.timeLeft % 60);
    const timeText = `${minutes}:${String(seconds).padStart(2, '0')}`;
    const low = world.timeLeft <= 15;
    text(ctx, 'TIME', 700, 14, 11, '#d9c49a', 700, 'center');
    text(ctx, timeText, 700, 38, 34, low ? '#ff6b5e' : '#ffffff', 800, 'center');
    const barWidth = 130;
    const fraction = Math.max(0, world.timeLeft / 120);
    ctx.fillStyle = '#241a14';
    roundRect(ctx, 700 - barWidth / 2, 54, barWidth, 7, 4);
    ctx.fill();
    ctx.fillStyle = low ? '#ff5a3c' : '#22c55e';
    roundRect(ctx, 700 - barWidth / 2, 54, barWidth * fraction, 7, 4);
    ctx.fill();
    if (world.combo >= 2) {
      card(ctx, 800, 12, 150, 40, 20, '#ff8c42', PALETTE.purpleDark, 3);
      text(ctx, `COMBO x${(1 + Math.min(world.combo, 8) * 0.25).toFixed(2).replace(/0$/, '')}`, 875, 33, 19, '#ffffff', 800, 'center');
    }
    this.drawSmallButton(ctx, { x: 1136, y: 12, w: 56, h: 40 }, world.screen === SCREEN_PAUSED ? '▶' : 'II', world);
    this.drawSmallButton(ctx, { x: 1210, y: 12, w: 56, h: 40 }, '♪', world);
  }

  drawSmallButton(ctx, rect, label, world) {
    const hovered = this.input && pointIn(rect, this.input.hover.x, this.input.hover.y);
    card(ctx, rect.x, rect.y, rect.w, rect.h, 10, hovered ? '#7a3fa8' : '#4a2067', PALETTE.purpleDark, 3);
    text(ctx, label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1, 18, '#fff8e7', 800, 'center');
  }

  drawBoard(ctx, world) {
    const board = LAYOUT.board;
    card(ctx, board.x, board.y, board.w, board.h, 16, PALETTE.board, PALETTE.purpleDark, 5);
    text(ctx, 'ORDER BOARD', board.x + 16, board.y + 24, 18, '#ffd76a', 800);
    text(ctx, 'click a ticket', board.x + board.w - 16, board.y + 24, 11, '#d9c49a', 600, 'right');
    for (let index = 0; index < MAX_ORDERS; index += 1) {
      const rect = ticketRect(index);
      const order = world.orders[index];
      if (!order) {
        ctx.fillStyle = 'rgba(255,248,231,0.08)';
        roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 10);
        ctx.fill();
        ctx.setLineDash([6, 6]);
        ctx.strokeStyle = 'rgba(255,248,231,0.25)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]);
        text(ctx, 'waiting for the next order…', rect.x + rect.w / 2, rect.y + rect.h / 2, 13, 'rgba(255,248,231,0.5)', 600, 'center');
        continue;
      }
      const recipe = recipeOf(order.recipeId);
      const selected = index === world.selectedOrder;
      card(ctx, rect.x, rect.y, rect.w, rect.h, 12, selected ? '#fff3d6' : PALETTE.boardPaper, selected ? '#ff8c42' : PALETTE.purple, selected ? 5 : 3);
      const low = order.timeLeft <= 10;
      text(ctx, recipe.name, rect.x + 12, rect.y + 18, 17, PALETTE.text, 800);
      text(ctx, `${Math.ceil(order.timeLeft)}s`, rect.x + rect.w - 12, rect.y + 18, 18, low ? '#ff5a3c' : '#2e7d32', 800, 'right');
      // Ingredient icons for the recipe.
      recipe.ingredients.forEach((id, i) => {
        drawIngredient(ctx, id, rect.x + 26 + i * 34, rect.y + 46, 26, id === 'patty' || id === 'noodles' ? true : undefined);
      });
      const fraction = Math.max(0, order.timeLeft / order.timeMax);
      ctx.fillStyle = '#e8dcc0';
      roundRect(ctx, rect.x + 12, rect.y + 62, rect.w - 24, 8, 4);
      ctx.fill();
      ctx.fillStyle = low ? '#ff5a3c' : '#22c55e';
      roundRect(ctx, rect.x + 12, rect.y + 62, (rect.w - 24) * fraction, 8, 4);
      ctx.fill();
    }
  }

  drawStove(ctx, world) {
    const stove = LAYOUT.stove;
    card(ctx, stove.x, stove.y, stove.w, stove.h, 14, '#5d5d66', PALETTE.purpleDark, 4);
    ctx.fillStyle = '#3d3d44';
    roundRect(ctx, stove.x + 10, stove.y + 10, stove.w - 20, 26, 6);
    ctx.fill();
    text(ctx, 'STOVE — click a raw patty or noodles to cook it', stove.x + 16, stove.y + 24, 12, '#ffd76a', 700);
    world.burners.forEach((burner, index) => {
      const rect = burnerRect(index);
      ctx.fillStyle = '#2b2b31';
      ctx.beginPath();
      ctx.ellipse(rect.x + rect.w / 2, rect.y + rect.h / 2 + 8, 52, 34, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = burner.item !== null && !burner.ready ? '#ff8c42' : '#55555e';
      ctx.lineWidth = 3;
      ctx.stroke();
      if (burner.item === null) {
        text(ctx, 'empty burner', rect.x + rect.w / 2, rect.y + rect.h / 2, 12, '#8b8b96', 600, 'center');
        return;
      }
      const cx = rect.x + rect.w / 2;
      const cy = rect.y + rect.h / 2;
      if (burner.burnt) {
        drawIngredient(ctx, burner.item, cx, cy - 4, 56, true);
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.beginPath();
        ctx.arc(cx, cy - 4, 22, 0, Math.PI * 2);
        ctx.fill();
        text(ctx, 'BURNT!', cx, cy - 34, 13, '#ff6b5e', 800, 'center');
        text(ctx, 'click to clear', cx, cy + 34, 11, '#d9d9d9', 600, 'center');
        return;
      }
      if (burner.ready) {
        // Cooked and ready: it bounces gently until it is taken.
        const bob = Math.sin(Date.now() / 180 + index * 2) * 3;
        drawIngredient(ctx, burner.item, cx, cy - 4 + bob, 56, true);
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(cx, cy - 4 + bob, 32, 0, Math.PI * 2);
        ctx.stroke();
        text(ctx, `READY — click to take · ${Math.ceil(burner.burnLeft)}s`, cx, cy + 36, 12, '#22c55e', 800, 'center');
        return;
      }
      // Cooking: draw the raw item over a flame glow and a progress ring.
      const glow = 0.5 + 0.5 * Math.sin(Date.now() / 120 + index * 2);
      ctx.fillStyle = `rgba(255,140,66,${0.25 + glow * 0.2})`;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 6, 46, 26, 0, 0, Math.PI * 2);
      ctx.fill();
      drawIngredient(ctx, burner.item, cx, cy - 4, 56, false);
      ctx.strokeStyle = '#ff8c42';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(cx, cy - 4, 34, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * burner.progress);
      ctx.stroke();
      text(ctx, `${Math.ceil((1 - burner.progress) * 4)}s`, cx, cy + 38, 12, '#ffd76a', 800, 'center');
    });
  }

  drawPlate(ctx, world) {
    const plate = LAYOUT.plate;
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.ellipse(plate.x + plate.w / 2, plate.y + plate.h - 6, 96, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.plate;
    ctx.beginPath();
    ctx.ellipse(plate.x + plate.w / 2, plate.y + plate.h / 2, 92, 58, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.purple;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(plate.x + plate.w / 2, plate.y + plate.h / 2, 62, 36, 0, 0, Math.PI * 2);
    ctx.strokeStyle = '#d9c49a';
    ctx.lineWidth = 2;
    ctx.stroke();
    const cx = plate.x + plate.w / 2;
    const cy = plate.y + plate.h / 2;
    if (world.plate.length === 0) {
      text(ctx, 'your plate', cx, cy - 6, 14, '#b8a88e', 600, 'center');
      text(ctx, 'click ingredients below', cx, cy + 14, 12, '#b8a88e', 600, 'center');
    } else {
      // Stack the plate's ingredients in a row; the newest one pops in.
      world.plate.forEach((id, i) => {
        const offset = (i - (world.plate.length - 1) / 2) * 30;
        const isNewest = i === world.plate.length - 1;
        const pop = isNewest && world.platePop > 0 ? 1 + 0.45 * (world.platePop / 0.28) : 1;
        drawIngredient(ctx, id, cx + offset, cy - 6 - (world.plate.length - 1 - i) * 4, 44 * pop, id === 'patty' || id === 'noodles' ? true : undefined);
      });
    }
    // Trash and serve buttons under the plate and the window.
    const trash = LAYOUT.trash;
    const hoveredTrash = pointIn(trash, this.input.hover.x, this.input.hover.y);
    card(ctx, trash.x, trash.y, trash.w, trash.h, 10, hoveredTrash ? '#ff6b5e' : '#ff5a3c', PALETTE.purpleDark, 3);
    text(ctx, 'TRASH  [T]', trash.x + trash.w / 2, trash.y + trash.h / 2, 14, '#fff8e7', 800, 'center');
    const serve = LAYOUT.serveButton;
    const hoveredServe = pointIn(serve, this.input.hover.x, this.input.hover.y);
    const ready = world.plate.length > 0 && world.orders.length > 0;
    card(ctx, serve.x, serve.y, serve.w, serve.h, 10, ready ? (hoveredServe ? '#1eb856' : '#22c55e') : '#9aa5b1', PALETTE.purpleDark, 3);
    text(ctx, 'SERVE  [Enter]', serve.x + serve.w / 2, serve.y + serve.h / 2, 15, '#fff8e7', 800, 'center');
  }

  drawServeWindow(ctx, world) {
    const win = LAYOUT.serveWindow;
    card(ctx, win.x - 8, win.y - 8, win.w + 16, win.h + 16, 14, '#6b4a2f', PALETTE.purpleDark, 4);
    ctx.fillStyle = '#fff3d6';
    roundRect(ctx, win.x, win.y, win.w, win.h, 8);
    ctx.fill();
    ctx.fillStyle = '#3b2f2f';
    ctx.fillRect(win.x, win.y, win.w, 26);
    text(ctx, 'SERVING WINDOW', win.x + win.w / 2, win.y + 14, 13, '#ffd76a', 800, 'center');
    // A bell on the counter of the window.
    ctx.fillStyle = '#f2c94c';
    ctx.beginPath();
    ctx.arc(win.x + win.w / 2, win.y + 96, 18, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(win.x + win.w / 2 - 20, 96 + win.y - 2, 40, 6);
    ctx.fillStyle = '#8a5a3b';
    ctx.beginPath();
    ctx.arc(win.x + win.w / 2 + 18, win.y + 104, 4, 0, Math.PI * 2);
    ctx.fill();
    if (world.servedFlash > 0) {
      ctx.fillStyle = `rgba(76,175,80,${world.servedFlash * 0.85})`;
      roundRect(ctx, win.x, win.y + 26, win.w, win.h - 26, 8);
      ctx.fill();
      text(ctx, 'SERVED!', win.x + win.w / 2, win.y + 66, 26, '#ffffff', 800, 'center');
    } else {
      text(ctx, 'serve the right dish', win.x + win.w / 2, win.y + 52, 12, '#8b7d6b', 600, 'center');
      text(ctx, 'and the bell rings', win.x + win.w / 2, win.y + 70, 12, '#8b7d6b', 600, 'center');
    }
  }

  drawBins(ctx, world) {
    INGREDIENTS.forEach((ingredient, index) => {
      const rect = binRect(index);
      const hovered = pointIn(rect, this.input.hover.x, this.input.hover.y);
      card(ctx, rect.x, rect.y, rect.w, rect.h, 14, hovered ? '#fff3d6' : PALETTE.panel, PALETTE.purple, 4);
      const busy = ingredient.cooks && world.burners.every((burner) => burner.item !== null);
      drawIngredient(ctx, ingredient.id, rect.x + rect.w / 2, rect.y + 38, 54, ingredient.cooks ? false : undefined);
      if (busy) {
        ctx.fillStyle = 'rgba(43,33,24,0.45)';
        roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 14);
        ctx.fill();
        text(ctx, 'stove full', rect.x + rect.w / 2, rect.y + 38, 13, '#ffffff', 800, 'center');
      }
      text(ctx, ingredient.name, rect.x + rect.w / 2, rect.y + 74, 15, PALETTE.text, 800, 'center');
      text(ctx, ingredient.cooks ? 'cook first' : `key ${ingredient.key}`, rect.x + rect.w / 2, rect.y + 92, 11, PALETTE.muted, 600, 'center');
      // Key badge in the ingredient's own colour.
      ctx.fillStyle = ingredient.color;
      ctx.beginPath();
      ctx.arc(rect.x + 15, rect.y + 15, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = PALETTE.purpleDark;
      ctx.lineWidth = 2;
      ctx.stroke();
      text(ctx, ingredient.key, rect.x + 15, rect.y + 16, 13, ingredient.id === 'patty' || ingredient.id === 'tomato' ? '#ffffff' : '#2b2118', 800, 'center');
    });
  }

  drawFloaters(ctx, world) {
    for (const floater of world.floaters) {
      ctx.globalAlpha = Math.min(1, floater.life);
      text(ctx, floater.text, floater.x, floater.y, 24, floater.color, 800, 'center');
    }
    ctx.globalAlpha = 1;
    // Coin sparkles: little four-point stars that burst out of the window.
    for (const sparkle of world.sparkles) {
      ctx.globalAlpha = Math.max(0, sparkle.life / sparkle.maxLife);
      ctx.fillStyle = sparkle.color;
      const s = sparkle.size;
      ctx.beginPath();
      ctx.moveTo(sparkle.x, sparkle.y - s);
      ctx.quadraticCurveTo(sparkle.x, sparkle.y, sparkle.x + s, sparkle.y);
      ctx.quadraticCurveTo(sparkle.x, sparkle.y, sparkle.x, sparkle.y + s);
      ctx.quadraticCurveTo(sparkle.x, sparkle.y, sparkle.x - s, sparkle.y);
      ctx.quadraticCurveTo(sparkle.x, sparkle.y, sparkle.x, sparkle.y - s);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawPlay(ctx, world) {
    this.drawTopBar(ctx, world);
    this.drawBoard(ctx, world);
    this.drawStove(ctx, world);
    this.drawServeWindow(ctx, world);
    this.drawPlate(ctx, world);
    this.drawBins(ctx, world);
    this.drawFloaters(ctx, world);
    // Flash banner for mistakes and the rush.
    if (world.flash && world.elapsed < world.flash.until) {
      ctx.fillStyle = 'rgba(43,33,24,0.75)';
      roundRect(ctx, 440, 84, 400, 44, 10);
      ctx.fill();
      text(ctx, world.flash.text, 640, 107, 20, world.flash.color, 800, 'center');
    }
    if (world.rush && world.elapsed < 62) {
      ctx.fillStyle = 'rgba(229,83,75,0.9)';
      roundRect(ctx, 480, 140, 320, 44, 10);
      ctx.fill();
      text(ctx, 'RUSH HOUR — orders speed up!', 640, 163, 18, '#ffffff', 800, 'center');
    }
    // Recipe reminder, in the empty space under the order board.
    text(ctx, 'RECIPES', 984, 396, 13, '#5d4a33', 800);
    text(ctx, 'BURGER: bun patty lettuce tomato cheese', 984, 416, 12, '#5d4a33', 600);
    text(ctx, 'NOODLES: noodles egg tomato', 984, 434, 12, '#5d4a33', 600);
    text(ctx, 'SALAD: lettuce tomato cheese egg', 984, 452, 12, '#5d4a33', 600);
    text(ctx, 'OMELETTE: egg cheese tomato', 984, 470, 12, '#5d4a33', 600);
  }

  drawTitle(ctx, world) {
    ctx.fillStyle = 'rgba(61,26,92,0.82)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    // Title card.
    card(ctx, 290, 60, 700, 600, 24, PALETTE.panel, '#ff8c42', 6);
    // Big chunky title with a white outline, like a game icon.
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#ffffff';
    ctx.font = `800 64px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText('WOK RUSH', 640, 130);
    ctx.fillStyle = '#ff5a3c';
    ctx.fillText('WOK RUSH', 640, 130);
    text(ctx, 'a tiny kitchen rush — cook fast, serve right', 640, 178, 18, PALETTE.muted, 600, 'center');
    // The whole food crew, smiling.
    const crew = ['bun', 'patty', 'lettuce', 'tomato', 'cheese', 'egg', 'noodles'];
    crew.forEach((id, i) => {
      const bob = Math.sin(Date.now() / 300 + i * 0.9) * 4;
      drawIngredient(ctx, id, 400 + i * 80, 248 + bob, 64, id === 'patty' || id === 'noodles' ? true : undefined);
    });
    text(ctx, 'HOW TO PLAY', 340, 312, 20, PALETTE.text, 800);
    const lines = [
      '1. Click an order ticket on the board to cook for it.',
      '2. Click ingredients on the counter to build the dish on your plate.',
      '3. Raw patty and noodles must cook on the stove first — take them',
      '    when the ring turns green, before they burn!',
      '4. Click SERVE (or press Enter) when the plate matches the order.',
      '5. Wrong dish or a walked-out order costs 25 points and your combo.',
      '6. Serve fast: the time left on an order is bonus points.',
    ];
    lines.forEach((line, i) => text(ctx, line, 340, 344 + i * 26, 16, PALETTE.text, 600));
    text(ctx, 'CONTROLS — mouse or keys 1-7 for ingredients · Enter serve · T trash · P pause · M mute · R restart', 640, 520, 13, PALETTE.muted, 600, 'center');
    const start = { x: 490, y: 560, w: 300, h: 64 };
    const hovered = pointIn(start, this.input.hover.x, this.input.hover.y);
    card(ctx, start.x, start.y, start.w, start.h, 16, hovered ? '#1eb856' : '#22c55e', PALETTE.purpleDark, 4);
    text(ctx, 'START SHIFT  [Enter]', start.x + start.w / 2, start.y + start.h / 2 + 1, 22, '#ffffff', 800, 'center');
    if (world.best > 0) {
      text(ctx, `best score so far: ${world.best}`, 640, 648, 14, PALETTE.muted, 600, 'center');
    }
    // Mute button, top right.
    this.drawSmallButton(ctx, { x: 1210, y: 12, w: 56, h: 40 }, '♪', world);
  }

  drawPaused(ctx, world) {
    ctx.fillStyle = 'rgba(61,26,92,0.7)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    card(ctx, 440, 300, 400, 300, 20, PALETTE.panel, '#ff8c42', 5);
    text(ctx, 'PAUSED', 640, 350, 36, PALETTE.text, 800, 'center');
    text(ctx, 'take a breath — the orders wait for you', 640, 390, 14, PALETTE.muted, 600, 'center');
    const resume = { x: 490, y: 420, w: 300, h: 56 };
    const hoveredResume = pointIn(resume, this.input.hover.x, this.input.hover.y);
    card(ctx, resume.x, resume.y, resume.w, resume.h, 12, hoveredResume ? '#1eb856' : '#22c55e', PALETTE.purpleDark, 4);
    text(ctx, 'RESUME  [P]', resume.x + resume.w / 2, resume.y + resume.h / 2, 20, '#ffffff', 800, 'center');
    const restart = { x: 490, y: 490, w: 300, h: 56 };
    const hoveredRestart = pointIn(restart, this.input.hover.x, this.input.hover.y);
    card(ctx, restart.x, restart.y, restart.w, restart.h, 12, hoveredRestart ? '#ff6b5e' : '#ff5a3c', PALETTE.purpleDark, 4);
    text(ctx, 'RESTART  [R]', restart.x + restart.w / 2, restart.y + restart.h / 2, 20, '#fff8e7', 800, 'center');
  }

  drawOver(ctx, world) {
    ctx.fillStyle = 'rgba(61,26,92,0.7)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    card(ctx, 340, 80, 600, 560, 24, PALETTE.panel, '#ffc93c', 6);
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#ffffff';
    ctx.font = `800 44px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText('SHIFT OVER!', 640, 140);
    ctx.fillStyle = '#ff5a3c';
    ctx.fillText('SHIFT OVER!', 640, 140);
    // Stars.
    const stars = world.stars();
    for (let index = 0; index < 3; index += 1) {
      const x = 560 + index * 80;
      const y = 200;
      ctx.fillStyle = index < stars ? '#f2c94c' : '#d9c49a';
      ctx.beginPath();
      for (let point = 0; point < 10; point += 1) {
        const angle = -Math.PI / 2 + (point * Math.PI) / 5;
        const radius = point % 2 === 0 ? 34 : 15;
        const px = x + Math.cos(angle) * radius;
        const py = y + Math.sin(angle) * radius;
        if (point === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    }
    text(ctx, `SCORE  ${world.score}`, 640, 280, 36, PALETTE.text, 800, 'center');
    text(ctx, `best  ${world.best}`, 640, 312, 15, PALETTE.muted, 600, 'center');
    const rows = [
      ['Dishes served', String(world.served)],
      ['Coins earned', String(world.coins)],
      ['Best combo', `x${world.combo === 0 ? world.bestCombo : world.combo}`],
      ['Mistakes', String(world.mistakes)],
      ['Orders walked out', String(world.expired)],
    ];
    rows.forEach(([label, value], i) => {
      text(ctx, label, 480, 356 + i * 30, 17, PALETTE.text, 600);
      text(ctx, value, 800, 356 + i * 30, 17, PALETTE.text, 800, 'right');
    });
    const restart = { x: 490, y: 560, w: 300, h: 64 };
    const hovered = pointIn(restart, this.input.hover.x, this.input.hover.y);
    card(ctx, restart.x, restart.y, restart.w, restart.h, 16, hovered ? '#1eb856' : '#22c55e', PALETTE.purpleDark, 4);
    text(ctx, 'PLAY AGAIN  [R]', restart.x + restart.w / 2, restart.y + restart.h / 2 + 1, 22, '#ffffff', 800, 'center');
    this.drawSmallButton(ctx, { x: 1210, y: 12, w: 56, h: 40 }, '♪', world);
  }
}
