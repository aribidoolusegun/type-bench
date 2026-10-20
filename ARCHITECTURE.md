# Architecture

Type Bench is a single-page React app built with Vite and TypeScript. It has no backend and only two runtime dependencies, React and React DOM. This document explains how the pieces fit together and the rules the code follows.

## Principles

1. **One source of truth.** The settings object drives everything. The preview, the scale table, the CSS preview and both exports are all derived from it through the same functions, so they can't disagree.
2. **Measure, don't guess.** Diagnostics read the browser's own layout after fonts have loaded. Nothing is inferred from settings alone.
3. **Never pretend a font has loaded.** A font face is registered only after its file has loaded. Until then the preview is dimmed and labelled; on failure it says which fallback is showing.
4. **The interface never changes font.** Controls use the operating system's UI font, and specimen fonts apply only inside the specimen.

## Directory map

```
public/fonts/<family>/         WOFF2 files and each family's OFL.txt
src/
  main.tsx                     restores settings, starts loading the selected font, renders <App>
  App.tsx                      owns state; wires panels, preview, export and persistence
  model/                       pure TypeScript, no DOM: unit-tested with node:test
    fonts.ts                   the 12-family catalogue, weight helpers, fallback stacks
    settings.ts                types, defaults, bounds, parsing helpers
    typeScale.ts               base × ratio^step, heading line heights
    tokens.ts                  settings → tokens → CSS custom properties (shared by preview and export)
    exportTokens.ts            CSS and DTCG JSON exports, font-loading guidance, file names
    persistence.ts             versioned localStorage envelope, field-by-field validation
  state/
    settingsReducer.ts         every settings change goes through here
    usePersistence.ts          debounced saving; reports “saved” only after a successful write
    useAnnouncer.ts            one message at a time for the toast and live region
  fonts/
    fontLoader.ts              CSS Font Loading API wrapper with per-face status
    useFontStatus.ts           React bindings (useSyncExternalStore)
  diagnostics/
    measure.ts                 line counts, overflow sources, characters per line
    useDiagnostics.ts          decides when to measure (debounced, paused while dragging)
  content/                     deterministic sample copy for each preview and content length
  components/                  focused UI components (panels, picker, canvas, specimens, dialog)
  styles/
    app.css                    interface styles and responsive layout
    specimen.css               specimen styles: every size comes from the generated tokens
```

## Data flow

```
Settings (useReducer)
  ├─ buildTokens()  → TypeTokens ─┬─ cssVariables() → inline style on .specimen  (the preview)
  │                               ├─ smallScreenCss() → <style> in the preview, and the CSS export
  │                               ├─ buildRootBlock() → sidebar CSS preview
  │                               └─ ScaleList
  ├─ buildCss() / buildJson()      → export dialog, copy, downloads
  ├─ usePersistence()              → localStorage
  └─ useFontFamily()               → fontLoader → status → dimming, banners, diagnostics gate
```

`cssVariables()` produces the exact strings (for example `--font-size-h1: 3.0518rem`) that the specimen uses and that the CSS export prints. A unit test parses the exported CSS and checks it against this map; during development, scripted browser checks also compared it with the specimen's computed custom properties (see [docs/TESTING.md](docs/TESTING.md)).

### Small-screen headings

`TypeTokens` carries a second scale when `typography.smallScreen` is on: `computeScale(t, smallRatio)` changes only Display, H1, H2 and H3. `smallScreen.ratio` is `null` until first configured; the reducer fills it in from the scale ratio the first time the setting is switched on, and never again, so switching off and on keeps it (off only disables the effect). Reset returns it to `null`. `smallScreenCss()` turns it into one rule:

```css
.type-scope { container: type-scope / inline-size; }
@container type-scope (width < 600px) {
  .type-scope > * { --font-size-display: …; --font-size-h1: …; --font-size-h2: …; --font-size-h3: …; }
}
```

The specimen *is* the `.type-scope` container, and the preview injects this exact string; the CSS export prints the same string with px comments and setup notes. So the specimen's own width decides which sizes apply: switching template or resizing the window changes nothing unless the specimen's width crosses the breakpoint. The properties are redefined on the container's children because a container can't query its own size. `usesSmallScreen(t, width)` mirrors the rule (`width < breakpoint`) for the interface: the canvas caption and the active column in the scale table read the specimen's measured width.

## Fonts

- Each family ships the **latin subset** as WOFF2, taken unmodified from Fontsource (which mirrors Google Fonts). Eleven families are variable fonts with a single `wght`-axis file. Poppins has no variable version, so it ships one static file per weight.
- Nothing loads at start-up except the selected family. Opening the picker fetches each family's regular face so that names can be drawn in their own fonts.
- `fontLoader.ts` creates a `FontFace`, waits for `load()` (with a 15-second timeout) and only then calls `document.fonts.add()`. Status is stored **per face**, so a slow earlier request can't overwrite the status of a family chosen after it.
- `font-synthesis: none` on the specimen stops the browser from faking bold or italic styles. Weights are always snapped to ones the family supports: in the reducer, during restore validation, and again when tokens are built.
- For manual testing, `?simulate-font-failure=<id>` (for example `?simulate-font-failure=lora`) makes a family fail to load.

## Resizing

`ResizableCanvas` sets a real CSS width on the canvas, so the specimen reflows as it would in a browser window of that width. Specimen layouts use **container queries**, so they respond to the canvas, not the browser window. The handles use Pointer Events with pointer capture, apply at most one width change per animation frame, and are `role="separator"` elements that work with the keyboard. There is one **Preview width** control, above the canvas: a number field with presets. It and the handles dispatch the same `setWidth` action.

## Layout checks (measured diagnostics)

`useDiagnostics` re-measures after settings, content, tab or font changes, after `document.fonts` finishes loading, and whenever a `ResizeObserver` sees the specimen change size. It waits 160ms for things to settle and pauses entirely while a handle is being dragged. `measure.ts` then:

- counts heading lines by grouping a `Range`'s client rects by vertical position;
- finds horizontal overflow by comparing each element's `scrollWidth` with its `clientWidth`. Elements that scroll on purpose (`overflow-x: auto`) are reported as scroll regions, not as overflow. An ancestor is reported only when its content reaches further than its overflowing children explain;
- reports how far anything runs past the specimen's own edge;
- estimates characters per line from each body paragraph's width and its average character width, measured with a canvas in the paragraph's computed font.

## Persistence

Settings are stored under `type-bench:settings` as `{ version, savedAt, settings }`. Version 2 added body and heading weights and small-screen headings; version 1 data is migrated by `migrateV1()` (the old single weight becomes both weights, small screens start off), which reproduces its appearance exactly. On restore, every field is validated on its own: numbers are clamped, unknown fonts or enum values fall back to defaults, and a weight the family lacks snaps to the nearest one. A single bad value therefore never discards the rest. Data with an unknown or newer version is discarded rather than guessed at. When storage is unavailable, the tool keeps working and says that it isn't saving.

On a first visit (nothing saved yet) and on Reset, default preview widths are narrowed to fit the available canvas (`defaultWidthsFor()` with `canvasAreaWidth()`, which reads the sidebar widths from CSS variables), so small screens never open on a cut-off preview. Saved widths are always restored exactly.

## Testing

`npm test` runs the model tests with `node:test`, using Node's built-in TypeScript type stripping. That is why model files import each other with `.ts` extensions. They cover:

- scale maths at full precision;
- export consistency: CSS ↔ preview variables, rem ↔ px, CSS ↔ JSON;
- that only supported weights are offered and exported;
- restored-settings validation and repair;
- weight preservation and snapping when switching families, and the note that explains it;
- small-screen sizes: heading roles only, the breakpoint boundary, and that desktop sizes never move;
- export parity: the preview's small-screen rule and the exported one are the same text, and CSS and JSON agree;
- migration of version 1 settings without any change in appearance;
- that reset restores defaults.

Browser-engine checks and manual testing are described in [docs/TESTING.md](docs/TESTING.md).

## Motion

Motion is defined once, as CSS custom properties at the top of `app.css`: `--tb-dur-feedback` (120ms, hover and press), `--tb-dur-state` (180ms, small state changes), `--tb-dur-panel` (240ms, popovers and dialogs), shorter exits, and one deceleration curve, `cubic-bezier(0.2, 0.8, 0.2, 1)`. Spatial movement goes through `--tb-dur-move` and `--tb-shift`, which `prefers-reduced-motion` sets to zero, so movement disappears while state changes stay immediate. There is no motion library: `src/motion/motion.ts` has a small `usePresence` hook that keeps an element mounted for its exit transition.

What moves, and why:

- **Preview tabs**: one indicator slides to the active tab; the specimen fades in briefly (opacity only).
- **Font picker, notices, toast, export dialog**: short opacity and position entrances and exits.
- **Switches, slider thumbs, resize handles, copy button**: brief feedback on hover, press and state.

What never moves: font size, line height, letter spacing and specimen width. Width follows the pointer one-to-one, and transitions are opacity-only wherever they touch the specimen, so diagnostics never measure intermediate geometry.

## Font selection

`useFontSelection` loads a chosen family before committing it, so the specimen never drops to a fallback face mid-switch. Only the latest choice can commit; a family that is already loaded commits immediately.

The search field is deliberately **uncontrolled** (`defaultValue` + `onInput`). With a controlled input, a re-render that lands before React applies an `input` event (the list re-renders as preview fonts load) writes the stale value back over what was typed. In WebKit this was reproducible with Playwright's `fill()`: 30 of 40 attempts lost the text. Enter also matches against the field's own value rather than the last render.

## Revealing diagnostics in the preview

Each overflow finding keeps a reference to the element it measured (`OverflowItem.element`). Activating one calls `revealInPreview()`, which scrolls only the preview (and the page, in the stacked layout, if the preview is off-screen), and then shows `HighlightOverlay`. The overlay is absolutely positioned in the canvas frame, outside the measured specimen, so it cannot change layout or measurement. It outlines the element's box and adds a hatched band as wide as the overflow. Focus stays on the finding. Any change that triggers a re-measure (font, width, content, tab) clears the highlight; findings are disabled while a measurement is pending, so they never point at old geometry. Reduced motion scrolls instantly and shows the highlight without fading.

## Export dialog

`buildCssSections()` splits the CSS export for display: a one-line summary, the `:root` variables (shown first), and the font-loading notes and usage example (behind a native `<details>` disclosure). Copy and download always use the complete `buildCss()` file; a unit test checks that the sections are exactly the parts of that file. The selected tab's format gets the primary copy and download actions; the other format stays available as a secondary download.

## Source order

The preview comes before the two sidebars in the HTML, so keyboard order matches the stacked phone layout and its section bar (Preview, Type system, Layout testing). CSS grid areas still place the Type system column on the left on wide screens; there, Tab moves from the header to the preview, then the Type system and Layout testing panels.

## Introduction and demonstration

The introduction (`components/Intro.tsx`) sits above the preview until dismissed; dismissal is stored under its own key (`type-bench:intro`), separate from settings, and “About Type Bench” in the header brings it back. “See how it works” never starts the demonstration by itself. It snapshots the current settings in memory, pauses persistence (`usePersistence(…, paused)`), and applies `demoSettings()` from `model/demo.ts`: Inter, 16px, ratio 1.54, Dashboard at 760px. It then waits for a fresh measurement of that layout (never the result that was on screen before) and reveals the first finding the layout checks report. If none is found it says so. “Restore my settings” replaces the settings with the snapshot; “Keep exploring” resumes saving and announces it with an Undo. Because saving is paused, a reload mid-demo returns to the saved settings.
