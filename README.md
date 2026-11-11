# Inside an LLM — from prompt to token

An interactive course about what a language model is made of: how a prompt flows through it as
tensors with concrete shapes, and how an inference engine such as vLLM serves many users at once.

It ships as **one self-contained HTML file** (`llm-kurs.html`, ~945 KB, no network access needed),
built from the partials in `src/`. It is bilingual — Swedish source text and English — with a
language switch in the top bar, and it is written to be read at three levels of depth: the basics
track, the advanced track, and up to expert level including real vLLM internals.

Live: **https://kristofer84.github.io/llm-course/**

## Build

```bash
cd src && python3 build.py      # writes ../llm-kurs.html
```

`build.py` assembles the slides, generates module openers/summaries/quizzes, inlines the catalogues
and i18next, and writes the base language (Swedish) into the markup statically.

## Languages (i18n)

- One file, runtime switch, `?lang=sv` / `?lang=en`, choice persisted in `localStorage`,
  `<html lang>` updated. First visit follows the browser: Swedish for Swedish readers, English
  otherwise.
- [i18next](https://www.i18next.com/) is vendored inline (`src/vendor/i18next.min.js`), so the page
  stays a single offline file.
- Sources carry **keys, not text**: `<p data-i18n="p3.rmsnorm.2"></p>`. Swedish lives in
  `src/i18n/sv/*.json` (the source of truth), English in `src/i18n/en/*.json`, 2 664 keys.
- `build.py` fills the Swedish text into the page statically, which keeps the shipped file readable
  (and greppable) without JavaScript, and means a missing translation shows Swedish rather than an
  empty paragraph. The runtime only swaps to English.
- `src/i18n/engine.js` — `L.t()`, `L.num()`, `L.apply()` (also resolves `data-i18n-*` attributes and
  `data-i18n-vars` template keys), `L.setLang()`, and `L.missing` for "lookups that did not resolve".
- `src/i18n/en/data.json` holds deliberate identity mappings: Swedish sample tokens such as `katt`,
  `satt`, `mattan` are the data the diagrams are drawn from and stay identical in both languages.

## Editing the text

The catalogs are keyed, which is safe but unpleasant to read. `tools/content.py` renders them as one
Markdown file per group, in the order the course shows them, with the key on every block and both
languages side by side — the form to hand to a person or a model:

```bash
python3 tools/content.py dump        # -> src/i18n/edit/<group>.md (generated, gitignored)
$EDITOR src/i18n/edit/p3.md          # change the SV| / EN| lines
python3 tools/content.py apply       # back into the catalogs
python3 tools/content.py status      # keys where Swedish moved on but English did not
python3 tools/content.py mark        # after a bulk edit that updated both languages
(cd src && python3 build.py) && python3 tools/check_i18n.py
```

`apply` records which Swedish text each English value was translated from
(`src/i18n/.translation-state.json`), so "the English is behind" is a list instead of a silent
regression. Rules, including how to add a paragraph or a slide, are in
[`src/i18n/GLOSSARY.md`](src/i18n/GLOSSARY.md).

## Adding a language

Create `src/i18n/de/` with the same file names, fill in what you can and rebuild: the switch button
appears automatically, untranslated keys fall back to Swedish, and `tools/content.py status` lists
what is missing.

## Tests

```bash
python3 tools/check_i18n.py        # static, no browser: coverage, inline markup, placeholders,
                                   # numbers, empty elements in the build, unused keys
python3 tools/content.py status    # untranslated / behind counters
python3 tests/smoke.py             # layout, JS errors, interactions (needs Playwright)
python3 tests/test.py              # clicks through every slide, writes 129 screenshots
python3 tests/i18n.py              # renders both languages, asserts no Swedish left in English
```

The Playwright suites need a venv from `tests/requirements.txt` plus
`python -m playwright install chromium`.

## Publish

GitHub Actions (`.github/workflows/pages.yml`): on a push to `main` it runs the test job
(smoke, click-through, static i18n check, translation state, both-languages render), then builds
`_site/` and deploys to GitHub Pages. Pull requests run the same test job without deploying.

## Layout

| path | what |
|---|---|
| `src/p1.html`, `src/p9.html` | page shell: head, top bar, drawers, footer |
| `src/p2.html` … `src/p8.html`, `src/n*.html` | slides, one `<section class="slide">` each |
| `src/j0.js`, `src/jd.js`, `src/jz.js` | deck engine, quiz/glossary data, init |
| `src/j1b.js` … `src/j8.js` | the interactive visualisations |
| `src/build.py` | assembles the course, generates module slides, fills the base language |
| `src/i18n/` | engine, catalogs, translation guide |
| `tools/` | static checker, Markdown content editor, one-shot migration tools |
| `tests/` | Playwright suites and the i18n acceptance test |
