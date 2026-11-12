# Terminology prerequisites

The course must not use a technical term on an earlier slide than the one that explains it.
`src/terms/*.json` is a checked registry of introductions:

```json
{"terms": [
  {"id": "router",
   "spellings": {"sv": ["router", "routern"], "en": ["router"], "de": ["Router"]},
   "introduced": "Vikter och aktiveringar",
   "note": "MoE-only: its matrix, location before the experts, top-k and weights"}
]}
```

- `introduced` is the exact Swedish `data-title` of the explaining slide.
- `spellings.sv` must cover the inflected forms used in the course; English/German spellings are
  informational for future locale-aware checks.
- The registry is split by module range so ranges can be audited independently.

```bash
(cd src && python3 build.py)
python3 tools/check_terms.py              # fails on use-before-introduction
python3 tools/check_terms.py --write-doc  # refreshes docs/TERMS.md (per-slide list)
python3 tools/check_terms.py --list       # inspect the deck in reading order
```

Rules:

1. **Introduce at first use, not first mention.** A slide that names a term without any
   explanation either gets a short clause at that point or the term is explained earlier.
2. **Keep additions small.** A clause or one sentence beats a new slide; the audit must not turn
   lessons into glossaries.
3. **Ignore non-terms.** Code identifiers, flags, metric names, model names, log lines and anything
   that only appears inside a code/formula block is not vocabulary.
4. **Glossary is separate but consistent.** `src/terms` decides *order*; the glossary (`jd.gloss.*`)
   provides definitions. If a registry term deserves a dictionary entry, add both.
5. **Localized spellings stay localized.** The check runs on the statically filled Swedish text;
   English and German use their own word forms in the same lesson.

`docs/TERMS.md` is generated: it lists, per slide, which terms are introduced there. CI runs the
checker so a later edit cannot silently introduce a term above its explanation.
