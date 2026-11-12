# Inside an LLM — from prompt to token

An interactive course in **Swedish, English and German** connecting **what a model computes** to **how a useful inference
system runs**. Follow concrete tensor shapes, manipulate small examples, and reason about memory,
latency, training, model quality, and tool-enabled applications.

**One ordered course, with three selectable depths—not separate curricula.** Prerequisites are
introduced near their first use. New readers start with Basics; existing depth preferences are kept.
Summaries and checkpoints respect the selected depth and the lessons that precede them.

Live: **https://kristofer84.github.io/llm-course/**

## What the course covers

- Scalars, vectors, matrices, tensors, weighted sums, probabilities, logits, and shape compatibility.
- Tokens, embeddings, residual streams, normalization, attention, RoPE, GQA, and MLPs.
- Generation and sampling; parameters versus activations; loss and numerical gradient updates.
- Pretraining, SFT, preferences, RLHF/DPO, LoRA/QLoRA, and the limits of adaptation.
- GPU parallelism, memory capacity/bandwidth, prefill/decode, KV caches, and batching.
- Quantization scales, zero points, groups, outliers, calibration, precision, and quality trade-offs.
- Model variants and vLLM scheduling, execution, adapters, observability, and production operation.
- Interpretability, held-out evaluation, perplexity, regression tests, factuality, and tool orchestration.
- A practical inference-server exercise comparing concurrent workloads, latency distributions,
  throughput, quality, and cost.

The interactive experiments are **small explanatory models**, not performance predictions for a
particular GPU. The core architecture/memory reference is Llama 3 8B. Other checkpoints and
hypothetical examples are labeled separately. vLLM **v0.11.0 V1 is a documentation/source
reference**, not a latest-release recommendation or a claim of GPU-tested compatibility.
The introductory weights/activations demo uses guided fixed-data training, then a frozen-weight
input test. Its slider selects an input, not a learning rate; each training step and reset is verified.
See [the demo contract](docs/INFERENCE-DEMO.md), [technical references](docs/REFERENCES.md),
[training and quantization notes](docs/TRAINING-QUANTIZATION.md), and the
[optional inference lab](docs/INFERENCE-LAB.md).

## Offline artifact and study tools

`llm-kurs.html` contains the course, diagrams, JavaScript, all language catalogs, and vendored i18next.
Download and open it locally: explanations and simulations require no network or GPU. Optional
web fonts fall back to local fonts. External references, package/model downloads, and the real-server
exercise require network access and suitable hardware; they are not prerequisites for the course.
The quality fixtures/scoring client are included in an expandable lesson, and the complete English
lab guide is embedded as an offline download—no broken relative documentation link is required.

The interface includes searchable contents and glossary, contextual definition links, expandable
diagrams, copyable code/formulas, keyboard-operable diagram selections, theme switching, hash
navigation, and persisted progress. Viewed-slide progress and checkpoint scores are labeled
separately: visiting a slide does not prove mastery. The slide counter and module-position bars
count only slides included at the selected depth, while canonical `#sN` URLs stay unchanged. A
manually opened slide outside that depth shows `— / total` with an explanatory tooltip.

## Build

```bash
(cd src && python3 build.py)    # writes llm-kurs.html at the repository root
```

The build assembles source partials and insertion manifests, generates module scaffolding, fills
Swedish statically, and inlines translations and scripts. The `course-revision` HTML metadata is a
reproducible source-content fingerprint for diagnosing stale copies.

## Languages and content editing

- Runtime selection: `?lang=sv` / `?lang=en` / `?lang=de`, saved preference, then the first supported
  browser language (including regional forms such as `de-DE`/`de-AT`). English is the fallback for
  unsupported languages. Switching preserves the current slide hash.
- Sources contain stable explicit keys, such as `<p data-i18n="p3.rmsnorm.2"></p>`.
- `src/i18n/sv/*.json`, `src/i18n/en/*.json` and `src/i18n/de/*.json` are external source catalogs.
  The build fills Swedish for static readability; JavaScript applies the selected translation.
- Teaching examples are locale-native scenario data in `src/examples/{sv,en,de}.json`, not Swedish
  text reused in translations. English uses “The cat sat on the mat”; German uses “Die Katze saß
  auf der Matte”. Counts, grammatical roles and layouts adapt to each scenario.

Use keyed bilingual Markdown rather than editing catalog JSON by hand:

```bash
python3 tools/content.py dump
$EDITOR src/i18n/edit/p3.md
python3 tools/content.py apply
python3 tools/content.py status --all --strict
(cd src && python3 build.py)
python3 tools/check_i18n.py
python3 tests/contracts.py
```

English remains the default editing target. Use `dump --lang de` / `apply --lang de` for German:
its `SV|` / `DE|` files live in `src/i18n/edit/de/`, separate from English edits.

`status --all --strict` rejects missing, behind, **and unreviewed/untracked** translations in every
target. For reviewed bulk source/target edits outside `apply`, use `mark --lang de` (or default
`mark` for English). Each language has independent provenance; marking German does not mark English. Do not use `mark` to hide an untranslated change. Preserve inline markup,
placeholders, sample data, and formula/code line structure. Full rules are in
[`src/i18n/GLOSSARY.md`](src/i18n/GLOSSARY.md).

To add a language, supply a catalog directory with the same keys and rebuild; the language switch
is generated from the available locales. New languages require their own language-specific review
and acceptance testing.

## Localized example data

`tools/build_examples.py` generates the committed packs from a pinned Llama 3 tokenizer artifact.
The downloaded public mirror is byte-identical to the official tokenizer Git blob. Normal builds
and browsers use only the small snapshots, not the tokenizer library/file, model weights, network,
or inference. See [`docs/LOCALIZED-EXAMPLES.md`](docs/LOCALIZED-EXAMPLES.md) for provenance and reproduction.

Verified BPE prompt lengths including BOS are **6 / 6 / 8** for Swedish / English / German. Leading
spaces, actual IDs and subword pieces are preserved; a next token need not finish a word. Separate
word-level attention scenes and character-merge animations are explicitly synthetic. German uses
“denn sie war müde” rather than incorrect subordinate-clause word order. The random miniature
transformer uses a locale vocabulary while verifying cached/full logits within that locale.

Translation templates use `{{example_*}}` variables supplied by the selected pack in both runtime
rendering and static Swedish fill. Modify scenario data through the generator and validate all
coupled roles/counts, not by replacing a few visible words. Architectural model dimensions do not
change. Long sequences remain readable in horizontally scrollable, keyboard-operable diagrams.

## Curriculum and assessment contracts

`src/build.py` contains the shared sequence. `*-manifest.json` files integrate new lessons at
first-use insertion points or declare adjacent modules. Catalog/module identities are stable and
independent of displayed module numbers. New source slides declare `data-level="1|2|3"`; existing
slides can use the classification in `src/leads.py`.

Every question has a depth and explicit lesson prerequisites. Summary prerequisites live in
`src/summary-requirements.json` or an addition manifest; legacy reveal exercises/FAQ entries use
`src/exercise-requirements.json`. Tests reject references to missing,
higher-depth, or later lessons. Assessments persist **question key → option key**, not screen
positions; the legacy migration preserves existing answers when banks move. The substantially
changed old training question is deliberately reset. Visible answer slots are balanced per bank
and selected depth, with a deterministic shuffled order that stays consistent across languages.

Adding slides changes numeric `#sN` positions. Use the contents search to find a named lesson in a
new edition; language switching within an edition keeps its position.

## Tests

```bash
python3 tools/check_i18n.py          # catalogs, markup, placeholders, numeric preservation, IDs/text
python3 tools/content.py status --all --strict
python3 tests/content_editor.py      # isolated per-language editing/provenance and no-edit round trips
node tests/locales.js               # locale precedence, regional detection, German formatting
node tests/foundation_state.js      # guided model math, fixed data, probe independence
python3 tests/inference_demo.py     # actual training/frozen-input/reset transitions in every locale
python3 tests/examples.py            # offline tokenizer/data/merge/role/shift/grammar contracts
python3 tests/example_interactions.py # native examples, dynamic lengths, cached logits, no old SV data
python3 tests/contracts.py           # Node: prerequisites/order, module mapping, balance, migration,
                                    # and bilingual formula/code line structure
python3 tests/smoke.py               # slide navigation, layout, browser errors, controls
python3 tests/test.py                # every slide + screenshots; JS errors fail the run
python3 tests/accessibility.py       # actual Tab/Enter/Space and redraw focus in every language
python3 tests/regressions.py         # depth, simulations, ablation, burst-clicking, study tools,
                                    # and 360px layout in every language
python3 tests/i18n.py                # all-language rendering, switching, browser detection, glossary
```

Static contracts require Node.js. Browser suites require `tests/requirements.txt` and
`python -m playwright install chromium`. They run sequentially: avoid browser fan-out on small
machines. `COURSE_HTML` and `COURSE_SHOTS` override browser artifact/screenshot locations.

The tests validate the teaching website and its simulations. They do **not** install vLLM, execute
CUDA models, benchmark GPUs, or establish production compatibility of server examples.

## Publish and implementation record

GitHub Actions tests pull requests. Successful pushes to `main` build and deploy to Pages; a failed
test blocks publication. The release check compares the published bytes with the final artifact.
The expansion work list and evidence are in [`PLAN.md`](PLAN.md). German localization conventions
and acceptance notes are in [`docs/GERMAN.md`](docs/GERMAN.md).

| Path | Purpose |
|---|---|
| `src/p1.html`, `src/p9.html` | page shell and styles |
| `src/p2.html` … `src/p8.html`, `src/n*.html` | original lesson sources |
| `src/foundations.*` | first-use foundations and prediction experiments |
| `src/training-lab.*` | training/adaptation and quantization experiments |
| `src/operations-lab.*` | evaluation, tools, operation, and practical lab |
| `src/j0.js`, `src/learning.js`, `src/quiz-groups.js` | navigation, persistence, assessment and depth |
| `src/a11y.js`, `src/course-ui.js` | accessible diagram controls and study tools |
| `src/examples.js`, `src/examples/*.json` | locale-native scenario packs and responsive diagram helper |
| `src/j1b.js` … `src/j8.js` | original interactive visualizations |
| `src/jd.js`, `src/jz.js` | original quiz/glossary data and initialization |
| `src/i18n/` | translation engine, catalogs, and editing guide |
| `tools/`, `tests/` | maintained editing/checking tools and acceptance suites |
