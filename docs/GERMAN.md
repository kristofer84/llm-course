# German localization

## Scope

Add a complete German catalog and support it throughout the existing single-file course. Keep the
same lesson sequence and stable translation keys. The user selected informal **du**, not formal Sie.
Repository documentation/comments remain English; course explanations and interface labels are
localized. Swedish sample tokens and executable code remain data, not translation targets.

## Translation rules

- Translate values only; do not rename, add, or remove source keys.
- Preserve inline tags, attributes, their order, `{{placeholders}}`, code identifiers, shapes, units,
  formulas, and numeric meaning. Preserve every existing newline in a value; code/formula indentation
  is layout, not expendable whitespace.
- Use the reviewed English catalog as the translation basis; consult Swedish for ambiguity.
- Keep sample strings such as `Katten`, `satt`, `på`, `mattan`, `den`, and `trött` unchanged when they
  are diagram/model data. The shared identity examples are listed in `src/i18n/en/data.json`.
- Use natural standard German and concise imperative instructions: “Ändere …”, “Probiere …”.
- Decimal commas are appropriate in German prose/runtime numbers. Do not localize version numbers,
  source-code literals, or formula/code examples. English billion means German **Milliarde**;
  English trillion means German **Billion**. GB/GiB and FLOP/FLOP/s distinctions must survive.
- Do not weaken technical qualifications or change distractor correctness. Preserve the low-rank
  row-vector convention, cache-complexity caveats, evidence limitations, and simulated/measured split.
- The course is now multilingual (Swedish, English, German), not merely bilingual. Do not reproduce
  a stale two-language claim in the German document metadata.

## Shared terminology

| Concept | German convention |
|---|---|
| weights / activations | Gewichte / Aktivierungen |
| layer | Schicht; retain `layer` inside identifiers/source code |
| token / embedding / logits | Token / Embedding / Logits |
| attention / head | Attention / Head, plural Heads |
| residual stream | Residual Stream; explain with the shared-workspace/notebook analogy |
| inference | Inferenz |
| prefill / decode | Prefill / Decode |
| KV cache / batch / batching | KV-Cache / Batch / Batching |
| memory bandwidth / capacity | Speicherbandbreite / Speicherkapazität |
| throughput / latency | Durchsatz / Latenz |
| training / pretraining | Training / Vortraining (Pretraining at first introduction) |
| fine-tuning / base model | Fine-Tuning / Basismodell |
| loss / gradient / learning rate | Loss (explain as Verlustfunktion) / Gradient / Lernrate |
| preference learning | Präferenzlernen |
| quantization / zero point | Quantisierung / Nullpunkt |
| tool call / orchestrator | Tool-Aufruf / Orchestrator |
| held-out test / regression test | separat zurückgehaltener Test / Regressionstest |
| quality / accuracy | Qualität generally; Genauigkeit for the specific accuracy metric |

Technical names (RoPE, GQA, MLP, SwiGLU, LoRA, QLoRA, SFT, RLHF, DPO, vLLM) remain unchanged.
Avoid gratuitous English prose while retaining established technical vocabulary.

## Integration and acceptance

- Complete catalog coverage and parity of markup, placeholders, digits, and multiline structure.
- Locale-aware glossary sorting and number formatting.
- URL → saved preference → supported browser language → English fallback; preserve slide hashes.
- Per-language editing/provenance commands without disturbing existing English translation state.
- Browser tests for all three languages, including native controls, SVG keyboard controls, 360/390px
  layout, glossary/definition links, copying, expansion, persistence, and language switching.
- Independent German terminology/proofreading and rendered-layout checks after translation.
- Reproducible build, passing CI, Pages deployment, and byte-identical published artifact.
