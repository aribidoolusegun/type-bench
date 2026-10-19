# Type Bench

An open-source typography playground for designers. Type Bench helps you move from *choosing a nice font* to *building a type system that holds up in real interfaces*.

Choose one of 12 open-source fonts, tune a modular type scale, then see it at work in an editorial page, a product dashboard and a mobile screen. Narrow the canvas, lengthen the copy, grow the numbers, and watch the layout respond. When it holds up, export CSS custom properties or design tokens that match the preview exactly.

Everything runs in the browser. There is no backend, no account and no tracking. The fonts are hosted alongside the app.

## The problem

Most font tools stop at the specimen: a pangram at a few sizes on a wide screen. Type systems usually break somewhere else: a headline that becomes six lines on a phone, a dashboard figure that outgrows its card, a measure that stretches to 120 characters on a wide monitor. Type Bench puts those situations in front of you while you're still choosing sizes, so you find the breaking points before you build.

## Features

- **12 open-source fonts**, self-hosted as WOFF2: DM Sans, Inter, Manrope, Work Sans, Source Sans 3, Roboto, Open Sans, Montserrat, Poppins and Nunito Sans (sans serif), and Lora and Merriweather (serif).
- **A searchable font picker**, grouped by category. Each name is drawn in its own face once that face has loaded. Only weights the family actually supports are offered.
- **Live typography controls**: base size, scale ratio (with named ratios), body line height, and separate body and heading weights. Every control has a slider and a validated number field.
- **Small-screen headings** (optional): a second ratio for Display, H1, H2 and H3 below a breakpoint you choose. It follows the preview's own width, so desktop sizes stay exactly as they were.
- **A generated type scale**: Caption (base ÷ ratio), Body, H3 (ratio³), H2 (ratio⁴), H1 (ratio⁵) and Display (ratio⁶), with explicit, tighter line heights for headings.
- **Three realistic previews** (Editorial, Dashboard and Mobile), all driven by the same tokens. The text is real HTML that you can select.
- **Real resizing**: drag the handles, pick a preset or type a **Preview width**. The specimen's CSS width changes and the content reflows. Nothing is scaled.
- **Layout testing**: four content lengths, long headings, and large numbers (dashboard only).
- **A first-use introduction and a short demonstration** (“See how it works”): a fixed, reproducible setup (Inter at a 1.54 ratio on the Dashboard) that produces genuine overflow, outlines it, and restores your own settings afterwards. Saving pauses while it runs, so it can never overwrite your work.
- **Layout checks** measured from the rendered page: heading line counts, horizontal overflow (with deliberate scroll regions reported separately) and approximate characters per line.
- **Export**: copy CSS, download CSS, or download JSON tokens in the Design Tokens Community Group format. Each export includes font-loading guidance and a usage example.
- **Local persistence**: settings and the system name are saved in your browser, with a versioned format and validation on restore.
- **Accessible by design**: labelled controls, keyboard-operable tabs, picker and resize handles, visible focus, live announcements and reduced-motion support.

## Screenshots and recording

These were captured from earlier beta builds (Chromium, 1440 × 900 unless noted). They predate small-screen headings, the separate body and heading weights, and the single Preview width control, so some controls look different today.

- [First use: desktop](docs/first-use/first-use-desktop-1440x900.png), [first use: phone](docs/first-use/first-use-phone-390x844.png) and [a 12-second recording of “See how it works”](docs/first-use/demonstration.mp4)
- [Default Editorial view](docs/screenshots/01-default-editorial.png)
- [Dashboard](docs/screenshots/02-dashboard-normal.png) and [Dashboard with test content](docs/screenshots/03-dashboard-stressed.png)
- [Font picker](docs/screenshots/04-font-picker-open.png) and [export dialog](docs/screenshots/05-export-dialog.png)
- [Phone layout](docs/screenshots/06-mobile-layout.png) at [390 × 844](docs/screenshots/mobile-390x844-release.png) and [375 × 667](docs/screenshots/mobile-375x667-release.png)
- [Sidebar CSS panel](docs/screenshots/07-sidebar-css-panel.png)
- [A 29-second recording of a complete workflow](docs/media/designer-workflow.mp4): choose a font, adjust the scale, test every preview wide and narrow, cause an overflow, reveal it, fix it, export CSS and JSON
- [Before and after: phone workspace and export dialog](docs/screenshots/before-after/), at identical sizes
- [A 14-second recording](docs/media/diagnostic-reveal.mp4) of revealing overflow findings in the preview, by pointer and by keyboard
- [A 30-second recording](docs/media/type-bench-interactions.mp4) of font selection, tab switching, canvas resizing, test content and copy feedback (the grey dot marks the pointer; it is drawn only for the recording)

## Beta materials

- [Feedback guide](docs/beta/FEEDBACK-GUIDE.md) for beta sessions
- [Default desktop view](docs/beta/desktop-default-1440x900.png) and [the app at a phone-sized viewport](docs/beta/phone-app-390x844.png)
- [Recording: overflow, Show finding, adjust ratio, warning clears](docs/beta/overflow-recovery.mp4)

## Getting started

You need [Node.js](https://nodejs.org/) 22.18 or later. The tests use Node's built-in TypeScript support.

```bash
npm install
npm run dev        # start the dev server at http://localhost:5173
```

Other commands:

| Command | What it does |
| --- | --- |
| `npm run build` | Type-checks, then builds a static site into `dist/` |
| `npm run preview` | Serves the production build locally |
| `npm run typecheck` | Runs the TypeScript compiler without emitting files |
| `npm test` | Runs the unit tests with Node's built-in test runner |

The built site is fully static and uses relative paths, so `dist/` can be served from any folder or static host.

### Keyboard shortcuts

| Keys | Action |
| --- | --- |
| <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> | Switch between the Editorial, Dashboard and Mobile previews |
| <kbd>←</kbd> <kbd>→</kbd> on a resize handle | Resize by 10px (hold <kbd>Shift</kbd> for 50px; <kbd>Home</kbd>/<kbd>End</kbd> for min/max) |
| <kbd>↑</kbd> <kbd>↓</kbd> in a number field | Step the value (hold <kbd>Shift</kbd> for ×10) |
| <kbd>Esc</kbd> | Close the font picker or export dialog |

## How the numbers work

- Sizes are computed at full precision as `base × ratio^step` and rounded only for display. The exports use rem values to four decimals, which is well under 0.01px from the computed size.
- **rem values assume a 16px root font size**, the browser default. If your site changes the root size, every exported size scales with it.
- Headings use fixed line heights (Display 1.1, H1 1.15, H2 1.2, H3 1.25). Body and caption follow the body line-height control.
- **Body weight** sets body and supporting text (including the editorial deck, which is set at H3 size); **heading weight** sets Display, H1, H2 and H3. An *emphasis* weight, two steps heavier than the body weight and limited to what the family supports, is used for labels, buttons and table headers, and is exported as `--font-weight-strong`.
- **Small-screen headings** apply when the preview is narrower than the breakpoint; at the breakpoint itself the desktop sizes apply. The first time you switch them on, the heading ratio starts at your scale ratio, so nothing changes size. After that, switching off only disables the effect: your ratio and breakpoint are kept for next time (Reset clears them). The CSS export reproduces this with a container query on an element with `class="type-scope"`, exactly as the preview does, and explains how to switch to a viewport media query instead (which switches at a slightly different point, because the window width includes any scrollbar).

## Using the export

Open **Export** to copy or download the CSS, or download JSON tokens.

**CSS.** The file has numbered sections:

1. **Load the font.** Naming a font in CSS doesn't load it. The notes give three ways to load it (self-hosted `@font-face`, the Fontsource npm package, or Google Fonts) and list the weights the system uses.
2. **Tokens.** A `:root` block of custom properties: `--font-family-text`, `--font-weight-body`, `--font-weight-heading`, `--font-weight-strong`, and a `--font-size-*` and `--line-height-*` pair for Display, H1, H2, H3, Body and Caption. Sizes are in rem, with px in comments.
3. **Small screens** (only when switched on). A container rule that swaps in the smaller heading sizes below the breakpoint. Add `class="type-scope"` to the element that holds your content (for a whole page, a wrapper just inside `<body>`); text outside it keeps the desktop sizes. The notes explain how to use a viewport `@media` query instead.
4. **Example** (section 3 when small screens are off). Rules that apply the tokens to `body`, `h1`–`h3`, `.display`, `small`/`.caption` and emphasis, plus `font: inherit` for form controls. Adapt the selectors to your own markup.

**JSON.** Design Tokens Community Group format: font family, weights, sizes, line heights, composite `typography` tokens, and (when switched on) `font.size.smallScreen` and `breakpoint.smallScreen`. Type Bench's own settings and the font's licence details sit under `$extensions["type-bench"]`. Exports from earlier versions used different weight names; see the [changelog](CHANGELOG.md).

## What the layout checks can and can't tell you

Layout checks are measured from the rendered preview after fonts have loaded, never estimated from the settings alone. They describe *this sample content at this width*. Line length is an approximation based on average character width. None of these checks is an accessibility audit, and the sample copy can't predict every content problem, so test with your real copy as well.

## Known limitations

- **Sample content only.** The previews use built-in copy. Layout checks describe that copy at that width; they can't predict your real content, and they aren't an accessibility audit.
- **Fonts.** Only the 12 bundled families, Latin subset, upright styles (no italics). There is no letter-spacing control, and the emphasis weight is always derived from the body weight.
- **rem sizes assume a 16px root.** If your site changes the root font size, every exported size scales with it.
- **Small-screen headings need container queries** (Chrome and Edge 105, Safari 16, Firefox 110 or later). Older browsers ignore the rule and keep the desktop sizes. There is one breakpoint, and it changes headings only.
- **Settings stay in this browser.** They are saved to local storage, not an account, so they don't move between browsers or devices. Export the CSS or JSON to keep a copy.
- **Testing so far** has been automated, in the Chromium, Firefox and WebKit browser engines at desktop and phone sizes, plus manual review. Type Bench hasn't yet been tested with screen readers or on physical phones and tablets.

## Fonts and licences

The application code is released under the [MIT licence](LICENSE). The fonts are **not** covered by that licence: each family is distributed under the SIL Open Font License 1.1, and its licence text sits next to the font files in `public/fonts/<family>/OFL.txt`. See [FONTS.md](FONTS.md) for sources, versions, copyright notices and how the files were obtained.

## Project documents

- [CHANGELOG.md](CHANGELOG.md): release notes, including changes to exported files
- [ARCHITECTURE.md](ARCHITECTURE.md): how the app is put together
- [CONTRIBUTING.md](CONTRIBUTING.md): how to propose changes
- [FONTS.md](FONTS.md): font attribution and licence notices

## Author

Designed and built by Olusegun Aribido.
