# Testing

What has been tested, how, and what hasn't been tested yet.

## Unit tests (in this repository)

`npm test` runs 73 unit tests with Node's built-in test runner. They cover the pure model code in `src/model/`:

- scale maths at full precision, including small-screen heading sizes and the breakpoint boundary;
- export consistency: CSS against the preview's variables, rem against px, CSS against JSON, and the small-screen rule the preview uses against the one the CSS export prints;
- the font catalogue: only supported weights are offered and exported, and weights snap predictably when switching families;
- saved settings: validation and repair, and migration from the version 1 format without any change in appearance;
- reset, and the first-use demonstration's setup.

`npm run typecheck` and `npm run build` also run before each release.

## Automated browser-engine checks (during development)

During development, scripted checks were run with [Playwright](https://playwright.dev/) against the production build, in the **Chromium, Firefox and WebKit browser engines**, at desktop sizes and at phone viewport sizes (390 × 844 and 375 × 667). The first-use and responsive-heading checks were also run against the deployed site after the latest release. Coverage included:

- the first-use introduction and the "See how it works" demonstration, including that saved settings are never overwritten;
- small-screen heading sizes on both sides of the breakpoint and at it, in all three previews;
- body and heading weights in all 12 fonts, with the real font files loaded;
- the downloaded CSS applied to a separate page, compared with the preview at several widths, and the JSON compared with the CSS;
- saved settings across reload, Reset and Undo, and demo restoration, including migration of older saved settings;
- keyboard operation of the main controls, touch-target sizes and the absence of horizontal page scrolling on phone layouts;
- that layout checks refresh after font loading and responsive changes;
- no console errors.

These scripts are not part of this repository. Browser engines are not the same as the branded browsers: WebKit is the engine behind Safari, but the Safari app itself was not driven by these checks.

## Manual checks

The creator has reported that manual checks of the phone layout and of the main workflows passed (October 2026).

## Not yet tested

- **No independent research.** Type Bench hasn't been evaluated in studies or usability sessions with designers. [`docs/beta/FEEDBACK-GUIDE.md`](beta/FEEDBACK-GUIDE.md) describes a session format for doing that.
- **No screen-reader testing.** The interface is built with labelled controls, keyboard support and live announcements, but it hasn't been tested with VoiceOver, NVDA, JAWS or TalkBack.
- **The branded Safari, Firefox and Edge apps**, beyond the creator's own manual checks.
