# Snugglebox

A small mystery-box game. Tap a box, meet a squishy friend, and fill a creature dex. Everything stays on the device: there is no account, no backend, and nothing to buy with real money.

The on-screen name lives in one place. Change `GAME_NAME` in [`src/config.ts`](src/config.ts) (the alternate title is Boxie Buddies). Drop rates, box cost, pity, and the free-box timer are in that same file.

## Play it in a browser

```bash
npm install
npx expo start --web
```

Expo prints a localhost URL (add `--port 43123` if you want a specific port). The dev server serves the game at `/`. The exported site uses `experiments.baseUrl` `/Snugglebox`, which matches the case-sensitive GitHub Pages path for the `Snugglebox` repo. The layout is a phone column with a bottom tab bar. At 980px and wider, the box and the dex sit side by side.

## Play it on a phone with Expo Go

1. Install [Expo Go](https://expo.dev/go) on your phone.
2. From this folder, run `npx expo start`.
3. Scan the QR code. iPhone uses the Camera app; Android can scan from inside Expo Go.
4. Phone and computer need to be on the same network. If the QR code fails, press `s` in the terminal to switch the connection mode, or use the browser build above.

This project only uses libraries that ship with Expo Go (SDK 58), so you do not need a custom dev build.

## Static web export

The app is a single-page bundle (`web.output: "single"`) with `experiments.baseUrl` set to `/Snugglebox`.

```bash
npx expo export -p web
```

`export` writes `dist/`. Asset URLs are prefixed with `/Snugglebox`, so host the folder at that path. [`.github/workflows/pages.yml`](.github/workflows/pages.yml) does this on every push to `main`: it runs `npx expo export -p web`, copies `index.html` to `404.html` so GitHub Pages serves the app for `/Snugglebox/collection`, and adds `.nojekyll` so underscore asset names are not ignored. The live site is [https://carlsonmichael6453.github.io/Snugglebox/](https://carlsonmichael6453.github.io/Snugglebox/).

For Netlify, [`public/_redirects`](public/_redirects) is copied into `dist` and sends every path to `index.html`.

## What you can do

- Tap the box. It shakes, glows in the rarity color, pops, and shows a card with the friend, a one-line description, and a tier badge.
- Rates are Common 60%, Rare 28%, Epic 10%, Legendary 2%. They are listed in the app.
- Two looks per friend. Pulling Mochi Bun also rolls a color. Rainbow, Midnight, and Sakura are rarer than the other seventeen colors.
- Duplicates become stardust, which pays for more boxes (✦ 100). You start with enough for a short session, plus a free box. The next free box is ready four hours later.
- After 20 pulls with no Epic or Legendary, the next box promises one.
- The Friends tab is the dex: color art for friends you have met, silhouettes for the rest, pose pips, duplicate counts, and an album percentage. Mochi colors have their own filter.
- Sound and haptics can be turned off. Haptics use the phone's taptic engine and the browser vibration API when it exists.
- Progress is stored with AsyncStorage (localStorage on web). Settings includes a reset button for testing.

## Art

The creature pack is in `assets/creatures/`:

- `common/`, `rare/`, `epic/`, `legendary/` — `<slug>-1.webp` and `<slug>-2.webp`
- `mochi-colors/<color>-mochi.webp`
- `silhouettes/` — locked dex shapes, rebuilt with `python3 scripts/make_silhouettes.py`

`scripts/generate_sounds.py` rebuilds the tiny tones in `assets/sounds/`.

## Project map

- `src/config.ts` — name, odds, cost, pity, timer
- `src/data/creatures.ts` — names and descriptions
- `src/game/logic.ts` — pulls, rewards, album math
- `src/app/` — Expo Router screens

Check the pull math with:

```bash
npx tsx src/game/logic.test.ts
```
