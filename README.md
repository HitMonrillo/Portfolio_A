# Portfolio — Murilo Matos

Personal portfolio site. Static HTML and CSS for the content, with one
TypeScript-powered interactive page.

## Structure

```
index.html        the portfolio — plain, static, no framework
style.css
script.js         footer year + mobile nav
doom/             "Play Mode": a first-person raycasting arena where
                  shooting a sign opens that section of the resume
  index.html
  style.css
  src/
    level.ts      the map, authored as ASCII art
    raycaster.ts  DDA wall casting and rendering
    input.ts      keyboard, pointer lock, click-to-shoot
    panels.ts     shows and hides the resume panels
    main.ts       game loop, movement, collision
assets/
```

Everything in Play Mode also exists as normal, crawlable HTML on the main
page. The arena is a flourish, not the way in.

## Running it

```bash
npm install
npm run dev      # dev server with hot reload
npm run build    # static output in dist/
npm run preview  # serve the built output
```

The main page is static and needs no build step to view; the build exists
because `doom/` is written in TypeScript.

## Play Mode

A raycasting engine written from scratch — no game engine, no runtime
dependencies. For each column of pixels it casts a ray from the player,
steps it through a 2D grid (DDA) until it hits a wall, and draws a vertical
strip whose height is inversely proportional to the distance. Shooting uses
the same math: one ray through the centre of the screen, and if the wall it
hits carries a section ID, the matching panel opens.

To add a section: pick a letter, place it in the map in `level.ts`, add an
entry to `TARGET_CELLS`, and add a matching `<article data-panel="...">` to
`doom/index.html`.

## Deploying

`npm run build` produces a static `dist/`. Any static host works — connect
the repo to Vercel or Cloudflare Pages with build command `npm run build`
and output directory `dist`, then point the domain's DNS at the host.
