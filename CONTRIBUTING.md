# Contributing to Type Bench

Thanks for your interest in improving Type Bench. Bug reports, accessibility fixes, better sample content and careful additions are all welcome.

## Reporting a bug

Open an issue using the **Bug report** template. It asks for:

1. **Where:** the live site (type-bench.vercel.app) or a local build (with the commit, from `git log -1 --oneline`).
2. **Browser and device:** for example "Safari 19 on iPhone 15" or "Firefox 140 on Windows 11".
3. **Steps to reproduce**, starting from a fresh visit if you can.
4. **What you expected and what happened.**
5. **The preview:** which one (Editorial, Dashboard or Mobile) and the Preview width.
6. **Your settings:** the easiest way is to open **Export → JSON tokens → Download JSON** and attach the file. It lists your type settings under `$extensions["type-bench"]`, so the same system can be recreated.
7. **A screenshot or short recording**, if the problem is visual.

If Type Bench won't load at all, say so and include any errors from the browser console.

Security problems should be reported privately instead; see [SECURITY.md](SECURITY.md).

## Before you start

- For anything larger than a small fix, open an issue first to describe the problem and your proposed approach. That avoids duplicated or wasted effort.
- Read [ARCHITECTURE.md](ARCHITECTURE.md). The most important rule is that the preview and the exports must be derived from the same functions, so they can never disagree.

## Running the project

You need [Node.js](https://nodejs.org/) 22.18 or later (`node --version` to check). The tests rely on Node's built-in TypeScript support, which older versions don't have.

```bash
git clone https://github.com/aribidoolusegun/type-bench.git
cd type-bench
npm install
npm run dev        # opens on http://localhost:5173
```

Your settings in the local app are saved in that browser's local storage for `localhost`, separately from the live site. To start again as a first-time visitor, use **Reset** and **About Type Bench**, or clear the site data for `localhost`.

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

## Licence

By contributing, you agree that your contributions to the application code will be licensed under the project's [MIT licence](LICENSE). Font files remain under their own licences.
