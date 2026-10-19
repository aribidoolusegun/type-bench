# Contributing to Type Bench

Thanks for your interest in improving Type Bench. Bug reports, accessibility fixes, better sample content and careful additions are all welcome.

## Before you start

- For anything larger than a small fix, open an issue first to describe the problem and your proposed approach. That avoids duplicated or wasted effort.
- Read [ARCHITECTURE.md](ARCHITECTURE.md). The most important rule is that the preview and the exports must be derived from the same functions, so they can never disagree.

## Setting up

You need Node.js 22.18 or later.

```bash
npm install
npm run dev
```

Before opening a pull request, run:

```bash
npm run typecheck
npm test
npm run build
```

## Guidelines

- **Keep dependencies minimal.** The app runs on React and React DOM alone. Please discuss any new runtime dependency in an issue first.
- **Keep the model pure.** Code in `src/model/` must not touch the DOM, so that it stays testable with `node:test`. Add or update tests there for any change to scale maths, exports, fonts or persistence.
- **Be honest in the interface.** Don't show results that weren't measured, don't present a fallback font as the selected one, and label approximations as approximations.
- **Accessibility is not optional.** New controls need visible labels, keyboard support and a visible focus state. Check your change with the keyboard alone.
- **Match the surrounding style.** Single quotes, no semicolons, two-space indentation, and comments that explain *why*.

## Adding a font

1. Confirm that the family is licensed under the SIL OFL (or another licence that allows redistribution) and that a latin WOFF2 subset is available, ideally a variable `wght` file.
2. Add the file(s) and the licence text, with the copyright line from the font file, to `public/fonts/<id>/`.
3. Read the real weight range and copyright notice from the file (for example with `fontTools`) rather than from a website. Add the entry to `src/model/fonts.ts`.
4. Update the table in [FONTS.md](FONTS.md), the family count in the README and interface copy, and the catalogue test in `src/model/fonts.test.ts`.

## Reporting bugs

Please include your browser and operating system, the steps to reproduce, and what you expected to happen. If the problem involves layout, a screenshot and the preview width help a lot.

## Licence

By contributing, you agree that your contributions to the application code will be licensed under the project's [MIT licence](LICENSE). Font files remain under their own licences.
