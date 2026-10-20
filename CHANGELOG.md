# Changelog

## 2026-10-20: Release preparation (documentation only)

- The README is now a short overview with a live demo link, a current screenshot and a recording. Calculations, export usage, keyboard shortcuts and known limitations moved to [docs/GUIDE.md](docs/GUIDE.md), and the testing statement to [docs/TESTING.md](docs/TESTING.md).
- New screenshots and a recording of the current interface are in `docs/screenshots` and `docs/media`. Images and recordings from earlier builds moved to `docs/history`.
- CONTRIBUTING explains how to run the project and report a bug, with a matching GitHub issue template.
- The page description and package description use the new one-line summary.
- `LICENSE` now contains only the standard MIT text, so tools can recognise it. The note that the bundled fonts are licensed separately under the SIL Open Font License 1.1 remains in the README, FONTS.md and each font's `OFL.txt`.

## 2026-10-19: Responsive headings and separate weights

### Added

- **Small-screen headings.** An optional "Adjust for small screens" setting gives Display, H1, H2 and H3 their own ratio below a breakpoint. Body text, captions and line heights don't change. Which sizes apply is decided by the preview's own width, and the preview and the CSS export use the same container rule.
  - The first time it is switched on, the heading ratio starts at the scale ratio, so nothing changes size. Switching it off only disables the effect: the ratio and breakpoint are kept and come back when it is switched on again. Reset clears them.
- **Separate body and heading weights**, replacing the single weight. Labels, buttons and table headers still use the emphasis weight, two steps above the body weight.
- **One Preview width control** above the canvas, with presets. The width slider in the Layout testing panel has been removed.

### Changed in exported files

If you use a CSS or JSON file exported from an earlier version, update these names.

**CSS**

| Before | Now |
| --- | --- |
| `--font-weight-text` | `--font-weight-body` |
| (none) | `--font-weight-heading`, used in the usage example by `h1`–`h3` (previously `--font-weight-text`) and `.display` (previously no weight set) |
| (none) | With small-screen headings on: a `.type-scope` container rule and an `@container type-scope (width < …px)` block. Add `class="type-scope"` to the element that holds your content; the file explains how to use a viewport `@media` query instead. |

**JSON (Design Tokens)**

| Before | Now |
| --- | --- |
| `font.weight.text` | `font.weight.body` |
| (none) | `font.weight.heading` |
| `typography.*.$value.fontWeight: "{font.weight.text}"` | `"{font.weight.heading}"` for Display–H3, `"{font.weight.body}"` for Body and Caption |
| `$extensions["type-bench"].settings.weight` | `$extensions["type-bench"].settings.bodyWeight` and `.headingWeight` |
| `$extensions["type-bench"].formatVersion: 1` | `2` |
| (none) | `$extensions["type-bench"].settings.smallScreen`: `{ "enabled": false }` when off; the heading ratio, breakpoint and what it measures when on |
| (none) | With small-screen headings on: `font.size.smallScreen.*`, `typography.smallScreen.*` and `breakpoint.smallScreen` |

### Saved settings

Settings saved in the browser move from version 1 to version 2. Version 1 settings are migrated automatically and look exactly as before: the old weight becomes both the body and the heading weight, and small-screen headings start switched off.

### Known limitations

See [Known limitations](README.md#known-limitations) in the README. In short: sample content only, the 12 bundled fonts (Latin, upright), rem sizes assume a 16px root, small-screen headings need container-query support, settings stay in one browser, and no screen-reader or physical-device testing yet.

## 2026-10-19: First-use introduction

- A compact introduction above the preview, a "See how it works" demonstration that shows a real overflow and restores your settings, and an "About Type Bench" action that reopens it.
- "Stress test" was renamed "Layout testing", and "Diagnostics" became "Layout checks".

## 2026-10-19: Public beta

- First public beta at https://type-bench.vercel.app.
