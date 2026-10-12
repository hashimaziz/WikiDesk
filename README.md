# WikiDesk

A desktop reading desk for English Wikipedia: fetch any article, read it in a distraction-free column, and explore what it links to — related entities, a chronology, a knowledge graph, and side-by-side comparison.

## What it is, and why

Wikipedia is an excellent encyclopedia and a mediocre reading environment. Every article is a doorway into 200 others, and following those doors means losing the page you were on, your place in it, and your history of where you have been. Bookmark tabs do not fix this.

WikiDesk wraps the English Wikipedia REST and Action APIs in a small local desktop app. Articles render as clean prose rather than the Vector skin's site chrome. Everything derived from an article — the people, places and events it mentions, the years it spans, the graph of what it points at — is computed locally in the renderer from the article HTML that was just fetched, so exploring sideways never leaves the app.

Two details make this work as a desktop app rather than a website. First, article HTML from the REST endpoint is a *full document*, not a fragment: it carries a `<base>` tag that hijacks relative URL resolution and a stylesheet link to MediaWiki's own CSS that lands asynchronously on top of the app's styles. WikiDesk parses the response and keeps only `document.body` (`extractArticleBody` in `src/lib/wikipedia.ts`). Second, that HTML references images with protocol-relative `//upload.wikimedia.org/...` URLs, which resolve against `file://` when the app is loaded from disk and break every image; WikiDesk pins them to `https://` (`absolutizeProtocolRelativeUrls`).

## Features

All of these are implemented and reachable from the UI.

**Reading.** Articles render through Tailwind Typography with edit sections, hatnotes, infoboxes and figures restyled for the app. Internal `./Article_Name` links are intercepted and routed inside the app, so you never lose your place to the real wikipedia.org. Font size is adjustable in 2px steps from 12px to 32px, and content width is either one of three presets (640 / 896 / 1152, labelled S / M / L) or any value from 560px to 1280px on a slider. Focus mode hides the sidebar and fades the toolbar out until you hover it.

**Discovery sidebar.** The most frequently linked entities in the current article are extracted from `a[rel="mw:WikiLink"]` anchors, namespaced pages (`File:`, `Category:`, …) excluded, and sorted by link frequency. They are grouped into Key People, Key Events, Key Places and Related Topics using a regex classifier over each entity's Wikipedia short description — people are matched before places so "king of France" does not land in the place bucket. Metadata for the top entities is fetched through the batched `action=query` API, 20 titles per request, rather than one REST summary call per title. The panel defaults to open when the window is at least 1024px wide and collapses below that.

**Timeline.** Scanning the article's paragraphs and list items for four-digit years (1000–2049) and pairing each year with its sentence produces a chronological view of the article. Fewer than 5 dated events and the timeline reports that the article has nothing chronological to show. The timeline logic lives in `src/lib/timeline.ts` and is unit-tested.

**Knowledge graph.** A force-directed 2D graph (`react-force-graph-2d`) with the article at the centre and its most-linked articles as neighbours, node size scaled by link count, capped at 100 nodes. Clicking a node navigates to that article. Available both as a modal from any article and as a standalone Graph view with its own search box.

**Comparison.** Pick any second article and read the two side by side with scroll position synchronised by percentage; synchronisation can be switched off. Internal links in either column keep the pair intact by swapping out only the column that was clicked.

**Library.** Collections can be created, browsed and deleted from the Library view (there is no rename operation yet); articles are filed into them from the article toolbar, which also caches the article's summary extract for display. Recently read articles are tracked and surfaced as "Continue Reading" on the home screen and in a Recent view.

**Appearance.** Light and dark themes, toggleable from the sidebar or Settings, persisted across restarts. Dark mode includes specific fixes for Wikipedia's own markup: tables carry inline light-mode colours that become unreadable in dark, so cell backgrounds and text colours are overridden under `.dark .wikipedia-content`; small text, captions, hatnotes and reference markers are re-toned for contrast.

## Tech stack

Renderer: React 19, TypeScript (~6.0), Vite 8, React Router 7 (`HashRouter`, which is what allows `file://` loading), Tailwind CSS 4 via `@tailwindcss/vite` with `@tailwindcss/typography`, `lucide-react` for icons, `clsx` + `tailwind-merge` for class composition, `react-force-graph-2d` for the graph.

Main process: Electron 42, wired into Vite by `vite-plugin-electron` and `vite-plugin-electron-renderer`. `better-sqlite3` ^13 provides storage; `electron-builder` and `@electron/rebuild` are present as devDependencies.

Tests: Vitest 4 with jsdom, `@testing-library/react`, and `user-event`. Lint: ESLint 10 with `typescript-eslint`, `eslint-plugin-react-hooks` and `eslint-plugin-react-refresh`.

## Prerequisites

- Node.js and npm. This was developed and verified on Node v24.8.0 with npm 11.6.0; `package.json` does not declare an `engines` field, so no minimum is pinned.
- Network access to `en.wikipedia.org` — the app fetches everything live and has no bundled content.
- `better-sqlite3` is a native module, so a working C/C++ toolchain may be needed if a prebuilt binary is not available for your platform.

Electron itself needs nothing special: it is a normal devDependency installed by `npm install`, and there is no separate postinstall or packaging step wired into the scripts.

## Install

```bash
npm install
```

## Run

There is one development command, and it starts both halves of the app:

```bash
npm run dev
```

Vite serves the renderer on **http://localhost:5173/** (Vite's default; no `server.port` is configured) and `vite-plugin-electron` compiles `electron/main.ts` and `electron/preload.ts` into `dist-electron/`, then launches an Electron window that loads that dev server URL. You will see the Electron window open; the browser URL is also reachable if you want to inspect the UI, but in a plain browser the app has no preload bridge, so history, collections and settings will not work (see Troubleshooting).

## Build

```bash
npm run build
```

This runs `tsc -b` then `vite build`, and produces:

- `dist/` — the built renderer, which the production Electron process loads from disk via `mainWindow.loadFile('../dist/index.html')`.
- `dist-electron/main.js` and `dist-electron/preload.mjs`.

Note the preload extension. The project is ESM (`"type": "module"`), so `vite.config.ts` forces the preload bundle to be emitted as `.mjs` — Electron only honours ESM preloads with that extension, and the window is created with `sandbox: false` to allow it. `nodeIntegration` is off and `contextIsolation` is on.

To serve the built renderer as static files:

```bash
npm run preview
```

There is no packaging script. `electron-builder` is installed as a devDependency but there is no `build` configuration block in `package.json` and no `electron-builder` script, so producing a distributable `.app`/`.exe` is not currently wired up.

## Other scripts

```bash
npm run test        # vitest run — 13 files, 71 tests
npm run test:watch  # vitest in watch mode
npm run lint        # eslint .
```

## Using it

Start on the **Home** screen and search, or go straight to **Search**. Search uses `action=query&list=search` and hands the query to the view through a `?q=` search param, so a search URL is shareable within the app. Clicking a result opens the article.

From an article toolbar you can save the article to a collection, change font size, pick a content width, open the timeline, start a comparison, open the knowledge graph, toggle the discovery panel, and toggle focus mode.

Routing uses `HashRouter`, so routes look like `#/article/Ada_Lovelace`, `#/search?q=ada`, and `#/compare/Ada_Lovelace/Alan_Turing`.

## Project structure

```
electron/          Main process
  main.ts            Window creation, dev-vs-prod URL/file selection
  preload.ts         contextBridge API exposed as window.wikiDesk
  db.ts              SQLite schema + ipcMain handlers
  db.test.ts
src/
  views/             One file per route: Home, Search, Article, Collections,
                     Recent, GraphExplorer, Compare, Settings
  components/        SmartSidebar, TimelineModal, GraphModal, CompareModal
  context/           AppContext — reading prefs (theme, font size, width)
  hooks/             useMinWidth
  lib/
    wikipedia.ts       REST + Action API calls, HTML sanitising/extraction
    links.ts           wikilink frequency counting, entity classification
    timeline.ts        date extraction into a chronology
    graph.ts           graph node/link construction
    db-client.ts       typed wrapper over the preload bridge
    constants.ts       bounds and width presets
  index.css           Tailwind entry + Wikipedia markup overrides
vite.config.ts      Electron, renderer and Tailwind plugin wiring
vitest.config.ts     jsdom test environment
```

## Configuration

Settings live in the app, not in env files — there are no environment variables or `.env` files in this project, and no API keys are used. Wikipedia's public endpoints are called unauthenticated with `origin=*`.

The Settings view exposes theme (light/dark), reading font size (12–32px) and content width (560–1280px, plus 640/896/1152 presets). These are persisted to the `Settings` row of the local SQLite database on every change.

The database is `wikidesk.sqlite` in Electron's `app.getPath('userData')` directory, opened in WAL mode with foreign keys on. Tables: `Articles`, `History`, `Collections`, `Collection_Articles`, `Settings`. Schema version is tracked with `PRAGMA user_version`; because pre-v1 databases had an incompatible `Settings` table and the contents are only cache and history, a version bump drops and recreates the tables rather than migrating.

## Troubleshooting

**`WikiDesk bridge unavailable: the Electron preload script failed to load`** — the renderer is running somewhere the preload does not exist, most likely a plain browser tab on `http://localhost:5173/`. Use the Electron window that `npm run dev` opens.

**Images missing / broken layout** — this was the protocol-relative URL problem, handled in `absolutizeProtocolRelativeUrls`. If you introduce a new source of article HTML, route it through that function.

**Article loads but looks like raw Wikipedia** — the returned document's `<base>` tag or Vector stylesheet leaked through, meaning `extractArticleBody` was bypassed. Check that the article HTML went through `fetchArticleHtml`.

**`better-sqlite3` fails to load, or throws an ABI/version error** — the native module was built for a different runtime. `node_modules` must be installed for Electron's runtime too; try `npx electron-rebuild`, or reinstall with `npm install` from a clean `node_modules`.

**Empty or stale history after a schema change** — expected. `PRAGMA user_version` below the current version drops and recreates all tables; history and collections are treated as cache, not durable data.

## License

None has been chosen yet. `package.json` is marked `"private": true` and there is no LICENSE file in the repository. Add one before distributing anything.