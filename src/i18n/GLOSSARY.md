# Working with the text (sv → en)

The course is one HTML file, but the text lives in catalogs, not in the markup:

```
src/i18n/sv/<group>.json     {"key": "svensk text"}      <- source of truth
src/i18n/en/<group>.json     {"key": "english text"}     <- translation
```

The markup only carries the key: `<p data-i18n="p3.rmsnorm.2"></p>`. `build.py` writes the Swedish
text into the page statically and the runtime swaps to English, so a missing translation shows
Swedish — never an empty paragraph.

Groups are named after the file the text came from: `p3` (module text), `n8` (newer module text),
`build` (module names, goals, summaries, templates), `lead` (slide intros), `j6` (visualisation
strings), `jd` (quiz + glossary data), `p1`/`p9` (chrome), `doc` meta keys inside `build`.

## The editing loop

```bash
python3 tools/content.py dump         # src/i18n/edit/<group>.md - text in reading order, keys inline
# edit the SV| / EN| lines in those files (person or agent)
python3 tools/content.py apply        # back into the catalogs
python3 tools/content.py status       # keys where Swedish moved but English did not
(cd src && python3 build.py) && python3 tools/check_i18n.py
```

`apply` is a no-op when nothing changed. A block looks like:

```
@@ p3.rmsnorm.6
## RMSNorm  [p]

SV| Division med RMS bevarar riktningen och bestämmer storleken. ...
EN| Division by the RMS preserves the direction and sets the size. ...
```

## Hard rules

1. **Never rename or renumber a key.** Keys are stable identifiers (`p3.rmsnorm.6`); the point of
   them is that editing the text does not orphan the translation. If a slide is deleted, delete its
   keys; if content is added, use fresh ones.
2. **Keep inline markup byte-identical** — `<b>`, `<i>`, `<code class="mk">`, `<span class="sh a">`,
   `<br>`, `<a …>`: same tags, same attributes, same order, same count. Only the words change.
3. **Keep `{{placeholders}}`** exactly as they are (`{{n}}`, `{{name}}`), same set, both languages.
4. **Never translate code or data.** Identifiers, formulas, shapes (`[T, 4096]`), file paths, flags,
   model names, API calls, CLI output stay verbatim. Inside `<pre class="log">` blocks translate
   nothing — those blocks are not in the catalogs at all.
5. **Numbers stay numbers.** Decimal comma in Swedish, point in English (`8,03 B` ↔ `8.03 B`);
   thousands grouping may differ (`389 120` ↔ `389,120`). `check_i18n.py` compares digits only.
6. **Swedish example words are data.** `katt`, `kattens`, `satt`, `på`, `mattan`, `månen` and the
   sample prompts in `src/i18n/en/data.json` are identity mappings — same text in both languages.
   They are not translation gaps.
7. **`<div class="eq">` blocks keep their line structure.** Multi-line values are stored with `\n`;
   in the Markdown dump each line is its own `SV|` / `EN|` line, and column alignment is part of
   the value (they render with `white-space: pre`).

## Adding text

*New paragraph on an existing slide* — add a block to the group's Markdown with a free key and the
marker `- new`, fill in `SV|` and `EN|`, run `apply`, then put the empty element in the right place:
`<p class="note" data-i18n="p3.rmsnorm.n7"></p>`.

*New slide* — add a `<section class="slide" data-title="…">` with keyed elements (slug +
`.1`, `.2`, …), register the `data-title` in `ORDER` in `src/build.py`, add the `title.<slug>` key,
then dump/apply.

Both are caught by `check_i18n.py`: unused keys, keys without Swedish text, empty elements in the
build, markup/placeholder/number drift.

## Adding a language

Create `src/i18n/de/` with the same file names, fill in what you can, rebuild. The switch button
appears automatically, untranslated keys fall back to Swedish, and `content.py status` lists what is
still missing. Then set `BASE` in `tools/content.py` if you want the side-by-side files to show that
language instead of English.
