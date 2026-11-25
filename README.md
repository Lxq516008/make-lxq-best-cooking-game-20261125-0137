# Wok Rush — a tiny kitchen rush

[![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/Lxq516008/make-lxq-best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/Lxq516008/make-lxq-best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

A timed cooking game for the [make.fun best cooking game bounty](https://make.fun/bounty/best-cooking-game-20261125-0137). You run a tiny kitchen for one 120-second shift: orders come in on the board, you build each dish on your plate from the ingredients on the counter, cook the patty and noodles on the stove, and serve the right dish before the order walks out. Serve fast and clean for combo multipliers; wrong dishes and walked-out orders cost points.

## The menu

- **Classic Burger** — bun, patty (cooked), lettuce, tomato, cheese
- **Noodle Bowl** — noodles (cooked), egg, tomato
- **Garden Salad** — lettuce, tomato, cheese, egg
- **Cheesy Omelette** — egg, cheese, tomato

Raw patty and noodles go on a burner first (4 seconds to cook, then take them before they burn). Orders arrive faster and their timers shrink as the shift goes on; at half-time the rush hour starts.

## How to play

- **Mouse:** click an order ticket to cook for it, click ingredient bins to add to your plate, click a ready burner to take the cooked food, click **SERVE** (or the serving window's bell) to serve.
- **Keyboard:** `1`–`7` add ingredients, `Enter` serve, `T` trash the plate, `P` pause, `M` mute, `R` restart.
- **Scoring:** each dish pays its recipe points plus a time bonus, multiplied by your combo. Three stars at 400 / 900 / 1500 points.

## How to run

No build step, no network requests, no libraries — plain HTML5 Canvas and vanilla JavaScript, all art drawn in code, all sound synthesized with WebAudio.

```sh
node serve.ts
# open http://localhost:8080
```

Or serve `game/` with any static server and open `game/index.html`.

## Layout

- `game/index.html` — the page, canvas only
- `game/src/config.js` — tuning, recipes, palette, layout boxes
- `game/src/world.js` — orders, plate, burners, scoring, the shift timer
- `game/src/render.js` — all canvas drawing, including the food art
- `game/src/input.js` — keyboard and mouse
- `game/src/audio.js` — synthesized WebAudio beeps and chimes
- `game/src/shots.js` — the staged scenes behind `?shot=cover|assembly|serve|end`
- `game/src/main.js` — boot and the fixed-step loop
- `main.ts` — the make.fun hand-in program (copies `game/` and `screenshots/`, writes `dossier.json`)
- `screenshots/` — four screenshots of the game, taken in a real browser
