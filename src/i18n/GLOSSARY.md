# Working with multilingual course text

The course ships in one offline HTML file; its prose lives in stable-key catalogs:

```
src/i18n/sv/<group>.json     Swedish source of truth
src/i18n/en/<group>.json     English
src/i18n/de/<group>.json     German (informal du)
```

Markup carries keys, not authored text: `<p data-i18n="p3.rmsnorm.2"></p>`. The build fills Swedish
statically; the runtime selects Swedish, English or German. The selected language's glossary
collation and number formatting are used. German terminology/style is documented in
[`docs/GERMAN.md`](../../docs/GERMAN.md).

## Editing

English remains the default target; its existing commands and paths are unchanged:

```bash
python3 tools/content.py dump
# edit SV| / EN| in src/i18n/edit/<group>.md
python3 tools/content.py apply
```

Select German explicitly:

```bash
python3 tools/content.py dump --lang de
# edit SV| / DE| in src/i18n/edit/de/<group>.md
python3 tools/content.py apply --lang de
python3 tools/content.py status --all --strict
(cd src && python3 build.py)
python3 tools/check_i18n.py
```

Each generated block retains the key and reading context:

```
@@ p3.rmsnorm.6
## RMSNorm  [p]

SV| Division med RMS bevarar riktningen och bestämmer storleken. ...
DE| Die Division durch den RMS erhält die Richtung und bestimmt die Größe. ...
```

Repeated `SV|` / `DE|` lines preserve value line breaks, including blank lines and indentation.
`apply` without edits is a no-op for the catalogs. Wrong-language markers are rejected rather than
silently clearing a translation. Runtime diagram labels, quiz/glossary entries and document metadata
are included after the ordered static prose, so the editing surface covers every key.

Catalog files retain ownership even when their names differ from key prefixes. For example,
`mod.*`, `lead.*`, `title.*` and `doc.*` live in `build.json`; `fd.*` lives in `foundations.json`.
The editor does not create duplicate `mod.json`/`fd.json` files when updating those keys.

## Translation provenance

Each target tracks which Swedish text it was reviewed against:

- English: `src/i18n/.translation-state.json` (existing format/path retained).
- German: `src/i18n/.translation-state.de.json`.
- Other targets follow `.translation-state.<locale>.json`.

```bash
python3 tools/content.py status --lang de --strict
python3 tools/content.py status --all --strict
python3 tools/content.py mark --lang de     # only after reviewing a bulk source/German edit
```

Strict status rejects missing, behind and unreviewed entries. Editing Swedish can make **both**
translations stale; reviewing/marking German does not mark English as reviewed, or vice versa.
Never use `mark` simply to hide an untranslated change.

## Hard rules

1. **Keep keys stable.** Ordinary wording changes update values, not key names. New content uses
   fresh keys. If a slide is deleted, remove its keys from every language.
2. **Preserve inline markup exactly:** tags, attributes, order, and count. Translate only the words.
   This includes `<b>`, `<i>`, `<span class="sh a">`, `<br>` and links.
3. **Preserve `{{placeholders}}`** and interpolation meaning in every language.
4. **Preserve executable code/identifiers:** model names, flags, file paths and CLI logs remain
   verbatim. Explanatory prose is translated. Teaching sample data is localized through scenario
   packs, not by editing individual display strings or program identifiers.
5. **Preserve numeric meaning and units.** German prose uses decimal commas; version numbers and
   code/formula literals do not change. English billion is German Milliarde, trillion is Billion.
   GB/GiB, KiB/KB and FLOP/FLOP/s are different quantities.
6. **Keep examples coherent within their locale.** `src/examples/{sv,en,de}.json` supplies native
   prompts, word-level semantic roles, verified tokenizer pieces/IDs, candidates and grammar graphs.
   Templates use `{{example_*}}` variables. Counts, shifted targets, caches, speculative matches and
   layouts can differ by locale; model architectural constants cannot. Reproduce packs with
   `tools/build_examples.py` and run the example contracts. Old Swedish identity catalogs are removed.
7. **Keep formula/code line structure and alignment.** Whitespace in `.eq` blocks is visual layout,
   not normalization noise. The contracts check multiline parity for every target language.
8. **Preserve technical qualifications.** Translation must not turn illustrative calculations,
   model-specific observations or documentation references into universal/measured claims.

## Adding content or a language

For a paragraph, add `@@ <fresh-key> - new` to an edit file, supply source and target text, apply,
and insert the keyed element into the source HTML. Complete the other target languages before
publication; CI checks all catalogs and their independent provenance.

For a new slide, register its Swedish identifier in the sequence or insertion manifest, provide its
explicit depth and title/prose keys, and update relevant prerequisite metadata, summaries and quizzes.
See `README.md` for the curriculum contracts.

For another language, create the catalog directory with matching keys and a coherent localized
scenario pack, translate, review and `mark --lang <locale>`. The switch and supported-browser detection are extensible; browser
and static suites discover shipped locales. Add language-specific number/terminology checks where
needed. The single-file build must remain fully offline.
