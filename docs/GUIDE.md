# Type Bench guide

How the numbers are calculated, how to use the exports, what the layout checks measure, and the current limitations. For a quick overview, see the [README](../README.md).

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

**JSON.** Design Tokens Community Group format: font family, weights, sizes, line heights, composite `typography` tokens, and (when switched on) `font.size.smallScreen` and `breakpoint.smallScreen`. Type Bench's own settings and the font's licence details sit under `$extensions["type-bench"]`. Exports from earlier versions used different weight names; see the [changelog](../CHANGELOG.md).

## What the layout checks can and can't tell you

Layout checks are measured from the rendered preview after fonts have loaded, never estimated from the settings alone. They describe *this sample content at this width*. Line length is an approximation based on average character width. None of these checks is an accessibility audit, and the sample copy can't predict every content problem, so test with your real copy as well.

## Keyboard shortcuts

| Keys | Action |
| --- | --- |
| <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> | Switch between the Editorial, Dashboard and Mobile previews |
| <kbd>←</kbd> <kbd>→</kbd> on a resize handle | Resize by 10px (hold <kbd>Shift</kbd> for 50px; <kbd>Home</kbd>/<kbd>End</kbd> for min/max) |
| <kbd>↑</kbd> <kbd>↓</kbd> in a number field | Step the value (hold <kbd>Shift</kbd> for ×10) |
| <kbd>Esc</kbd> | Close the font picker or export dialog |

## Known limitations

- **Sample content only.** The previews use built-in copy. Layout checks describe that copy at that width; they can't predict your real content, and they aren't an accessibility audit.
- **Fonts.** Only the 12 bundled families, Latin subset, upright styles (no italics). There is no letter-spacing control, and the emphasis weight is always derived from the body weight.
- **rem sizes assume a 16px root.** If your site changes the root font size, every exported size scales with it.
- **Small-screen headings need container queries** (Chrome and Edge 105, Safari 16, Firefox 110 or later). Older browsers ignore the rule and keep the desktop sizes. There is one breakpoint, and it changes headings only.
- **Settings stay in this browser.** They are saved to local storage, not an account, so they don't move between browsers or devices. Export the CSS or JSON to keep a copy.
- **Testing.** See [TESTING.md](TESTING.md) for what has and hasn't been tested.
