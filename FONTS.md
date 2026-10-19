# Fonts: attribution and licences

Type Bench ships 12 font families. All of them are licensed under the **SIL Open Font License, Version 1.1**. That licence is separate from the MIT licence that covers the Type Bench application code: the fonts are **not** MIT-licensed.

Each family's licence text, with its copyright notice, is in `public/fonts/<family>/OFL.txt` and ships with the built site.

## Where the files come from

The WOFF2 files are the **latin subset** published by [Fontsource](https://fontsource.org/) (npm packages version 5.3.x, downloaded October 2026), which repackages the Google Fonts releases. Type Bench redistributes these files unmodified. The weight ranges and copyright notices below were read from the font files themselves (their `fvar` and `name` tables).

The latin subset covers basic Latin, Latin-1 Supplement (for example é, ö, £) and common punctuation and symbols (for example –, —, “ ”, €, ™, −). Characters outside that range fall back to a system font.

| Family | Category | Files | Weight axis | Copyright notice (from the font file) |
| --- | --- | --- | --- | --- |
| DM Sans | Sans serif | Variable `wght` | 100–1000 | Copyright 2014 The DM Sans Project Authors (https://github.com/googlefonts/dm-fonts) |
| Inter | Sans serif | Variable `wght` | 100–900 | Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter) |
| Manrope | Sans serif | Variable `wght` | 200–800 | Copyright 2019 The Manrope Project Authors (https://github.com/sharanda/manrope) |
| Work Sans | Sans serif | Variable `wght` | 100–900 | Copyright 2019 The Work Sans Project Authors (https://github.com/weiweihuanghuang/Work-Sans) |
| Source Sans 3 | Sans serif | Variable `wght` | 200–900 | © 2023 Adobe (http://www.adobe.com/), with Reserved Font Name ‘Source’ |
| Roboto | Sans serif | Variable `wght` | 100–900 | Copyright 2011 The Roboto Project Authors (https://github.com/googlefonts/roboto-classic) |
| Open Sans | Sans serif | Variable `wght` | 300–800 | Copyright 2020 The Open Sans Project Authors (https://github.com/googlefonts/opensans) |
| Montserrat | Sans serif | Variable `wght` | 100–900 | Copyright 2011 The Montserrat Project Authors (https://github.com/JulietaUla/Montserrat) |
| Poppins | Sans serif | Static, one file per weight | 100–900 | Copyright 2020 The Poppins Project Authors (https://github.com/itfoundry/Poppins) |
| Nunito Sans | Sans serif | Variable `wght` | 200–1000 | Copyright 2016 The Nunito Sans Project Authors (https://github.com/Fonthausen/NunitoSans) |
| Lora | Serif | Variable `wght` | 400–700 | Copyright 2011 The Lora Project Authors (https://github.com/cyrealtype/Lora-Cyrillic), with Reserved Font Name "Lora" |
| Merriweather | Serif | Variable `wght` | 300–900 | Copyright 2024 The Merriweather Project Authors (https://github.com/EbenSorkin/Merriweather4) with Reserved Font Name "Merriweather" |

Type Bench offers every weight in steps of 100 across the full range of the shipped files, so DM Sans and Nunito Sans go up to 1000. The font picker, weight control, help text and exports all read this range from the same catalogue entry.

### A note on Source Sans 3

The `LICENSE` file in the Fontsource package for Source Sans 3 gives the copyright holder only as “Google Inc.”, which doesn't match the notice embedded in the font file. `public/fonts/source-sans-3/OFL.txt` therefore uses the copyright line from the font file itself (Adobe, with Reserved Font Name ‘Source’), followed by the unchanged OFL 1.1 text.

## Reserved Font Names

Lora, Merriweather and Source Sans 3 declare Reserved Font Names. Under the OFL, a *modified* version of these fonts may not use the reserved name. Type Bench doesn't modify the files: it serves the subsets exactly as published. If you subset or otherwise alter them yourself, read the [OFL FAQ](https://openfontlicense.org/ofl-faq/) first.

## Using these fonts in your own project

Type Bench's exports name the font, but naming a font in CSS doesn't load it. Each CSS export explains three ways to load it:

1. self-host the WOFF2 files with `@font-face`;
2. install the matching Fontsource npm package (note that Fontsource's variable packages register the family with a ` Variable` suffix, for example `"Inter Variable"`);
3. link the Google Fonts stylesheet.

Whichever you choose, keep the OFL licence text with any font files you distribute.
